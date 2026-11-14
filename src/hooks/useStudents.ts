import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { diffEnrollments } from '@/lib/operations';
import type { EnrollmentStatus } from '@/types';

type RawAssignment = Omit<CourseAssignment, 'paid_total' | 'payment_count'>;

/** Attaches payment totals to enrollments (admin only; students cannot read others' payments). */
const withPaymentTotals = async (assignments: RawAssignment[]): Promise<CourseAssignment[]> => {
  if (assignments.length === 0) return [];
  const ids = assignments.map((a) => a.id);
  const payments: Array<{ enrollment_id: string | null; amount: number; voided_at: string | null }> = [];
  // Chunked to keep the request URL short.
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await supabase
      .from('payments')
      .select('enrollment_id, amount, voided_at')
      .in('enrollment_id', ids.slice(i, i + 100));
    if (error) throw error;
    payments.push(...(data || []));
  }

  return assignments.map((a) => {
    const own = payments.filter((p) => p.enrollment_id === a.id);
    return {
      ...a,
      payment_count: own.length,
      paid_total: own.filter((p) => !p.voided_at).reduce((sum, p) => sum + Number(p.amount), 0),
    };
  });
};

export interface CourseAssignment {
  id: string;
  user_id: string;
  course_id: string;
  assigned_at: string;
  enabled_from: string | null;
  expires_at: string | null;
  notes: string | null;
  status: EnrollmentStatus;
  agreed_price: number;
  activated_by: string | null;
  /** Sum of non-voided payments (admin views only). */
  paid_total?: number;
  /** Number of payments (voided included) linked to this enrollment. */
  payment_count?: number;
}

/** Desired enrollment sent by the admin form; new ones are always created pending. */
export interface EnrollmentInput {
  course_id: string;
  enabled_from?: string;
  expires_at?: string;
  notes?: string;
  agreed_price?: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  status: 'active' | 'inactive' | 'suspended';
  enabled_from: string;
  expires_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  email?: string;
  assigned_courses?: CourseAssignment[];
}

export const useStudents = () => {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      // Get all users with student role
      const { data: studentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');
      
      if (rolesError) throw rolesError;
      
      const studentIds = studentRoles?.map(r => r.user_id) || [];
      
      if (studentIds.length === 0) return [];

      // Get profiles for students
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds)
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;

      // Get course assignments for each student with all fields
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_course_assignments')
        .select('*')
        .in('user_id', studentIds);
      
      if (assignmentsError) throw assignmentsError;

      const enrollments = await withPaymentTotals((assignments || []) as RawAssignment[]);

      // Combine data
      return profiles?.map(profile => ({
        ...profile,
        assigned_courses: enrollments.filter(a => a.user_id === profile.id),
      })) as StudentProfile[];
    },
  });
};

export const useStudent = (studentId: string) => {
  return useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (profileError) throw profileError;

      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_course_assignments')
        .select('*')
        .eq('user_id', studentId);
      
      if (assignmentsError) throw assignmentsError;

      return {
        ...profile,
        assigned_courses: await withPaymentTotals((assignments || []) as RawAssignment[]),
      } as StudentProfile;
    },
    enabled: !!studentId,
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      name: string;
      phone?: string;
      avatar?: string;
      status?: 'active' | 'inactive' | 'suspended';
      enabled_from?: string;
      expires_at?: string;
      notes?: string;
      courses?: EnrollmentInput[];
    }) => {
      const { data: response, error } = await supabase.functions.invoke('create-student', {
        body: data,
      });

      if (error) throw error;
      if (!response.success) throw new Error(response.error);
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      assigned_courses,
      ...updates
    }: Omit<Partial<StudentProfile>, 'assigned_courses'> & { id: string; assigned_courses?: EnrollmentInput[] }) => {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          phone: updates.phone,
          avatar: updates.avatar,
          status: updates.status,
          enabled_from: updates.enabled_from,
          expires_at: updates.expires_at,
          notes: updates.notes,
        })
        .eq('id', id);
      
      if (profileError) throw profileError;

      // Update course assignments if provided
      if (assigned_courses !== undefined) {
        // Diff against the current enrollments instead of delete + reinsert, so
        // status, activation source and payment links are preserved.
        const { data: current, error: currentError } = await supabase
          .from('user_course_assignments')
          .select('id, course_id')
          .eq('user_id', id);
        if (currentError) throw currentError;

        const { toInsert, toUpdate, toDelete } = diffEnrollments(current || [], assigned_courses);

        if (toDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('user_course_assignments')
            .delete()
            .in('id', toDelete.map((e) => e.id));
          if (deleteError) throw deleteError;
        }

        for (const enrollment of toUpdate) {
          const { error: updateError } = await supabase
            .from('user_course_assignments')
            .update({
              enabled_from: enrollment.enabled_from || new Date().toISOString(),
              expires_at: enrollment.expires_at || null,
              notes: enrollment.notes || null,
              ...(enrollment.agreed_price !== undefined && { agreed_price: enrollment.agreed_price }),
            })
            .eq('id', enrollment.id);
          if (updateError) throw updateError;
        }

        if (toInsert.length > 0) {
          // New enrollments start as pending (column default); the agreed price
          // falls back to the course price server-side when omitted.
          const { error: insertError } = await supabase
            .from('user_course_assignments')
            .insert(
              toInsert.map(course => ({
                user_id: id,
                course_id: course.course_id,
                enabled_from: course.enabled_from || new Date().toISOString(),
                expires_at: course.expires_at || null,
                notes: course.notes || null,
                agreed_price: course.agreed_price ?? null,
              }))
            );
          if (insertError) throw insertError;
        }
      }

      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', id] });
    },
  });
};

export const useUpdateStudentPassword = () => {
  return useMutation({
    mutationFn: async ({ studentId, newPassword }: { studentId: string; newPassword: string }) => {
      const { data: response, error } = await supabase.functions.invoke('update-student-password', {
        body: { student_id: studentId, new_password: newPassword },
      });

      if (error) throw error;
      if (!response.success) throw new Error(response.error);
      
      return response;
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (studentId: string) => {
      const { data: response, error } = await supabase.functions.invoke('delete-student', {
        body: { student_id: studentId },
      });

      if (error) throw error;
      if (!response.success) throw new Error(response.error);
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useAssignCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      courseId,
      enabledFrom,
      expiresAt,
      notes,
    }: { 
      userId: string; 
      courseId: string;
      enabledFrom?: string;
      expiresAt?: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('user_course_assignments')
        .insert({ 
          user_id: userId, 
          course_id: courseId,
          enabled_from: enabledFrom || new Date().toISOString(),
          expires_at: expiresAt || null,
          notes: notes || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useUnassignCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, courseId }: { userId: string; courseId: string }) => {
      const { error } = await supabase
        .from('user_course_assignments')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};
