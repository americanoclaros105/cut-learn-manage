import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { filterAgenda, type AgendaFilters, type AgendaRange, type AgendaSessionLike } from '@/lib/agenda';
import { localDay } from '@/lib/groupViews';
import type { SessionStatus } from '@/types';

/** A class of any course with the group and course data the agenda needs (admin only). */
export interface AgendaSession extends AgendaSessionLike {
  topic: string | null;
  location: string | null;
  cancel_reason: string | null;
  course_title: string;
  group: { name: string; color: string | null; instructor: string | null; location: string | null } | null;
  /** Students in the group; null for classes without group. */
  enrolled: number | null;
  /** True when at least one attendance record exists, i.e. the roll call was taken. */
  rollCallTaken: boolean;
}

export const ALL_FILTERS: AgendaFilters = { courseId: 'all', groupId: 'all', showCancelled: true };

const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

/**
 * Classes of every course whose start falls in [range.from, range.to), oldest
 * first. Filters apply on top of the cached range, so toggling them is instant.
 */
export const useAgendaSessions = (range: AgendaRange, filters: AgendaFilters = ALL_FILTERS) => {
  const from = range.from.toISOString();
  const to = range.to.toISOString();
  const { courseId, groupId, showCancelled } = filters;

  return useQuery({
    queryKey: ['agenda', from, to],
    queryFn: async (): Promise<AgendaSession[]> => {
      const { data, error } = await supabase
        .from('class_sessions')
        .select(
          'id, course_id, group_id, starts_at, ends_at, topic, location, status, cancel_reason, courses(title), course_groups(name, color, instructor, location)',
        )
        .gte('starts_at', from)
        .lt('starts_at', to)
        .order('starts_at', { ascending: true });
      if (error) throw error;
      const rows = data || [];
      if (rows.length === 0) return [];

      const sessionIds = rows.map((r) => r.id);
      const groupIds = [...new Set(rows.map((r) => r.group_id).filter((id): id is string => !!id))];

      const withRecords = new Set<string>();
      for (const ids of chunk(sessionIds, 100)) {
        const { data: records, error: recordsError } = await supabase.from('attendance').select('session_id').in('session_id', ids);
        if (recordsError) throw recordsError;
        for (const r of records || []) withRecords.add(r.session_id);
      }

      const enrolledByGroup = new Map<string, number>();
      if (groupIds.length > 0) {
        const { data: occupancy, error: occupancyError } = await supabase
          .from('group_occupancy')
          .select('group_id, enrolled')
          .in('group_id', groupIds);
        if (occupancyError) throw occupancyError;
        for (const o of occupancy || []) if (o.group_id) enrolledByGroup.set(o.group_id, o.enrolled ?? 0);
      }

      return rows.map((r) => ({
        id: r.id,
        course_id: r.course_id,
        group_id: r.group_id,
        starts_at: r.starts_at,
        ends_at: r.ends_at,
        topic: r.topic,
        location: r.location,
        status: r.status as SessionStatus,
        cancel_reason: r.cancel_reason,
        course_title: r.courses?.title ?? 'Curso',
        group: r.course_groups,
        enrolled: r.group_id ? (enrolledByGroup.get(r.group_id) ?? 0) : null,
        rollCallTaken: withRecords.has(r.id),
      }));
    },
    select: (sessions) => filterAgenda(sessions, { courseId, groupId, showCancelled }),
  });
};

/** Id, name and color of the live groups, for the agenda filter. */
export interface GroupOption {
  id: string;
  course_id: string;
  name: string;
  color: string | null;
}

export const useGroupOptions = () =>
  useQuery({
    queryKey: ['groups', 'options'],
    queryFn: async (): Promise<GroupOption[]> => {
      const { data, error } = await supabase
        .from('course_groups')
        .select('id, course_id, name, color')
        .is('archived_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

export interface UpcomingGroup {
  id: string;
  course_id: string;
  course_title: string;
  name: string;
  color: string | null;
  start_date: string;
  capacity: number | null;
  enrolled: number;
}

/** Next groups that have not started yet, soonest first. */
export const useUpcomingGroups = (limit = 5) =>
  useQuery({
    queryKey: ['groups', 'upcoming', limit],
    queryFn: async (): Promise<UpcomingGroup[]> => {
      const { data, error } = await supabase
        .from('course_groups')
        .select('id, course_id, name, color, start_date, capacity, courses(title)')
        .is('archived_at', null)
        .gt('start_date', localDay(new Date()))
        .order('start_date', { ascending: true })
        .limit(limit);
      if (error) throw error;
      const rows = data || [];
      if (rows.length === 0) return [];

      const { data: occupancy, error: occupancyError } = await supabase
        .from('group_occupancy')
        .select('group_id, enrolled')
        .in('group_id', rows.map((r) => r.id));
      if (occupancyError) throw occupancyError;
      const enrolled = new Map((occupancy || []).map((o) => [o.group_id, o.enrolled ?? 0]));

      return rows.map((r) => ({
        id: r.id,
        course_id: r.course_id,
        course_title: r.courses?.title ?? 'Curso',
        name: r.name,
        color: r.color,
        start_date: r.start_date,
        capacity: r.capacity,
        enrolled: enrolled.get(r.id) ?? 0,
      }));
    },
  });
