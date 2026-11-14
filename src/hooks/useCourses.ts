import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseTheme {
  primary: string;
  accent: string;
  background: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  duration: string | null;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  status: 'published' | 'draft' | 'archived';
  category: string | null;
  tags: string[];
  theme_colors?: CourseTheme;
  created_at: string;
  updated_at: string;
  modules?: Module[];
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_num: number;
  created_at: string;
  lessons?: Lesson[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  path?: string;
  size: number;
  type: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  type: 'video' | 'pdf' | 'text' | 'image' | 'link' | 'quiz';
  content: string | null;
  duration: string | null;
  is_required: boolean;
  order_num: number;
  thumbnail?: string;
  attachments?: Attachment[];
  created_at: string;
}

export const useCourses = (options?: { status?: 'published' | 'draft' | 'archived' }) => {
  return useQuery({
    queryKey: ['courses', options?.status],
    queryFn: async () => {
      let query = supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Course[];
    },
  });
};

export interface CourseWithStats extends Course {
  lesson_count: number;
}

export const useCoursesWithStats = (options?: { status?: 'published' | 'draft' | 'archived' }) => {
  return useQuery({
    queryKey: ['courses-with-stats', options?.status],
    queryFn: async () => {
      let query = supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      
      const { data: courses, error } = await query;
      if (error) throw error;

      // Lessons are no longer readable by anonymous visitors (RLS), so counts
      // come from a content-free SECURITY DEFINER function.
      const { data: counts, error: countsError } = await supabase.rpc('course_outline_counts');
      if (countsError) console.error('course_outline_counts failed', countsError);
      const lessonCounts = new Map((counts || []).map((c) => [c.course_id, c.lesson_count]));

      return (courses || []).map((course) => ({
        ...course,
        lesson_count: lessonCounts.get(course.id) ?? 0,
      })) as unknown as CourseWithStats[];
    },
  });
};

export const useCourseWithModules = (courseId: string) => {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      // Fetch course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (courseError) throw courseError;

      // Fetch modules
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_num');
      
      if (modulesError) throw modulesError;

      // Fetch lessons for each module
      const modulesWithLessons = await Promise.all(
        (modules || []).map(async (module) => {
          const { data: lessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .eq('module_id', module.id)
            .order('order_num');
          
          if (lessonsError) throw lessonsError;
          return { ...module, lessons: lessons || [] };
        })
      );

      return { ...course, modules: modulesWithLessons } as unknown as Course;
    },
    enabled: !!courseId,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (course: Partial<Course>) => {
      const { data, error } = await supabase
        .from('courses')
        .insert([course as any])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Course> & { id: string }) => {
      const { data, error } = await supabase
        .from('courses')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', data.id] });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

// Module mutations
export const useCreateModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (module: Partial<Module>) => {
      const { data, error } = await supabase
        .from('modules')
        .insert([module as any])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course', data.course_id] });
    },
  });
};

export const useUpdateModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, course_id, ...updates }: Partial<Module> & { id: string; course_id: string }) => {
      const { data, error } = await supabase
        .from('modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, course_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course', data.course_id] });
    },
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ moduleId, courseId }: { moduleId: string; courseId: string }) => {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);
      
      if (error) throw error;
      return courseId;
    },
    onSuccess: (courseId) => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
};

// Lesson mutations
export const useCreateLesson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ courseId, ...lesson }: Partial<Lesson> & { courseId: string }) => {
      const { data, error } = await supabase
        .from('lessons')
        .insert([lesson as any])
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, courseId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course', data.courseId] });
    },
  });
};

export const useUpdateLesson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, courseId, ...updates }: Partial<Lesson> & { id: string; courseId: string }) => {
      const { data, error } = await supabase
        .from('lessons')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, courseId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course', data.courseId] });
    },
  });
};

export const useDeleteLesson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ lessonId, courseId }: { lessonId: string; courseId: string }) => {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);
      
      if (error) throw error;
      return courseId;
    },
    onSuccess: (courseId) => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
};
