import type { EnrollmentStatus } from '@/types';

/** Status changes an admin can apply to an enrollment, shared by the roster and the student page. */
export type StatusAction = 'authorize' | 'suspend' | 'reactivate' | 'cancel';

export const statusActions: Record<StatusAction, { status: EnrollmentStatus; title: string; confirm: string; destructive?: boolean }> = {
  authorize: { status: 'active', title: 'Autorizar acceso manual', confirm: 'Autorizar acceso' },
  suspend: { status: 'suspended', title: 'Suspender inscripción', confirm: 'Suspender' },
  reactivate: { status: 'pending', title: 'Reactivar inscripción', confirm: 'Reactivar' },
  cancel: { status: 'cancelled', title: 'Cancelar inscripción', confirm: 'Cancelar inscripción', destructive: true },
};

export const statusDescription = (action: StatusAction, name: string) => {
  switch (action) {
    case 'authorize':
      return (
        <p>
          <strong>{name}</strong> tendrá acceso al curso <strong>sin importar el saldo pendiente</strong>. Esta autorización
          no se revierte sola si se anulan pagos; solo la quitas suspendiendo la inscripción.
        </p>
      );
    case 'suspend':
      return <p>{name} perderá el acceso al curso hasta que reactives la inscripción. Los pagos se conservan.</p>;
    case 'reactivate':
      return (
        <p>
          La inscripción de {name} vuelve a pendiente. Si ya tiene el valor acordado pagado, el acceso se habilita
          automáticamente; si no, queda a la espera del pago.
        </p>
      );
    case 'cancel':
      return <p>La inscripción de {name} se marca como cancelada y deja de contar en los totales. Los pagos se conservan en el historial.</p>;
  }
};

/** Toast text after a status change; `resultStatus` is what the DB ended up with (triggers may activate it). */
export const statusSuccessMessage = (action: StatusAction, resultStatus: EnrollmentStatus): string => {
  switch (action) {
    case 'reactivate':
      return resultStatus === 'active'
        ? 'Inscripción reactivada: ya estaba pagada, acceso habilitado'
        : 'Inscripción reactivada: queda pendiente de pago';
    case 'authorize':
      return 'Acceso autorizado manualmente';
    case 'suspend':
      return 'Inscripción suspendida';
    case 'cancel':
      return 'Inscripción cancelada';
  }
};
