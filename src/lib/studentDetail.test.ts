import { describe, expect, it } from 'vitest';
import {
  buildStudentEnrollments,
  defaultAccessDates,
  deleteImpact,
  generatePassword,
  initialsOf,
  isDeleteConfirmed,
  lessonProgressPct,
  parseStudentTab,
  studentKpis,
  type StudentCourseInfo,
} from './studentDetail';
import type { RosterEnrollment } from './roster';

const enr = (over: Partial<RosterEnrollment> & { id: string; course_id: string }): RosterEnrollment => ({
  user_id: 'u1',
  status: 'pending',
  agreed_price: 100000,
  activated_by: null,
  enabled_from: null,
  expires_at: null,
  notes: null,
  ...over,
});

const courses: StudentCourseInfo[] = [
  { id: 'c1', title: 'Barbería', cover_image: null, lesson_count: 10 },
  { id: 'c2', title: 'Colorimetría', cover_image: 'x.png', lesson_count: 0 },
];

const payments = [
  { id: 'p1', enrollment_id: 'e1', amount: 60000, paid_at: '2026-05-01', voided_at: null },
  { id: 'p2', enrollment_id: 'e1', amount: 20000, paid_at: '2026-05-10', voided_at: null },
  { id: 'p3', enrollment_id: 'e1', amount: 999, paid_at: '2026-05-20', voided_at: '2026-05-21T00:00:00Z' },
  { id: 'p4', enrollment_id: 'e2', amount: 50000, paid_at: '2026-04-01', voided_at: null },
];

const sessions = [
  { id: 's1', course_id: 'c1', starts_at: '2026-05-01T10:00:00Z', topic: 'Cortes', location: null },
  { id: 's2', course_id: 'c1', starts_at: '2026-05-08T10:00:00Z', topic: null, location: 'Sede' },
  { id: 's3', course_id: 'c2', starts_at: '2026-05-09T10:00:00Z', topic: null, location: null },
];

const records = [
  { session_id: 's1', status: 'present' as const },
  { session_id: 's2', status: 'absent' as const },
  { session_id: 's3', status: 'late' as const },
];

const completed = [{ course_id: 'c1' }, { course_id: 'c1' }, { course_id: 'c1' }, { course_id: 'c2' }];

const enrollments = [
  enr({ id: 'e1', course_id: 'c1', status: 'pending' }),
  enr({ id: 'e2', course_id: 'c2', status: 'active', agreed_price: 50000 }),
  enr({ id: 'e3', course_id: 'c3', status: 'cancelled' }),
];

describe('parseStudentTab', () => {
  it('accepts known tabs and falls back to the summary', () => {
    expect(parseStudentTab('pagos')).toBe('pagos');
    expect(parseStudentTab('asistencia')).toBe('asistencia');
    expect(parseStudentTab('nope')).toBe('resumen');
    expect(parseStudentTab(null)).toBe('resumen');
  });
});

describe('lessonProgressPct', () => {
  it('rounds, clamps and survives empty courses', () => {
    expect(lessonProgressPct(3, 10)).toBe(30);
    expect(lessonProgressPct(1, 3)).toBe(33);
    expect(lessonProgressPct(12, 10)).toBe(100);
    expect(lessonProgressPct(0, 0)).toBe(0);
    expect(lessonProgressPct(5, 0)).toBe(0);
  });
});

