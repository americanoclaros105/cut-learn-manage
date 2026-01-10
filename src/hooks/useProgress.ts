import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

export const useUserAssignedCourses = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['assigned-courses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_course_assignments')
        .select('course_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data?.map(a => a.course_id) || [];
    },
    enabled: !!user?.id,
  });
};
