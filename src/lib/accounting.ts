import { endOfMonth, endOfYear, format, startOfMonth, startOfYear, subMonths } from 'date-fns';
import { enrollmentBalance, formatCOP, paymentMethodLabels } from '@/lib/operations';
import { normalizeSearch } from '@/lib/roster';
import type { EnrollmentStatus, PaymentLike, PaymentMethod } from '@/types';

/**
 * Pure helpers for the accounting module: period ranges, ledger filtering,
 * KPI aggregation, receivables and CSV export. No Supabase or React imports.
 */

export interface LedgerPayment {
  id: string;
  enrollment_id: string | null;
  user_id: string | null;
  course_id: string | null;
  student_name: string | null;
  course_title: string | null;
  amount: number;
  method: PaymentMethod;
  /** Calendar day (yyyy-MM-dd). */
  paid_at: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
}

// ---------------------------------------------------------------------------
// Periods
// ---------------------------------------------------------------------------

export type PeriodKind = 'this-month' | 'last-month' | 'this-year' | 'custom';

export interface DateRange {
  /** Inclusive, yyyy-MM-dd. */
  from: string;
  /** Inclusive, yyyy-MM-dd. */
  to: string;
}

const day = (d: Date): string => format(d, 'yyyy-MM-dd');

export const periodRange = (kind: PeriodKind, now: Date = new Date(), custom?: Partial<DateRange>): DateRange => {
  switch (kind) {
    case 'last-month': {
      const ref = subMonths(now, 1);
      return { from: day(startOfMonth(ref)), to: day(endOfMonth(ref)) };
    }
    case 'this-year':
      return { from: day(startOfYear(now)), to: day(endOfYear(now)) };
    case 'custom':
      if (custom?.from && custom?.to) {
        return custom.from <= custom.to
          ? { from: custom.from, to: custom.to }
          : { from: custom.to, to: custom.from };
      }
      return { from: day(startOfMonth(now)), to: day(endOfMonth(now)) };
    default:
      return { from: day(startOfMonth(now)), to: day(endOfMonth(now)) };
  }
};

// ---------------------------------------------------------------------------
// Ledger
// ---------------------------------------------------------------------------

export interface LedgerFilters extends DateRange {
  /** Course id or 'all'. */
  courseId: string;
  /** Payment method or 'all'. */
  method: string;
  search: string;
  includeVoided: boolean;
}

