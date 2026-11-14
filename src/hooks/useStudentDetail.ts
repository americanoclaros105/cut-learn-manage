import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { StudentAttendanceRecord, StudentSession } from '@/lib/studentDetail';
import { toPaymentRecord, type PaymentRecord } from './usePayments';

/**
 * Read hooks for the student page. Keys start with ['student', id] so
 * `invalidateOperations` (which invalidates ['student']) refreshes all of them.
 */

/** Every payment of the student (voided included), newest first. */
export const useStudentPayments = (studentId: string) =>
  useQuery({
    queryKey: ['student', studentId, 'payments'],
    enabled: !!studentId,
    queryFn: async (): Promise<PaymentRecord[]> => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', studentId)
        .order('paid_at', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(toPaymentRecord);
    },
  });

export interface StudentAttendanceData {
  sessions: StudentSession[];
  records: StudentAttendanceRecord[];
}

/** Sessions of the given courses and this student's attendance records. */
export const useStudentAttendance = (studentId: string, courseIds: string[]) =>
  useQuery({
    queryKey: ['student', studentId, 'attendance', [...courseIds].sort().join(',')],
    enabled: !!studentId,
    queryFn: async (): Promise<StudentAttendanceData> => {
      if (courseIds.length === 0) return { sessions: [], records: [] };
      const { data: sessions, error } = await supabase
        .from('class_sessions')
        .select('id, course_id, starts_at, topic, location')
        .in('course_id', courseIds);
      if (error) throw error;
      const { data: records, error: recordsError } = await supabase
        .from('attendance')
        .select('session_id, status')
        .eq('user_id', studentId);
      if (recordsError) throw recordsError;
      return { sessions: sessions || [], records: records || [] };
    },
  });

/** Completed lessons of the student (admins can read any user's progress). */
export const useStudentLessonProgress = (studentId: string) =>
  useQuery({
    queryKey: ['student', studentId, 'progress'],
    enabled: !!studentId,
    queryFn: async (): Promise<Array<{ course_id: string; lesson_id: string }>> => {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('course_id, lesson_id')
        .eq('user_id', studentId);
      if (error) throw error;
      return data || [];
    },
  });
