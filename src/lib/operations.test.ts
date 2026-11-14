import { describe, expect, it } from 'vitest';
import {
  attendanceStats,
  attendanceStatusLabels,
  effectiveAccess,
  enrollmentBalance,
  enrollmentStatusLabels,
  formatCOP,
  paymentMethodLabels,
} from './operations';

describe('enrollmentBalance', () => {
  it('sums payments and computes the balance', () => {
    const r = enrollmentBalance(500000, [{ amount: 200000 }, { amount: 100000 }]);
    expect(r).toEqual({ paid: 300000, balance: 200000, isFullyPaid: false });
  });

  it('ignores voided payments', () => {
    const r = enrollmentBalance(300000, [
      { amount: 300000, voided_at: '2026-01-01T00:00:00Z' },
      { amount: 100000, voided_at: null },
    ]);
    expect(r.paid).toBe(100000);
    expect(r.isFullyPaid).toBe(false);
  });

  it('is fully paid when paid reaches the agreed price', () => {
    expect(enrollmentBalance(300000, [{ amount: 300000 }]).isFullyPaid).toBe(true);
  });

  it('returns a raw negative balance on overpayment', () => {
    const r = enrollmentBalance(100000, [{ amount: 150000 }]);
    expect(r.balance).toBe(-50000);
    expect(r.isFullyPaid).toBe(true);
  });

  it('treats an agreed price of 0 as fully paid', () => {
    expect(enrollmentBalance(0, [])).toEqual({ paid: 0, balance: 0, isFullyPaid: true });
  });

  it('handles numeric strings coming from NUMERIC columns', () => {
    const r = enrollmentBalance(100000, [{ amount: '40000.50' as unknown as number }]);
    expect(r.paid).toBeCloseTo(40000.5);
  });
});

describe('effectiveAccess', () => {
  const now = new Date('2026-06-15T12:00:00Z');
  const base = { status: 'active' as const, enabled_from: null, expires_at: null };

  it('is active for an active enrollment without dates', () => {
    expect(effectiveAccess(base, now)).toBe('active');
  });

  it('reflects non-active statuses', () => {
    expect(effectiveAccess({ ...base, status: 'pending' }, now)).toBe('pending');
    expect(effectiveAccess({ ...base, status: 'suspended' }, now)).toBe('suspended');
    expect(effectiveAccess({ ...base, status: 'cancelled' }, now)).toBe('cancelled');
  });

  it('is not_started before enabled_from', () => {
    expect(effectiveAccess({ ...base, enabled_from: '2026-07-01T00:00:00Z' }, now)).toBe('not_started');
  });

  it('is active once enabled_from has passed', () => {
    expect(effectiveAccess({ ...base, enabled_from: '2026-06-01T00:00:00Z' }, now)).toBe('active');
  });

  it('is expired at or after expires_at', () => {
    expect(effectiveAccess({ ...base, expires_at: '2026-06-15T12:00:00Z' }, now)).toBe('expired');
    expect(effectiveAccess({ ...base, expires_at: '2026-06-01T00:00:00Z' }, now)).toBe('expired');
  });

  it('is active before expires_at', () => {
    expect(effectiveAccess({ ...base, expires_at: '2026-12-01T00:00:00Z' }, now)).toBe('active');
  });

  it('status wins over dates for non-active enrollments', () => {
    const e = { status: 'pending' as const, enabled_from: '2026-07-01T00:00:00Z', expires_at: null };
    expect(effectiveAccess(e, now)).toBe('pending');
  });
});

describe('attendanceStats', () => {
  it('counts by status and computes the rate excluding excused', () => {
    const s = attendanceStats([
      { status: 'present' },
      { status: 'present' },
      { status: 'late' },
      { status: 'absent' },
      { status: 'excused' },
    ]);
    expect(s).toMatchObject({ present: 2, late: 1, absent: 1, excused: 1, total: 5 });
    expect(s.rate).toBeCloseTo(3 / 4);
  });

  it('returns rate 0 when there are no countable records', () => {
    expect(attendanceStats([]).rate).toBe(0);
    expect(attendanceStats([{ status: 'excused' }]).rate).toBe(0);
  });
});

describe('formatCOP', () => {
  it('formats pesos without decimals', () => {
    const out = formatCOP(1250000).replace(/\s/g, ' ');
    expect(out).toContain('1.250.000');
    expect(out).toContain('$');
    expect(out).not.toContain(',');
  });

  it('formats zero', () => {
    expect(formatCOP(0)).toContain('0');
  });
});

describe('labels', () => {
  it('has Spanish labels for every payment method', () => {
    expect(paymentMethodLabels).toEqual({
      cash: 'Efectivo',
      transfer: 'Transferencia',
      card: 'Tarjeta',
      nequi: 'Nequi',
      daviplata: 'Daviplata',
      other: 'Otro',
    });
  });

  it('has Spanish labels for enrollment and attendance statuses', () => {
    expect(enrollmentStatusLabels.pending).toBe('Pendiente de pago');
    expect(enrollmentStatusLabels.active).toBe('Activo');
    expect(enrollmentStatusLabels.suspended).toBe('Suspendido');
    expect(enrollmentStatusLabels.cancelled).toBe('Cancelado');
    expect(attendanceStatusLabels).toEqual({
      present: 'Presente',
      absent: 'Ausente',
      late: 'Tarde',
      excused: 'Excusa',
    });
  });
});
