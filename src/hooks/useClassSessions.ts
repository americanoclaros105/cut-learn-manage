import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AttendanceUpsertRow } from '@/lib/roster';
import { groupErrorMessage } from '@/lib/groups';
import type { AttendanceStatus, SessionStatus } from '@/types';
import { operationsKeys } from './operationsQueries';

export interface ClassSession {
  id: string;
  course_id: string;
  starts_at: string;
  ends_at: string | null;
  topic: string | null;
  location: string | null;
  notes: string | null;
  group_id: string | null;
  status: SessionStatus;
  cancel_reason: string | null;
  generated: boolean;
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

/**
 * Group filter: undefined = every session of the course, null = only sessions
 * without group ("Sin grupo", legacy), string = one group.
 */
export type SessionGroupFilter = string | null | undefined;

const sessionsKey = (courseId: string, groupId: SessionGroupFilter) =>
  groupId === undefined ? operationsKeys.sessions(courseId) : ([...operationsKeys.sessions(courseId), groupId ?? 'none'] as const);

/** Sessions of a course (newest first) with every attendance record, optionally for one group. */
export const useCourseSessions = (courseId: string, groupId?: SessionGroupFilter) =>
  useQuery({
    queryKey: sessionsKey(courseId, groupId),
    enabled: !!courseId,
    queryFn: async (): Promise<CourseSessionsData> => {
      let query = supabase
        .from('class_sessions')
        .select('id, course_id, starts_at, ends_at, topic, location, notes, group_id, status, cancel_reason, generated')
        .eq('course_id', courseId)
        .order('starts_at', { ascending: false });
      if (groupId === null) query = query.is('group_id', null);
      else if (groupId !== undefined) query = query.eq('group_id', groupId);
      const { data, error } = await query;
      if (error) throw error;
      const sessions = (data || []) as ClassSession[];
      if (sessions.length === 0) return { sessions: [], records: [] };

      const records: AttendanceRecord[] = [];
      const ids = sessions.map((s) => s.id);
      for (let i = 0; i < ids.length; i += 100) {
        const { data: batch, error: recordsError } = await supabase
          .from('attendance')
          .select('id, session_id, user_id, status, notes')
          .in('session_id', ids.slice(i, i + 100));
        if (recordsError) throw recordsError;
        records.push(...(batch || []));
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
  /** Optional: attach the session to a group of the course. */
  groupId?: string | null;
}

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, startsAt, endsAt, topic, location, groupId }: CreateSessionInput) => {
      const { error } = await supabase.from('class_sessions').insert({
        course_id: courseId,
        starts_at: startsAt,
        ends_at: endsAt || null,
        topic: topic?.trim() || null,
        location: location?.trim() || null,
        group_id: groupId || null,
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

/** Cancels a session with a reason, or restores it. Attendance already recorded is kept. */
export const useSetSessionCancelled = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      cancelled,
      reason,
    }: {
      sessionId: string;
      courseId: string;
      cancelled: boolean;
      reason?: string;
    }) => {
      const { error } = await supabase
        .from('class_sessions')
        .update(
          cancelled
            ? { status: 'cancelled', cancel_reason: reason?.trim() || null }
            : { status: 'scheduled', cancel_reason: null },
        )
        .eq('id', sessionId);
      if (error) throw new Error(groupErrorMessage(error));
    },
    onSuccess: (_r, { courseId }) => queryClient.invalidateQueries({ queryKey: operationsKeys.sessions(courseId) }),
  });
};
