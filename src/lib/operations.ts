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

export interface EnrollmentDiff<E extends { id: string; course_id: string }, D extends { course_id: string }> {
  toInsert: D[];
  toUpdate: Array<D & { id: string }>;
  toDelete: E[];
}

/**
 * Computes the minimal set of changes between the current enrollments of a
 * student and the desired list, keyed by course. Used instead of
 * delete-and-reinsert so status and payment links survive an edit.
 */
export const diffEnrollments = <E extends { id: string; course_id: string }, D extends { course_id: string }>(
  existing: E[],
  desired: D[],
): EnrollmentDiff<E, D> => {
  const existingByCourse = new Map(existing.map((e) => [e.course_id, e]));
  const desiredCourseIds = new Set(desired.map((d) => d.course_id));
  const toInsert: D[] = [];
  const toUpdate: Array<D & { id: string }> = [];
  for (const d of desired) {
    const current = existingByCourse.get(d.course_id);
    if (current) toUpdate.push({ ...d, id: current.id });
    else toInsert.push(d);
  }
  return { toInsert, toUpdate, toDelete: existing.filter((e) => !desiredCourseIds.has(e.course_id)) };
};

const formatDay = (iso: string | null | undefined): string =>
  iso
    ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

export interface AccessBlockedContext {
  balance?: number;
  enabled_from?: string | null;
  expires_at?: string | null;
}

/** Student-facing explanation (Spanish) of why an enrollment does not give access. */
export const accessBlockedMessage = (
  access: EffectiveAccess,
  ctx: AccessBlockedContext,
): { title: string; detail: string } => {
  switch (access) {
    case 'pending':
      return {
        title: 'Pendiente de pago',
        detail:
          ctx.balance !== undefined && ctx.balance > 0
            ? `Tu saldo pendiente es ${formatCOP(ctx.balance)}. El acceso se habilita cuando se complete el pago.`
            : 'El acceso se habilita cuando se complete el pago.',
      };
    case 'not_started':
      return {
        title: `Inicia el ${formatDay(ctx.enabled_from)}`,
        detail: 'Tu acceso a este curso aún no está habilitado.',
      };
    case 'expired':
      return {
        title: 'Acceso expirado',
        detail: ctx.expires_at ? `Tu acceso venció el ${formatDay(ctx.expires_at)}.` : 'Tu acceso a este curso venció.',
      };
    case 'suspended':
      return { title: 'Acceso suspendido', detail: 'Tu acceso a este curso está suspendido temporalmente.' };
    case 'cancelled':
      return { title: 'Inscripción cancelada', detail: 'Esta inscripción fue cancelada.' };
    default:
      return { title: 'Acceso habilitado', detail: '' };
  }
};
