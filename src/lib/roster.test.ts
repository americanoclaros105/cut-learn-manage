import { describe, expect, it } from 'vitest';
import {
  buildRosterRows,
  filterRoster,
  isRollCallDirty,
  markAll,
  normalizeSearch,
  rollCallToRows,
  rosterKpis,
  statusCounts,
  type RosterEnrollment,
} from './roster';

const enr = (over: Partial<RosterEnrollment> & { id: string; user_id: string }): RosterEnrollment => ({
  course_id: 'c1',
  status: 'pending',
  agreed_price: 100000,
  activated_by: null,
  enabled_from: null,
  expires_at: null,
  notes: null,
  ...over,
});

const students = [
  { id: 'u1', name: 'María Pérez', phone: '3001112222' },
  { id: 'u2', name: 'Juan Gómez', phone: null },
  { id: 'u3', name: 'Ana Ruiz', phone: '3003334444' },
];

const enrollments = [
  enr({ id: 'e1', user_id: 'u1', status: 'active', activated_by: 'payment' }),
  enr({ id: 'e2', user_id: 'u2', status: 'pending', agreed_price: 200000 }),
  enr({ id: 'e3', user_id: 'u3', status: 'cancelled' }),
];

const payments = [
  { enrollment_id: 'e1', amount: 60000, paid_at: '2026-05-01', voided_at: null },
  { enrollment_id: 'e1', amount: 40000, paid_at: '2026-05-10', voided_at: null },
  { enrollment_id: 'e1', amount: 999, paid_at: '2026-05-20', voided_at: '2026-05-21T00:00:00Z' },
  { enrollment_id: 'e2', amount: 50000, paid_at: '2026-04-01', voided_at: null },
];

const attendance = [
  { user_id: 'u1', status: 'present' as const },
  { user_id: 'u1', status: 'late' as const },
  { user_id: 'u1', status: 'absent' as const },
  { user_id: 'u2', status: 'absent' as const },
];

describe('buildRosterRows', () => {
  const rows = buildRosterRows(enrollments, students, payments, attendance);

  it('keeps one row per enrollment with the student joined', () => {
    expect(rows).toHaveLength(3);
    expect(rows[0].student.name).toBe('María Pérez');
  });

  it('computes paid, balance and last payment ignoring voided payments', () => {
    expect(rows[0]).toMatchObject({ paid: 100000, balance: 0, isFullyPaid: true, paymentCount: 3 });
    expect(rows[0].lastPaymentAt).toBe('2026-05-10');
    expect(rows[1]).toMatchObject({ paid: 50000, balance: 150000, isFullyPaid: false });
  });

  it('computes attendance stats per student', () => {
    expect(rows[0].attendance.rate).toBeCloseTo(2 / 3);
    expect(rows[1].attendance.rate).toBe(0);
    expect(rows[2].attendance.total).toBe(0);
  });

  it('falls back to a placeholder student when the profile is missing', () => {
    const r = buildRosterRows([enr({ id: 'e9', user_id: 'zz' })], [], [], []);
    expect(r[0].student.name).toBe('Estudiante');
  });

  it('has null last payment when there are no valid payments', () => {
    expect(rows[2].lastPaymentAt).toBeNull();
  });
});

describe('rosterKpis', () => {
  const rows = buildRosterRows(enrollments, students, payments, attendance);
  const k = rosterKpis(rows);

  it('counts enrolled excluding cancelled and splits by status', () => {
    expect(k).toMatchObject({ enrolled: 2, active: 1, pending: 1, suspended: 0, cancelled: 1 });
  });

  it('sums money excluding cancelled enrollments', () => {
    expect(k.totalAgreed).toBe(300000);
    expect(k.totalPaid).toBe(150000);
    expect(k.totalBalance).toBe(150000);
  });

  it('never counts overpayment as negative receivable', () => {
    const over = buildRosterRows(
      [enr({ id: 'e1', user_id: 'u1', agreed_price: 100 })],
      students,
      [{ enrollment_id: 'e1', amount: 500, paid_at: '2026-01-01', voided_at: null }],
      [],
    );
    expect(rosterKpis(over).totalBalance).toBe(0);
  });

  it('averages attendance globally and is null without records', () => {
    expect(k.avgAttendance).toBeCloseTo(2 / 4);
    expect(rosterKpis(buildRosterRows(enrollments, students, payments, [])).avgAttendance).toBeNull();
  });
});

describe('filterRoster / statusCounts', () => {
  const rows = buildRosterRows(enrollments, students, payments, attendance);

  it('searches by name ignoring case and accents', () => {
    expect(filterRoster(rows, { search: 'maria', status: 'all' })).toHaveLength(1);
    expect(filterRoster(rows, { search: 'GOMEZ', status: 'all' })).toHaveLength(1);
  });

  it('searches by phone digits', () => {
    expect(filterRoster(rows, { search: '3003334444', status: 'all' })[0].student.id).toBe('u3');
  });

  it('filters by status', () => {
    expect(filterRoster(rows, { search: '', status: 'pending' })).toHaveLength(1);
    expect(filterRoster(rows, { search: '', status: 'all' })).toHaveLength(3);
  });

  it('counts per status including all', () => {
    expect(statusCounts(rows)).toEqual({ all: 3, pending: 1, active: 1, suspended: 0, cancelled: 1 });
  });

  it('normalizes search text', () => {
    expect(normalizeSearch('  ÁÉÍ Ñu ')).toBe('aei nu');
  });
});

describe('roll call draft', () => {
  it('markAll sets every student to the given status keeping notes', () => {
    const draft = markAll(['u1', 'u2'], 'present', { u1: { status: 'absent', notes: 'llamó' } });
    expect(draft.u1).toEqual({ status: 'present', notes: 'llamó' });
    expect(draft.u2).toEqual({ status: 'present', notes: '' });
  });

  it('detects unsaved changes', () => {
    const saved = { u1: { status: 'present' as const, notes: '' } };
    expect(isRollCallDirty(saved, { u1: { status: 'present', notes: '' } })).toBe(false);
    expect(isRollCallDirty(saved, { u1: { status: 'absent', notes: '' } })).toBe(true);
    expect(isRollCallDirty(saved, { u1: { status: 'present', notes: 'x' } })).toBe(true);
    expect(isRollCallDirty(saved, { ...saved, u2: { status: 'late', notes: '' } })).toBe(true);
    expect(isRollCallDirty({}, {})).toBe(false);
  });

  it('builds upsert rows with trimmed notes turned into null', () => {
    const rows = rollCallToRows('s1', {
      u1: { status: 'present', notes: '  ' },
      u2: { status: 'excused', notes: ' viaje ' },
    });
    expect(rows).toEqual([
      { session_id: 's1', user_id: 'u1', status: 'present', notes: null },
      { session_id: 's1', user_id: 'u2', status: 'excused', notes: 'viaje' },
    ]);
  });
});
