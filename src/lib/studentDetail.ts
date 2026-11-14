import { addYears, format } from 'date-fns';
import { attendanceStats, enrollmentBalance } from '@/lib/operations';
import type { RosterEnrollment, RosterPayment } from '@/lib/roster';
import type { AttendanceStats, AttendanceStatus } from '@/types';

/**
 * Pure logic of the admin student page (tabs, per-enrollment summary, KPIs,
 * delete confirmation, password generator). No Supabase or React imports.
 */

export const STUDENT_TABS = ['resumen', 'datos', 'acceso', 'pagos', 'asistencia'] as const;
export type StudentTab = (typeof STUDENT_TABS)[number];

/** Reads the `?tab=` value; unknown or missing values fall back to the summary. */
export const parseStudentTab = (value: string | null | undefined): StudentTab =>
  (STUDENT_TABS as readonly string[]).includes(value ?? '') ? (value as StudentTab) : 'resumen';

export const lessonProgressPct = (completed: number, total: number): number => {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((Math.max(0, completed) / total) * 100));
};

export interface StudentCourseInfo {
  id: string;
  title: string;
  cover_image: string | null;
  lesson_count: number;
}

export interface StudentSession {
  id: string;
  course_id: string;
  starts_at: string;
  topic: string | null;
  location: string | null;
}

export interface StudentAttendanceRecord {
  session_id: string;
  status: AttendanceStatus;
}

export interface StudentPaymentLike extends RosterPayment {
  id: string;
}

export interface StudentEnrollmentRow {
  enrollment: RosterEnrollment;
  /** Null when the course was deleted or is not readable. */
  course: StudentCourseInfo | null;
  agreed: number;
  paid: number;
  balance: number;
  isFullyPaid: boolean;
  /** Payments linked to the enrollment, voided ones included. */
  paymentCount: number;
  lastPaymentAt: string | null;
  lessonsCompleted: number;
  lessonPct: number;
  attendance: AttendanceStats;
  /** Sessions of the course (newest first) with this student's status, null when not recorded. */
  sessions: Array<{ session: StudentSession; status: AttendanceStatus | null }>;
}

export const buildStudentEnrollments = (
  enrollments: RosterEnrollment[],
  payments: StudentPaymentLike[],
  courses: StudentCourseInfo[],
  completedLessons: Array<{ course_id: string }>,
  sessions: StudentSession[],
  records: StudentAttendanceRecord[],
): StudentEnrollmentRow[] => {
  const courseById = new Map(courses.map((c) => [c.id, c]));
  const statusBySession = new Map(records.map((r) => [r.session_id, r.status]));

  return enrollments.map((enrollment) => {
    const own = payments.filter((p) => p.enrollment_id === enrollment.id);
    const { paid, balance, isFullyPaid } = enrollmentBalance(enrollment.agreed_price, own);
    const validDates = own.filter((p) => !p.voided_at).map((p) => p.paid_at);
    const course = courseById.get(enrollment.course_id) ?? null;
    const lessonsCompleted = completedLessons.filter((l) => l.course_id === enrollment.course_id).length;
    const courseSessions = sessions
      .filter((s) => s.course_id === enrollment.course_id)
      .sort((a, b) => (a.starts_at < b.starts_at ? 1 : a.starts_at > b.starts_at ? -1 : 0))
      .map((session) => ({ session, status: statusBySession.get(session.id) ?? null }));

    return {
      enrollment,
      course,
      agreed: Number(enrollment.agreed_price),
      paid,
      balance,
      isFullyPaid,
      paymentCount: own.length,
      lastPaymentAt: validDates.length ? validDates.reduce((a, b) => (a > b ? a : b)) : null,
      lessonsCompleted,
      lessonPct: lessonProgressPct(lessonsCompleted, course?.lesson_count ?? 0),
      attendance: attendanceStats(courseSessions.flatMap((s) => (s.status ? [{ status: s.status }] : []))),
      sessions: courseSessions,
    };
  });
};

export interface StudentKpis {
  /** Enrollments that are not cancelled. */
  enrolled: number;
  totalAgreed: number;
  totalPaid: number;
  /** Overpaying one course never reduces what is owed on another. */
  totalBalance: number;
  /** (present + late) / countable over every live enrollment; null when nothing was recorded. */
  attendanceRate: number | null;
}

export const studentKpis = (rows: StudentEnrollmentRow[]): StudentKpis => {
  const live = rows.filter((r) => r.enrollment.status !== 'cancelled');
  const countable = live.reduce((n, r) => n + r.attendance.present + r.attendance.late + r.attendance.absent, 0);
  const attended = live.reduce((n, r) => n + r.attendance.present + r.attendance.late, 0);
  return {
    enrolled: live.length,
    totalAgreed: live.reduce((n, r) => n + r.agreed, 0),
    totalPaid: live.reduce((n, r) => n + r.paid, 0),
    totalBalance: live.reduce((n, r) => n + Math.max(0, r.balance), 0),
    attendanceRate: countable === 0 ? null : attended / countable,
  };
};

export interface DeleteImpact {
  enrollments: number;
  activeEnrollments: number;
  payments: number;
  paidTotal: number;
}

/** What deleting the account touches, shown before the admin types the name. */
export const deleteImpact = (rows: StudentEnrollmentRow[]): DeleteImpact => ({
  enrollments: rows.length,
  activeEnrollments: rows.filter((r) => r.enrollment.status === 'active').length,
  payments: rows.reduce((n, r) => n + r.paymentCount, 0),
  paidTotal: rows.reduce((n, r) => n + r.paid, 0),
});

/** Typed confirmation: the exact name, ignoring letter case and surrounding spaces. */
export const isDeleteConfirmed = (name: string, typed: string): boolean => {
  const expected = name.trim().toLowerCase();
  return expected !== '' && typed.trim().toLowerCase() === expected;
};

const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';

const secureRandom = (max: number): number => {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] % max;
};

/** Readable temporary password: no look-alike characters, one of each class guaranteed. */
export const generatePassword = (length = 12, random: (max: number) => number = secureRandom): string => {
  const all = LOWER + UPPER + DIGITS;
  const pick = (alphabet: string) => alphabet[random(alphabet.length)];
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS)];
  while (chars.length < Math.max(length, 3)) chars.push(pick(all));
  // Fisher-Yates shuffle so the guaranteed characters are not always first.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
};

/** New accounts start today and expire in a year, matching the server default. */
export const defaultAccessDates = (now: Date = new Date()): { enabled_from: string; expires_at: string } => ({
  enabled_from: format(now, 'yyyy-MM-dd'),
  expires_at: format(addYears(now, 1), 'yyyy-MM-dd'),
});

export const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
