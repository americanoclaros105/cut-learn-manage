import type { QueryClient } from '@tanstack/react-query';

/** Query keys shared by the academy operations hooks (roster, payments, accounting). */
export const operationsKeys = {
  roster: (courseId: string) => ['roster', courseId] as const,
  sessions: (courseId: string) => ['class-sessions', courseId] as const,
  enrollmentPayments: (enrollmentId: string) => ['payments', 'enrollment', enrollmentId] as const,
  ledger: ['payments', 'ledger'] as const,
  receivables: ['enrollments', 'receivables'] as const,
  groups: (courseId: string) => ['groups', courseId] as const,
  group: (groupId: string) => ['group', groupId] as const,
};

/**
 * Enrollment state and payments are linked by DB triggers, so after any
 * enrollment or payment change everything that shows money or access refreshes.
 */
export const invalidateOperations = (queryClient: QueryClient, courseId?: string | null) => {
  if (courseId) queryClient.invalidateQueries({ queryKey: operationsKeys.roster(courseId) });
  else queryClient.invalidateQueries({ queryKey: ['roster'] });
  queryClient.invalidateQueries({ queryKey: ['payments'] });
  queryClient.invalidateQueries({ queryKey: operationsKeys.receivables });
  queryClient.invalidateQueries({ queryKey: ['students'] });
  // Student detail page (profile, enrollments, payments, attendance of one student).
  queryClient.invalidateQueries({ queryKey: ['student'] });
};

/**
 * Group changes (edit, schedule, transfer, generated sessions) touch the group
 * lists, class sessions and, through enrollments, the roster and student pages.
 */
export const invalidateGroups = (queryClient: QueryClient, courseId?: string | null) => {
  if (courseId) queryClient.invalidateQueries({ queryKey: operationsKeys.groups(courseId) });
  else queryClient.invalidateQueries({ queryKey: ['groups'] });
  queryClient.invalidateQueries({ queryKey: ['group'] });
  if (courseId) queryClient.invalidateQueries({ queryKey: operationsKeys.sessions(courseId) });
  else queryClient.invalidateQueries({ queryKey: ['class-sessions'] });
  invalidateOperations(queryClient, courseId);
};
