import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { effectiveAccess, enrollmentBalance } from '@/lib/operations';
import type { EffectiveAccess, EnrollmentStatus } from '@/types';

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  completed_at: string;
  last_accessed_at: string;
}

export const useUserProgress = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as LessonProgress[];
    },
    enabled: !!user?.id,
  });
};

export const useCourseProgress = (courseId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['progress', user?.id, courseId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId);
      
      if (error) throw error;
      return data as LessonProgress[];
    },
    enabled: !!user?.id && !!courseId,
  });
};

export const useMarkLessonComplete = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ lessonId, courseId }: { lessonId: string; courseId: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          course_id: courseId,
          completed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,lesson_id',
        });
      
      if (error) throw error;
    },
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['progress', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['progress', user?.id, courseId] });
    },
  });
};

export interface MyEnrollment {
  id: string;
  course_id: string;
  status: EnrollmentStatus;
  enabled_from: string | null;
  expires_at: string | null;
  agreed_price: number;
  paid: number;
  balance: number;
  access: EffectiveAccess;
}

/** The student's own enrollments with access state and payment balance. */
export const useMyEnrollments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-enrollments', user?.id],
    queryFn: async (): Promise<MyEnrollment[]> => {
      if (!user?.id) return [];

      const { data: enrollments, error } = await supabase
        .from('user_course_assignments')
        .select('id, course_id, status, enabled_from, expires_at, agreed_price')
        .eq('user_id', user.id);
      if (error) throw error;

      // RLS lets students read only their own payments.
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('enrollment_id, amount, voided_at')
        .eq('user_id', user.id);
      if (paymentsError) throw paymentsError;

      const now = new Date();
      return (enrollments || []).map((e) => {
        const { paid, balance } = enrollmentBalance(
          e.agreed_price,
          (payments || []).filter((p) => p.enrollment_id === e.id),
        );
        return {
          ...e,
          agreed_price: Number(e.agreed_price),
          paid,
          balance,
          access: effectiveAccess(e, now),
        };
      });
    },
    enabled: !!user?.id,
  });
};

/** Ids of the courses the student can open right now (active enrollment within its dates). */
export const useUserAssignedCourses = () => {
  const query = useMyEnrollments();
  return {
    ...query,
    data: (query.data || []).filter((e) => e.access === 'active').map((e) => e.course_id),
  };
};