/** Filters the ledger and sorts it by payment date desc, then registration time desc. */
export const filterLedger = (payments: LedgerPayment[], filters: LedgerFilters): LedgerPayment[] => {
  const q = normalizeSearch(filters.search);
  return payments
    .filter((p) => {
      if (p.paid_at < filters.from || p.paid_at > filters.to) return false;
      if (!filters.includeVoided && p.voided_at) return false;
      if (filters.courseId !== 'all' && p.course_id !== filters.courseId) return false;
      if (filters.method !== 'all' && p.method !== filters.method) return false;
      if (q) {
        const haystack = normalizeSearch(`${p.student_name ?? ''} ${p.reference ?? ''}`);
        if (!haystack.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => b.paid_at.localeCompare(a.paid_at) || b.created_at.localeCompare(a.created_at));
};

export interface LedgerKpis {
  collected: number;
  count: number;
  byMethod: Array<{ method: PaymentMethod; amount: number; count: number }>;
  byCourse: Array<{ courseId: string; title: string; amount: number; count: number }>;
}

/** Aggregates non voided payments (pass the already period-filtered list). */
export const ledgerKpis = (payments: LedgerPayment[]): LedgerKpis => {
  const valid = payments.filter((p) => !p.voided_at);
  const methods = new Map<PaymentMethod, { amount: number; count: number }>();
  const courses = new Map<string, { title: string; amount: number; count: number }>();
  for (const p of valid) {
    const m = methods.get(p.method) ?? { amount: 0, count: 0 };
    methods.set(p.method, { amount: m.amount + Number(p.amount), count: m.count + 1 });
    const key = p.course_id ?? 'unknown';
    const c = courses.get(key) ?? { title: p.course_title ?? 'Curso eliminado', amount: 0, count: 0 };
    courses.set(key, { title: c.title, amount: c.amount + Number(p.amount), count: c.count + 1 });
  }
  return {
    collected: valid.reduce((n, p) => n + Number(p.amount), 0),
    count: valid.length,
    byMethod: [...methods].map(([method, v]) => ({ method, ...v })).sort((a, b) => b.amount - a.amount),
    byCourse: [...courses].map(([courseId, v]) => ({ courseId, ...v })).sort((a, b) => b.amount - a.amount),
  };
};

// ---------------------------------------------------------------------------
// Receivables
// ---------------------------------------------------------------------------

export interface ReceivableEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  agreed_price: number;
}

export interface Receivable {
  enrollmentId: string;
  userId: string;
  courseId: string;
  studentName: string;
  phone: string | null;
  courseTitle: string;
  status: EnrollmentStatus;
  agreed: number;
  paid: number;
  balance: number;
}

/** Non cancelled enrollments with an outstanding balance, largest first. */
export const buildReceivables = (
  enrollments: ReceivableEnrollment[],
  students: Array<{ id: string; name: string; phone: string | null }>,
  courses: Array<{ id: string; title: string }>,
  payments: Array<PaymentLike & { enrollment_id: string | null }>,
): Receivable[] => {
  const studentById = new Map(students.map((s) => [s.id, s]));
  const courseById = new Map(courses.map((c) => [c.id, c]));
  const result: Receivable[] = [];
  for (const e of enrollments) {
    if (e.status === 'cancelled') continue;
    const { paid, balance } = enrollmentBalance(
      e.agreed_price,
      payments.filter((p) => p.enrollment_id === e.id),
    );
    if (balance <= 0) continue;
    const student = studentById.get(e.user_id);
    result.push({
      enrollmentId: e.id,
      userId: e.user_id,
      courseId: e.course_id,
      studentName: student?.name ?? 'Estudiante',
      phone: student?.phone ?? null,
      courseTitle: courseById.get(e.course_id)?.title ?? 'Curso',
      status: e.status,
      agreed: Number(e.agreed_price),
      paid,
      balance,
    });
  }
  return result.sort((a, b) => b.balance - a.balance || a.studentName.localeCompare(b.studentName, 'es'));
};

export const receivableMessage = (studentName: string, courseTitle: string, balance: number): string => {
  const firstName = studentName.trim().split(/\s+/)[0] || studentName;
  return `Hola ${firstName}, te escribimos de la academia. Te recordamos que tienes un saldo pendiente de ${formatCOP(balance)} del curso "${courseTitle}". Cualquier duda con gusto te ayudamos. ¡Gracias!`;
};

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

const CSV_SEPARATOR = ';';

/** Quotes a cell when needed and neutralizes spreadsheet formulas. */
export const csvCell = (value: string | number | null | undefined): string => {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const csvHeaders = ['Fecha', 'Estudiante', 'Curso', 'Monto', 'Medio', 'Referencia', 'Notas', 'Estado', 'Motivo de anulación'];

/** Ledger CSV for es-CO Excel: UTF-8 with BOM, `;` separator, CRLF lines. */
export const buildLedgerCsv = (payments: LedgerPayment[]): string => {
  const lines = [csvHeaders.map(csvCell).join(CSV_SEPARATOR)];
  for (const p of payments) {
    lines.push(
      [
        p.paid_at,
        p.student_name,
        p.course_title,
        String(Number(p.amount)).replace('.', ','),
        paymentMethodLabels[p.method],
        p.reference,
        p.notes,
        p.voided_at ? 'Anulado' : 'Vigente',
        p.void_reason,
      ]
        .map(csvCell)
        .join(CSV_SEPARATOR),
    );
  }
  return `\uFEFF${lines.join('\r\n')}`;
};
