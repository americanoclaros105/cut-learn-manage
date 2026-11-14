import type {
  AttendanceRecordLike,
  AttendanceStats,
  AttendanceStatus,
  EffectiveAccess,
  EnrollmentBalance,
  EnrollmentLike,
  EnrollmentStatus,
  PaymentLike,
  PaymentMethod,
} from '@/types';

/**
 * Pure domain logic for academy operations. No Supabase or React imports so it
 * can be unit tested and shared by hooks and components.
 */

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  other: 'Otro',
};

export const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  pending: 'Pendiente de pago',
  active: 'Activo',
  suspended: 'Suspendido',
  cancelled: 'Cancelado',
};

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  present: 'Presente',
  absent: 'Ausente',
  late: 'Tarde',
  excused: 'Excusa',
};

// Postgres NUMERIC columns arrive as strings through PostgREST in some cases.
const toNumber = (value: number | string | null | undefined): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export const enrollmentBalance = (
  agreedPrice: number | string | null | undefined,
  payments: PaymentLike[],
): EnrollmentBalance => {
  const agreed = toNumber(agreedPrice);
  const paid = payments
    .filter((p) => !p.voided_at)
    .reduce((sum, p) => sum + toNumber(p.amount), 0);
  return { paid, balance: agreed - paid, isFullyPaid: paid >= agreed };
};

export const effectiveAccess = (enrollment: EnrollmentLike, now: Date = new Date()): EffectiveAccess => {
  if (enrollment.status !== 'active') return enrollment.status;
  const t = now.getTime();
  if (enrollment.enabled_from && new Date(enrollment.enabled_from).getTime() > t) return 'not_started';
  if (enrollment.expires_at && new Date(enrollment.expires_at).getTime() <= t) return 'expired';
  return 'active';
};

export const attendanceStats = (records: AttendanceRecordLike[]): AttendanceStats => {
  const counts = { present: 0, absent: 0, late: 0, excused: 0 };
  for (const r of records) counts[r.status] += 1;
  const countable = counts.present + counts.absent + counts.late;
  return {
    ...counts,
    total: records.length,
    rate: countable === 0 ? 0 : (counts.present + counts.late) / countable,
  };
};

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatCOP = (amount: number | string | null | undefined): string =>
  copFormatter.format(toNumber(amount));
