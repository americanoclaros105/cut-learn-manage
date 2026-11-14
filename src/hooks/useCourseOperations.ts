import { useMemo } from 'react';
import { useCourseRoster } from '@/hooks/useEnrollments';
import { useCourseSessions, type SessionGroupFilter } from '@/hooks/useClassSessions';
import { buildRosterRows } from '@/lib/roster';

/**
 * Roster rows (name-sorted) plus class sessions and attendance of a course.
 * `sessionGroup` limits the sessions (and therefore the attendance stats) to
 * one group; undefined = whole course, null = sessions without group.
 */
export const useCourseOperations = (courseId: string, sessionGroup?: SessionGroupFilter) => {
  const roster = useCourseRoster(courseId);
  const sessionsQuery = useCourseSessions(courseId, sessionGroup);

  const records = useMemo(() => sessionsQuery.data?.records ?? [], [sessionsQuery.data]);
  const sessions = useMemo(() => sessionsQuery.data?.sessions ?? [], [sessionsQuery.data]);
  const rows = useMemo(
    () =>
      buildRosterRows(
        roster.data?.enrollments ?? [],
        roster.data?.students ?? [],
        roster.data?.payments ?? [],
        records,
      ).sort((a, b) => a.student.name.localeCompare(b.student.name, 'es')),
    [roster.data, records],
  );

  return { roster, sessionsQuery, rows, sessions, records };
};
