import { describe, expect, it } from 'vitest';
import {
  buildLedgerCsv,
  buildReceivables,
  csvCell,
  filterLedger,
  ledgerKpis,
  periodRange,
  receivableMessage,
  type LedgerPayment,
} from './accounting';

const pay = (over: Partial<LedgerPayment> & { id: string }): LedgerPayment => ({
  enrollment_id: 'e1',
  user_id: 'u1',
  course_id: 'c1',
  student_name: 'María Pérez',
  course_title: 'Acuarela',
  amount: 100000,
  method: 'cash',
  paid_at: '2026-06-10',
  reference: null,
  notes: null,
  created_at: '2026-06-10T10:00:00Z',
  created_by: null,
  voided_at: null,
  voided_by: null,
  void_reason: null,
  ...over,
});

describe('periodRange', () => {
  const now = new Date(2026, 5, 15); // 15 June 2026 (local)

  it('this month', () => {
    expect(periodRange('this-month', now)).toEqual({ from: '2026-06-01', to: '2026-06-30' });
  });

  it('last month crosses the year boundary', () => {
    expect(periodRange('last-month', now)).toEqual({ from: '2026-05-01', to: '2026-05-31' });
    expect(periodRange('last-month', new Date(2026, 0, 10))).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  });

  it('this year', () => {
    expect(periodRange('this-year', now)).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });

  it('custom keeps the given range and orders it', () => {
    expect(periodRange('custom', now, { from: '2026-03-05', to: '2026-03-01' })).toEqual({
      from: '2026-03-01',
      to: '2026-03-05',
    });
  });

  it('custom without range falls back to this month', () => {
    expect(periodRange('custom', now)).toEqual({ from: '2026-06-01', to: '2026-06-30' });
  });
});

describe('filterLedger', () => {
  const list = [
    pay({ id: 'a', paid_at: '2026-06-01', amount: 50000 }),
    pay({ id: 'b', paid_at: '2026-06-20', method: 'transfer', course_id: 'c2', course_title: 'Óleo', student_name: 'Juan Gómez' }),
    pay({ id: 'c', paid_at: '2026-05-31', voided_at: '2026-06-02T00:00:00Z', void_reason: 'duplicado' }),
    pay({ id: 'd', paid_at: '2026-06-20', created_at: '2026-06-20T15:00:00Z' }),
  ];
  const base = { courseId: 'all', method: 'all', search: '', includeVoided: false, from: '2026-06-01', to: '2026-06-30' } as const;

  it('keeps only the period and hides voided by default', () => {
    expect(filterLedger(list, base).map((p) => p.id)).toEqual(['d', 'b', 'a']);
  });

  it('sorts by date desc then creation desc', () => {
    expect(filterLedger(list, base)[0].id).toBe('d');
  });

  it('includes voided payments on demand', () => {
    const r = filterLedger(list, { ...base, includeVoided: true, from: '2026-05-01' });
    expect(r.map((p) => p.id)).toContain('c');
  });

  it('filters by course, method and accent-insensitive student search', () => {
    expect(filterLedger(list, { ...base, courseId: 'c2' }).map((p) => p.id)).toEqual(['b']);
    expect(filterLedger(list, { ...base, method: 'transfer' }).map((p) => p.id)).toEqual(['b']);
    expect(filterLedger(list, { ...base, search: 'gomez' }).map((p) => p.id)).toEqual(['b']);
  });
});

describe('ledgerKpis', () => {
  const list = [
    pay({ id: 'a', amount: 50000 }),
    pay({ id: 'b', amount: 70000, method: 'nequi', course_id: 'c2', course_title: 'Óleo' }),
    pay({ id: 'c', amount: 999999, voided_at: '2026-06-02T00:00:00Z' }),
    pay({ id: 'd', amount: 30000, method: 'nequi', course_id: 'c2', course_title: 'Óleo' }),
  ];

  it('sums only non voided payments', () => {
    const k = ledgerKpis(list);
    expect(k.collected).toBe(150000);
    expect(k.count).toBe(3);
  });

  it('breaks down by method and by course sorted by amount desc', () => {
    const k = ledgerKpis(list);
    expect(k.byMethod).toEqual([
      { method: 'nequi', amount: 100000, count: 2 },
      { method: 'cash', amount: 50000, count: 1 },
    ]);
    expect(k.byCourse).toEqual([
      { courseId: 'c2', title: 'Óleo', amount: 100000, count: 2 },
      { courseId: 'c1', title: 'Acuarela', amount: 50000, count: 1 },
    ]);
  });

  it('is empty-safe', () => {
    expect(ledgerKpis([])).toEqual({ collected: 0, count: 0, byMethod: [], byCourse: [] });
  });
});

