import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RosterEnrollment, RosterPayment, RosterStudent } from '@/lib/roster';
import type { EnrollmentStatus } from '@/types';
import { invalidateOperations, operationsKeys } from './operationsQueries';

export interface RosterPaymentRecord extends RosterPayment {
  id: string;
  method: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
  void_reason: string | null;
}

export interface CourseRosterData {
  enrollments: RosterEnrollment[];
  students: RosterStudent[];
  payments: RosterPaymentRecord[];
}

const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

/** Enrollments of one course with the student profiles and all their payments (admin only). */
export const useCourseRoster = (courseId: string) =>
  useQuery({
    queryKey: operationsKeys.roster(courseId),
    enabled: !!courseId,
    queryFn: async (): Promise<CourseRosterData> => {
      const { data: enrollments, error } = await supabase
        .from('user_course_assignments')
        .select('id, user_id, course_id, status, agreed_price, activated_by, enabled_from, expires_at, notes, group_id')
        .eq('course_id', courseId);
      if (error) throw error;

      const rows = (enrollments || []).map((e) => ({ ...e, agreed_price: Number(e.agreed_price) })) as RosterEnrollment[];
      if (rows.length === 0) return { enrollments: [], students: [], payments: [] };

      const userIds = rows.map((e) => e.user_id);
      const enrollmentIds = rows.map((e) => e.id);

      const students: RosterStudent[] = [];
      for (const ids of chunk(userIds, 100)) {
        const { data, error: studentsError } = await supabase.from('profiles').select('id, name, phone').in('id', ids);
        if (studentsError) throw studentsError;
        students.push(...(data || []));
      }

      const payments: RosterPaymentRecord[] = [];
      for (const ids of chunk(enrollmentIds, 100)) {
        const { data, error: paymentsError } = await supabase
          .from('payments')
          .select('id, enrollment_id, amount, method, paid_at, reference, notes, created_at, voided_at, void_reason')
          .in('enrollment_id', ids);
        if (paymentsError) throw paymentsError;
        payments.push(...(data || []).map((p) => ({ ...p, amount: Number(p.amount) })));
      }

      return { enrollments: rows, students, payments };
    },
  });

export interface EnrollStudentInput {
  userId: string;
  courseId: string;
  agreedPrice: number;
  enabledFrom?: string | null;
  expiresAt?: string | null;
  /** Optional group of the course; its price/capacity rules apply in the database. */
  groupId?: string | null;
}

/** Creates a pending enrollment; the DB activates it right away when the agreed price is 0. */
export const useEnrollStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, courseId, agreedPrice, enabledFrom, expiresAt, groupId }: EnrollStudentInput) => {
      const { error } = await supabase.from('user_course_assignments').insert({
        user_id: userId,
        course_id: courseId,
        agreed_price: agreedPrice,
        enabled_from: enabledFrom || new Date().toISOString(),
        expires_at: expiresAt || null,
        group_id: groupId || null,
      });
      if (error) throw error;
      return courseId;
    },
    onSuccess: (courseId) => invalidateOperations(queryClient, courseId),
  });
};

export interface UpdateEnrollmentInput {
  id: string;
  courseId: string;
  patch: {
    agreed_price?: number;
    status?: EnrollmentStatus;
    enabled_from?: string | null;
    expires_at?: string | null;
  };
}

/**
 * Updates an enrollment and returns its resulting state: DB triggers may flip the
 * status afterwards (e.g. a fully paid enrollment returned to pending becomes active).
 */
export const useUpdateEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: UpdateEnrollmentInput) => {
      const { error } = await supabase.from('user_course_assignments').update(patch).eq('id', id);
      if (error) throw error;
      const { data, error: readError } = await supabase
        .from('user_course_assignments')
        .select('status, activated_by')
        .eq('id', id)
        .single();
      if (readError) throw readError;
      return data;
    },
    onSuccess: (_data, { courseId }) => invalidateOperations(queryClient, courseId),
  });
};

/** Enrollment ids of a student keyed by course, e.g. right after creating the account. */
export const fetchEnrollmentIdsByCourse = async (userId: string): Promise<Record<string, string>> => {
  const { data, error } = await supabase.from('user_course_assignments').select('id, course_id').eq('user_id', userId);
  if (error) throw error;
  return Object.fromEntries((data || []).map((e) => [e.course_id, e.id]));
};
