import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AttendanceUpsertRow } from '@/lib/roster';
import type { AttendanceStatus } from '@/types';
import { operationsKeys } from './operationsQueries';

export interface ClassSession {
  id: string;
  course_id: string;
  starts_at: string;
  ends_at: string | null;
  topic: string | null;
  location: string | null;
  notes: string | null;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  user_id: string;
  status: AttendanceStatus;
  notes: string | null;
}

export interface CourseSessionsData {
  sessions: ClassSession[];
  records: AttendanceRecord[];
}

/** Sessions of a course (newest first) with every attendance record. */
export const useCourseSessions = (courseId: string) =>
  useQuery({
    queryKey: operationsKeys.sessions(courseId),
    enabled: !!courseId,
    queryFn: async (): Promise<CourseSessionsData> => {
      const { data: sessions, error } = await supabase
        .from('class_sessions')
        .select('id, course_id, starts_at, ends_at, topic, location, notes')
        .eq('course_id', courseId)
        .order('starts_at', { ascending: false });
      if (error) throw error;
      if (!sessions || sessions.length === 0) return { sessions: [], records: [] };

      const records: AttendanceRecord[] = [];
      const ids = sessions.map((s) => s.id);
      for (let i = 0; i < ids.length; i += 100) {
        const { data, error: recordsError } = await supabase
          .from('attendance')
          .select('id, session_id, user_id, status, notes')
          .in('session_id', ids.slice(i, i + 100));
        if (recordsError) throw recordsError;
        records.push(...(data || []));
      }
      return { sessions, records };
    },
  });

export interface CreateSessionInput {
  courseId: string;
  startsAt: string;
  endsAt?: string | null;
  topic?: string;
  location?: string;
}

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, startsAt, endsAt, topic, location }: CreateSessionInput) => {
      const { error } = await supabase.from('class_sessions').insert({
        course_id: courseId,
        starts_at: startsAt,
        ends_at: endsAt || null,
        topic: topic?.trim() || null,
        location: location?.trim() || null,
      });
      if (error) throw error;
      return courseId;
    },
    onSuccess: (courseId) => queryClient.invalidateQueries({ queryKey: operationsKeys.sessions(courseId) }),
  });
};

/** Upserts the whole roll call of a session on (session_id, user_id). */
export const useSaveAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rows }: { courseId: string; rows: AttendanceUpsertRow[] }) => {
      if (rows.length === 0) return;
      const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'session_id,user_id' });
      if (error) throw error;
    },
    onSuccess: (_r, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: operationsKeys.sessions(courseId) });
    },
  });
};