describe('buildReceivables', () => {
  const enrollments = [
    { id: 'e1', user_id: 'u1', course_id: 'c1', status: 'pending' as const, agreed_price: 300000 },
    { id: 'e2', user_id: 'u2', course_id: 'c1', status: 'active' as const, agreed_price: 100000 },
    { id: 'e3', user_id: 'u3', course_id: 'c1', status: 'cancelled' as const, agreed_price: 500000 },
    { id: 'e4', user_id: 'u4', course_id: 'c2', status: 'suspended' as const, agreed_price: 200000 },
  ];
  const students = [
    { id: 'u1', name: 'Ana', phone: '300' },
    { id: 'u2', name: 'Beto', phone: null },
    { id: 'u3', name: 'Cata', phone: null },
    { id: 'u4', name: 'Dani', phone: '311' },
  ];
  const courses = [
    { id: 'c1', title: 'Acuarela' },
    { id: 'c2', title: 'Óleo' },
  ];
  const payments = [
    { enrollment_id: 'e1', amount: 100000, voided_at: null },
    { enrollment_id: 'e2', amount: 100000, voided_at: null },
    { enrollment_id: 'e4', amount: 50000, voided_at: '2026-01-01T00:00:00Z' },
  ];

  it('lists non cancelled enrollments with balance > 0 sorted by balance desc', () => {
    const r = buildReceivables(enrollments, students, courses, payments);
    expect(r.map((x) => [x.enrollmentId, x.balance])).toEqual([
      ['e1', 200000],
      ['e4', 200000],
    ]);
    expect(r[0]).toMatchObject({ studentName: 'Ana', courseTitle: 'Acuarela', phone: '300' });
  });

  it('breaks balance ties by student name', () => {
    const r = buildReceivables(enrollments, students, courses, payments);
    expect(r.map((x) => x.studentName)).toEqual(['Ana', 'Dani']);
  });
});

describe('receivableMessage', () => {
  it('writes a Spanish reminder with course and balance', () => {
    const m = receivableMessage('Ana Gómez', 'Acuarela', 200000);
    expect(m).toContain('Ana');
    expect(m).toContain('Acuarela');
    expect(m).toContain('200.000');
  });
});

describe('csv', () => {
  it('escapes separators, quotes and newlines', () => {
    expect(csvCell('a;b')).toBe('"a;b"');
    expect(csvCell('di "hola"')).toBe('"di ""hola"""');
    expect(csvCell('l1\nl2')).toBe('"l1\nl2"');
    expect(csvCell('plain')).toBe('plain');
  });

  it('neutralizes spreadsheet formulas', () => {
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(csvCell('@cmd')).toBe("'@cmd");
  });

  it('builds a BOM prefixed, semicolon separated ledger with Spanish headers', () => {
    const csv = buildLedgerCsv([
      pay({ id: 'a', amount: 50000, reference: 'TR-1', notes: 'abono; inicial' }),
      pay({ id: 'b', amount: 70000, voided_at: '2026-06-12T08:00:00Z', void_reason: 'duplicado' }),
    ]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    const lines = csv.slice(1).split('\r\n');
    expect(lines[0]).toBe('Fecha;Estudiante;Curso;Monto;Medio;Referencia;Notas;Estado;Motivo de anulación');
    expect(lines[1]).toBe('2026-06-10;María Pérez;Acuarela;50000;Efectivo;TR-1;"abono; inicial";Vigente;');
    expect(lines[2]).toContain(';Anulado;duplicado');
  });
});