describe('buildStudentEnrollments', () => {
  const rows = buildStudentEnrollments(enrollments, payments, courses, completed, sessions, records);

  it('computes balance ignoring voided payments and counts all payments', () => {
    expect(rows[0]).toMatchObject({ paid: 80000, balance: 20000, isFullyPaid: false, paymentCount: 3 });
    expect(rows[0].lastPaymentAt).toBe('2026-05-10');
    expect(rows[1]).toMatchObject({ paid: 50000, balance: 0, isFullyPaid: true });
  });

  it('joins the course and tolerates a missing one', () => {
    expect(rows[0].course?.title).toBe('Barbería');
    expect(rows[2].course).toBeNull();
    expect(rows[2].lastPaymentAt).toBeNull();
  });

  it('derives lesson progress per course', () => {
    expect(rows[0]).toMatchObject({ lessonsCompleted: 3, lessonPct: 30 });
    expect(rows[1].lessonPct).toBe(0);
  });

  it('lists only the sessions of the course, newest first, with the student status or null', () => {
    expect(rows[0].sessions.map((s) => [s.session.id, s.status])).toEqual([
      ['s2', 'absent'],
      ['s1', 'present'],
    ]);
    const unrecorded = buildStudentEnrollments([enrollments[0]], [], courses, [], sessions, []);
    expect(unrecorded[0].sessions.every((s) => s.status === null)).toBe(true);
  });

  it('computes attendance stats from the course sessions only', () => {
    expect(rows[0].attendance).toMatchObject({ present: 1, absent: 1, total: 2, rate: 0.5 });
    expect(rows[1].attendance).toMatchObject({ late: 1, total: 1, rate: 1 });
  });
});

describe('studentKpis', () => {
  const rows = buildStudentEnrollments(enrollments, payments, courses, completed, sessions, records);

  it('excludes cancelled enrollments and never reports negative balances', () => {
    const kpis = studentKpis(rows);
    expect(kpis).toMatchObject({ enrolled: 2, totalAgreed: 150000, totalPaid: 130000, totalBalance: 20000 });
  });

  it('aggregates attendance globally and returns null with no records', () => {
    expect(studentKpis(rows).attendanceRate).toBeCloseTo(2 / 3);
    expect(studentKpis([]).attendanceRate).toBeNull();
  });

  it('does not subtract overpayments from other enrollments', () => {
    const over = buildStudentEnrollments(
      [enr({ id: 'e1', course_id: 'c1', agreed_price: 1000 }), enr({ id: 'e2', course_id: 'c2', agreed_price: 5000 })],
      [
        { id: 'a', enrollment_id: 'e1', amount: 3000, paid_at: '2026-05-01', voided_at: null },
        { id: 'b', enrollment_id: 'e2', amount: 1000, paid_at: '2026-05-01', voided_at: null },
      ],
      courses,
      [],
      [],
      [],
    );
    expect(studentKpis(over).totalBalance).toBe(4000);
  });
});

describe('deleteImpact', () => {
  it('summarises what deleting the student affects', () => {
    const rows = buildStudentEnrollments(enrollments, payments, courses, completed, sessions, records);
    expect(deleteImpact(rows)).toEqual({ enrollments: 3, activeEnrollments: 1, payments: 4, paidTotal: 130000 });
  });
});

describe('isDeleteConfirmed', () => {
  it('requires the exact name ignoring letter case and surrounding spaces', () => {
    expect(isDeleteConfirmed('María Pérez', '  maría pérez ')).toBe(true);
    expect(isDeleteConfirmed('María Pérez', 'Maria Perez')).toBe(false);
    expect(isDeleteConfirmed('María Pérez', '')).toBe(false);
    expect(isDeleteConfirmed('', '')).toBe(false);
  });
});

describe('generatePassword', () => {
  it('builds a readable password of the requested length with every character class', () => {
    let i = 0;
    const counter = (max: number) => i++ % max;
    const pwd = generatePassword(12, counter);
    expect(pwd).toHaveLength(12);
    expect(pwd).toMatch(/[a-z]/);
    expect(pwd).toMatch(/[A-Z]/);
    expect(pwd).toMatch(/[0-9]/);
    expect(pwd).not.toMatch(/[O0Il1]/);
  });

  it('is different between calls with the default random source', () => {
    expect(generatePassword()).not.toBe(generatePassword());
  });
});

describe('defaultAccessDates', () => {
  it('starts today and expires one year later (yyyy-MM-dd)', () => {
    expect(defaultAccessDates(new Date(2026, 10, 13))).toEqual({ enabled_from: '2026-11-13', expires_at: '2027-11-13' });
  });
});

describe('initialsOf', () => {
  it('takes up to two initials and falls back for empty names', () => {
    expect(initialsOf('maría pérez gómez')).toBe('MP');
    expect(initialsOf('  Ana ')).toBe('A');
    expect(initialsOf('')).toBe('?');
  });
});
