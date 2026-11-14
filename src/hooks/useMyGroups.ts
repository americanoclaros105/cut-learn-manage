import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { AttendanceStatus, CourseGroupSchedule, SessionStatus } from '@/types';

export interface MyGroupSession {
  id: string;
  group_id: string | null;
  starts_at: string;
  ends_at: string | null;
  topic: string | null;
  location: string | null;
  status: SessionStatus;
  cancel_reason: string | null;
}

export interface MyGroupInfo {
  id: string;
  course_id: string;
  name: string;
  color: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  instructor: string | null;
  schedules: CourseGroupSchedule[];
  /**
   * Classes of the group. RLS only returns them while the student has course
   * access, so this is empty for pending or suspended enrollments.
   */
  sessions: MyGroupSession[];
  /** The student's own attendance by session id. */
  attendance: Record<string, AttendanceStatus>;
}

/**
 * Groups of the student's enrollments with weekly schedule, classes and own
 * attendance. Groups and schedules are readable by their students; sessions only
 * with course access, so every part degrades to an empty list instead of failing.
 */
export const useMyGroups = (groupIds: string[]) => {
  const { user } = useAuth();
  const key = [...groupIds].sort().join(',');

  return useQuery({
    queryKey: ['my-groups', user?.id, key],
    enabled: !!user?.id && groupIds.length > 0,
    queryFn: async (): Promise<MyGroupInfo[]> => {
      const [groups, schedules, sessions] = await Promise.all([
        supabase.from('course_groups').select('id, course_id, name, color, start_date, end_date, location, instructor').in('id', groupIds),
        supabase.from('course_group_schedules').select('id, group_id, weekday, start_time, end_time').in('group_id', groupIds),
        supabase
          .from('class_sessions')
          .select('id, group_id, starts_at, ends_at, topic, location, status, cancel_reason')
          .in('group_id', groupIds)
          .order('starts_at', { ascending: true }),
      ]);
      if (groups.error) throw groups.error;
      // Sessions and schedules are optional extras: a failure there must not hide the group itself.
      const sessionRows = (sessions.error ? [] : sessions.data || []) as MyGroupSession[];

      const attendance: Record<string, AttendanceStatus> = {};
      if (sessionRows.length > 0 && user?.id) {
        const { data } = await supabase.from('attendance').select('session_id, status').eq('user_id', user.id);
        for (const r of data || []) attendance[r.session_id] = r.status as AttendanceStatus;
      }

      return (groups.data || []).map((g) => ({
        ...g,
        schedules: schedules.error ? [] : (schedules.data || []).filter((s) => s.group_id === g.id),
        sessions: sessionRows.filter((s) => s.group_id === g.id),
        attendance,
      }));
    },
  });
};
