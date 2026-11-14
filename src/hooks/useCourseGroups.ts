import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { groupErrorMessage } from '@/lib/groups';
import type { CourseGroup, CourseGroupSchedule, CourseGroupWithStats, GroupScheduleSlot } from '@/types';
import { invalidateGroups, operationsKeys } from './operationsQueries';

const GROUP_SELECT =
  'id, course_id, name, start_date, end_date, location, instructor, capacity, price, color, notes, archived_at, created_at, updated_at';
const SCHEDULE_SELECT = 'id, group_id, weekday, start_time, end_time';

/** Throws an Error whose message is already friendly (full group, duplicate name, ...). */
const check = (error: unknown) => {
  if (error) throw new Error(groupErrorMessage(error));
};

type GroupRow = Omit<CourseGroup, 'price'> & { price: number | string | null };
type OccupancyRow = { group_id: string | null; enrolled: number | null; seats_left: number | null };

const toGroups = (
  rows: GroupRow[],
  schedules: CourseGroupSchedule[],
  occupancy: OccupancyRow[],
): CourseGroupWithStats[] =>
  rows.map((g) => {
    const occ = occupancy.find((o) => o.group_id === g.id);
    return {
      ...g,
      price: g.price === null ? null : Number(g.price),
      schedules: schedules.filter((s) => s.group_id === g.id),
      enrolled: occ?.enrolled ?? 0,
      seats_left: occ?.seats_left ?? null,
    };
  });

const loadGroups = async (filter: { courseId?: string; courseIds?: string[]; groupId?: string }): Promise<CourseGroupWithStats[]> => {
  let groupsQuery = supabase.from('course_groups').select(GROUP_SELECT).order('start_date', { ascending: false });
  if (filter.courseId) groupsQuery = groupsQuery.eq('course_id', filter.courseId);
  if (filter.courseIds) groupsQuery = groupsQuery.in('course_id', filter.courseIds);
  if (filter.groupId) groupsQuery = groupsQuery.eq('id', filter.groupId);
  const { data: groups, error } = await groupsQuery;
  check(error);
  if (!groups || groups.length === 0) return [];

  const ids = groups.map((g) => g.id);
  const [{ data: schedules, error: schedulesError }, { data: occupancy, error: occupancyError }] = await Promise.all([
    supabase.from('course_group_schedules').select(SCHEDULE_SELECT).in('group_id', ids),
    supabase.from('group_occupancy').select('group_id, enrolled, seats_left').in('group_id', ids),
  ]);
  check(schedulesError);
  check(occupancyError);
  return toGroups(groups, schedules || [], occupancy || []);
};

/** Groups of a course (archived included) with weekly schedule and occupancy, newest first (admin only). */
export const useCourseGroups = (courseId: string) =>
  useQuery({
    queryKey: operationsKeys.groups(courseId),
    enabled: !!courseId,
    queryFn: () => loadGroups({ courseId }),
  });

/** Groups of several courses at once (e.g. the courses a student is enrolled in); empty list skips the request. */
export const useGroupsForCourses = (courseIds: string[]) =>
  useQuery({
    queryKey: [...operationsKeys.groups('many'), [...courseIds].sort().join(',')],
    enabled: courseIds.length > 0,
    queryFn: () => loadGroups({ courseIds }),
  });

/** One group with its schedule and occupancy; resolves to null when it does not exist. */
export const useCourseGroup = (groupId: string | undefined) =>
  useQuery({
    queryKey: operationsKeys.group(groupId ?? ''),
    enabled: !!groupId,
    queryFn: async () => (await loadGroups({ groupId: groupId! }))[0] ?? null,
  });

export interface CourseGroupValues {
  name: string;
  start_date: string;
  end_date: string;
  location?: string | null;
  instructor?: string | null;
  capacity?: number | null;
  price?: number | null;
  color?: string | null;
  notes?: string | null;
}

export interface SaveCourseGroupInput {
  /** Present to update, absent to create. */
  id?: string;
  courseId: string;
  values: CourseGroupValues;
  /** When provided, replaces the weekly schedule atomically; omit to leave it as is. */
  schedules?: GroupScheduleSlot[];
}

const blankToNull = (value: string | null | undefined): string | null => value?.trim() || null;

/** Creates or updates a group and (optionally) replaces its weekly schedule. Returns the group id. */
export const useSaveCourseGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, courseId, values, schedules }: SaveCourseGroupInput): Promise<string> => {
      const row = {
        name: values.name.trim(),
        start_date: values.start_date,
        end_date: values.end_date,
        location: blankToNull(values.location),
        instructor: blankToNull(values.instructor),
        capacity: values.capacity ?? null,
        price: values.price ?? null,
        color: blankToNull(values.color),
        notes: blankToNull(values.notes),
      };

      let groupId = id;
      if (id) {
        const { error } = await supabase.from('course_groups').update(row).eq('id', id);
        check(error);
      } else {
        const { data, error } = await supabase
          .from('course_groups')
          .insert({ ...row, course_id: courseId })
          .select('id')
          .single();
        check(error);
        groupId = data!.id;
      }

      if (schedules && groupId) {
        const { error } = await supabase.rpc('replace_group_schedules', {
          _group_id: groupId,
          _items: schedules.map((s) => ({
            weekday: s.weekday,
            start_time: s.start_time.slice(0, 5),
            end_time: s.end_time.slice(0, 5),
          })),
        });
        check(error);
      }
      return groupId!;
    },
    onSuccess: (_id, { courseId }) => invalidateGroups(queryClient, courseId),
  });
};

/** Archives (or restores) a group; archived groups keep their students, sessions and payments. */
export const useArchiveCourseGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; courseId: string; archived: boolean }) => {
      const { error } = await supabase
        .from('course_groups')
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq('id', id);
      check(error);
    },
    onSuccess: (_r, { courseId }) => invalidateGroups(queryClient, courseId),
  });
};

/** Deletes a group (its sessions and schedule go with it). Refused while students are enrolled in it. */
export const useDeleteCourseGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; courseId: string }) => {
      const { count, error: countError } = await supabase
        .from('user_course_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', id);
      check(countError);
      if ((count ?? 0) > 0) {
        throw new Error('El grupo tiene estudiantes inscritos. Muévelos a otro grupo o archiva el grupo.');
      }
      const { error } = await supabase.from('course_groups').delete().eq('id', id);
      check(error);
    },
    onSuccess: (_r, { courseId }) => invalidateGroups(queryClient, courseId),
  });
};

/**
 * Builds the sessions of a group from its weekly schedule and returns how many were created.
 * With replaceFuture, future generated sessions without attendance are rebuilt first.
 */
export const useGenerateGroupSessions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, replaceFuture = false }: { groupId: string; courseId: string; replaceFuture?: boolean }) => {
      const { data, error } = await supabase.rpc('generate_group_sessions', {
        _group_id: groupId,
        _replace_future: replaceFuture,
      });
      check(error);
      return data ?? 0;
    },
    onSuccess: (_n, { courseId }) => invalidateGroups(queryClient, courseId),
  });
};

/** Moves an enrollment to another group of the same course; payments and status are untouched. */
export const useTransferEnrollmentGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ enrollmentId, groupId }: { enrollmentId: string; courseId: string; groupId: string }) => {
      const { error } = await supabase.rpc('transfer_enrollment_group', {
        _enrollment_id: enrollmentId,
        _group_id: groupId,
      });
      check(error);
    },
    onSuccess: (_r, { courseId }) => invalidateGroups(queryClient, courseId),
  });
};
