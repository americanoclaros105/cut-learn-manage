import { attendanceStats, enrollmentBalance } from '@/lib/operations';
import type { AttendanceStats, AttendanceStatus, EnrollmentStatus } from '@/types';

/**
 * Pure logic for the course roster and the attendance roll call. No Supabase
 * or React imports so it can be unit tested.
 */

export interface RosterEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  agreed_price: number;
  activated_by: string | null;
  enabled_from: string | null;
  expires_at: string | null;
  notes: string | null;
  /** Cohort of the course; null/absent = "Sin grupo" (legacy enrollments). */
  group_id?: string | null;
}

export interface RosterStudent {
  id: string;
  name: string;
  phone: string | null;
}

export interface RosterPayment {
  enrollment_id: string | null;
  amount: number;
  paid_at: string;
  voided_at: string | null;
}

export interface RosterAttendance {
  user_id: string;
  status: AttendanceStatus;
}

export interface RosterRow {
  enrollment: RosterEnrollment;
  student: RosterStudent;
  agreed: number;
  paid: number;
  balance: number;
  isFullyPaid: boolean;
  /** Payments linked to the enrollment, voided ones included. */
  paymentCount: number;
  lastPaymentAt: string | null;
  attendance: AttendanceStats;
}

export const buildRosterRows = (
  enrollments: RosterEnrollment[],
  students: RosterStudent[],
  payments: RosterPayment[],
  attendance: RosterAttendance[],
): RosterRow[] => {
  const studentById = new Map(students.map((s) => [s.id, s]));
  return enrollments.map((enrollment) => {
    const own = payments.filter((p) => p.enrollment_id === enrollment.id);
    const { paid, balance, isFullyPaid } = enrollmentBalance(enrollment.agreed_price, own);
    const valid = own.filter((p) => !p.voided_at).map((p) => p.paid_at);
    return {
      enrollment,
      student: studentById.get(enrollment.user_id) ?? { id: enrollment.user_id, name: 'Estudiante', phone: null },
      agreed: Number(enrollment.agreed_price),
      paid,
      balance,
      isFullyPaid,
      paymentCount: own.length,
      lastPaymentAt: valid.length ? valid.reduce((a, b) => (a > b ? a : b)) : null,
      attendance: attendanceStats(attendance.filter((a) => a.user_id === enrollment.user_id)),
    };
  });
};

export interface RosterKpis {
  /** Enrollments that are not cancelled. */
  enrolled: number;
  active: number;
  pending: number;
  suspended: number;
  cancelled: number;
  totalAgreed: number;
  totalPaid: number;
  /** Outstanding receivable; overpayments never reduce it below 0 per enrollment. */
  totalBalance: number;
  /** Global (present + late) / countable, null when there are no records. */
  avgAttendance: number | null;
}

export const rosterKpis = (rows: RosterRow[]): RosterKpis => {
  const live = rows.filter((r) => r.enrollment.status !== 'cancelled');
  const countable = live.reduce((n, r) => n + r.attendance.present + r.attendance.late + r.attendance.absent, 0);
  const attended = live.reduce((n, r) => n + r.attendance.present + r.attendance.late, 0);
  const count = (s: EnrollmentStatus) => rows.filter((r) => r.enrollment.status === s).length;
  return {
    enrolled: live.length,
    active: count('active'),
    pending: count('pending'),
    suspended: count('suspended'),
    cancelled: count('cancelled'),
    totalAgreed: live.reduce((n, r) => n + r.agreed, 0),
    totalPaid: live.reduce((n, r) => n + r.paid, 0),
    totalBalance: live.reduce((n, r) => n + Math.max(0, r.balance), 0),
    avgAttendance: countable === 0 ? null : attended / countable,
  };
};

export const normalizeSearch = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export type RosterStatusFilter = 'all' | EnrollmentStatus;

export const filterRoster = (
  rows: RosterRow[],
  { search, status }: { search: string; status: RosterStatusFilter },
): RosterRow[] => {
  const q = normalizeSearch(search);
  return rows.filter((r) => {
    if (status !== 'all' && r.enrollment.status !== status) return false;
    if (!q) return true;
    return (
      normalizeSearch(r.student.name).includes(q) ||
      (r.student.phone ?? '').replace(/\D/g, '').includes(q.replace(/\D/g, '') || '\u0000')
    );
  });
};

export const statusCounts = (rows: RosterRow[]): Record<RosterStatusFilter, number> => ({
  all: rows.length,
  pending: rows.filter((r) => r.enrollment.status === 'pending').length,
  active: rows.filter((r) => r.enrollment.status === 'active').length,
  suspended: rows.filter((r) => r.enrollment.status === 'suspended').length,
  cancelled: rows.filter((r) => r.enrollment.status === 'cancelled').length,
});

// ---------------------------------------------------------------------------
// Roll call
// ---------------------------------------------------------------------------

export interface RollCallEntry {
  status: AttendanceStatus;
  notes: string;
}

/** Draft attendance keyed by user id. */
export type RollCallDraft = Record<string, RollCallEntry>;

export const markAll = (userIds: string[], status: AttendanceStatus, draft: RollCallDraft): RollCallDraft => {
  const next: RollCallDraft = { ...draft };
  for (const id of userIds) next[id] = { status, notes: draft[id]?.notes ?? '' };
  return next;
};

export const isRollCallDirty = (saved: RollCallDraft, draft: RollCallDraft): boolean => {
  const ids = new Set([...Object.keys(saved), ...Object.keys(draft)]);
  for (const id of ids) {
    const a = saved[id];
    const b = draft[id];
    if (!a || !b) return true;
    if (a.status !== b.status || (a.notes ?? '') !== (b.notes ?? '')) return true;
  }
  return false;
};

export interface AttendanceUpsertRow {
  session_id: string;
  user_id: string;
  status: AttendanceStatus;
  notes: string | null;
}

export const rollCallToRows = (sessionId: string, draft: RollCallDraft): AttendanceUpsertRow[] =>
  Object.entries(draft).map(([userId, entry]) => ({
    session_id: sessionId,
    user_id: userId,
    status: entry.status,
    notes: entry.notes.trim() || null,
  }));
