import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StudentProfile {
  id: string;
  name: string;
  phone: string | null;
  status: 'active' | 'inactive' | 'suspended';
  enabled_from: string;
  expires_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  email?: string;
  assigned_courses?: string[];
}

export interface CourseAssignment {
  id: string;
  user_id: string;
  course_id: string;
  assigned_at: string;
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

      // Get course assignments for each student
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_course_assignments')
        .select('*')
        .in('user_id', studentIds);
      
      if (assignmentsError) throw assignmentsError;

      // Combine data
      return profiles?.map(profile => ({
        ...profile,
        assigned_courses: assignments
          ?.filter(a => a.user_id === profile.id)
          .map(a => a.course_id) || [],
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
        .select('course_id')
        .eq('user_id', studentId);
      
      if (assignmentsError) throw assignmentsError;

      return {
        ...profile,
        assigned_courses: assignments?.map(a => a.course_id) || [],
      } as StudentProfile;
    },
    enabled: !!studentId,
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, assigned_courses, ...updates }: Partial<StudentProfile> & { id: string }) => {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);
      
      if (profileError) throw profileError;

      // Update course assignments if provided
      if (assigned_courses !== undefined) {
        // Remove all current assignments
        await supabase
          .from('user_course_assignments')
          .delete()
          .eq('user_id', id);
        
        // Add new assignments
        if (assigned_courses.length > 0) {
          const { error: assignError } = await supabase
            .from('user_course_assignments')
            .insert(
              assigned_courses.map(courseId => ({
                user_id: id,
                course_id: courseId,
              }))
            );
          
          if (assignError) throw assignError;
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

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (studentId: string) => {
      // This will cascade delete profile and assignments due to FK constraints
      const { error } = await supabase.auth.admin.deleteUser(studentId);
      
      // If admin delete fails (no service role), just delete profile
      if (error) {
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', studentId);
        
        if (profileError) throw profileError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useAssignCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, courseId }: { userId: string; courseId: string }) => {
      const { error } = await supabase
        .from('user_course_assignments')
        .insert({ user_id: userId, course_id: courseId });
      
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
