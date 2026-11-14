import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/admin/operations/ConfirmDialog';
import { EditPriceDialog } from '@/components/admin/operations/EditPriceDialog';
import { EnrollStudentDialog } from '@/components/admin/operations/EnrollStudentDialog';
import { PaymentsSheet } from '@/components/admin/operations/PaymentsSheet';
import { RegisterPaymentDialog, type PaymentTarget } from '@/components/admin/operations/RegisterPaymentDialog';
import { RosterTable, type RosterAction } from '@/components/admin/operations/RosterTable';
import { RosterToolbar } from '@/components/admin/operations/RosterToolbar';
import { VoidPaymentDialog } from '@/components/admin/operations/VoidPaymentDialog';
import { useEnrollStudent, useUpdateEnrollment } from '@/hooks/useEnrollments';
import { useCreatePayment, useEnrollmentPayments, useVoidPayment, type PaymentRecord } from '@/hooks/usePayments';
import { useStudents } from '@/hooks/useStudents';
import { filterRoster, statusCounts, type RosterRow, type RosterStatusFilter } from '@/lib/roster';
import type { EnrollmentStatus } from '@/types';

interface RosterTabProps {
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  rows: RosterRow[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

type StatusAction = 'authorize' | 'suspend' | 'reactivate' | 'cancel';

const statusActions: Record<StatusAction, { status: EnrollmentStatus; title: string; confirm: string; destructive?: boolean }> = {
  authorize: { status: 'active', title: 'Autorizar acceso manual', confirm: 'Autorizar acceso' },
  suspend: { status: 'suspended', title: 'Suspender inscripción', confirm: 'Suspender' },
  reactivate: { status: 'pending', title: 'Reactivar inscripción', confirm: 'Reactivar' },
  cancel: { status: 'cancelled', title: 'Cancelar inscripción', confirm: 'Cancelar inscripción', destructive: true },
};

const statusDescription = (action: StatusAction, name: string) => {
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

/** Roster container: owns filters, dialogs and mutations; presentational pieces get props only. */
export const RosterTab = ({ courseId, courseTitle, coursePrice, rows, loading, error, onRetry }: RosterTabProps) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RosterStatusFilter>('all');

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [payRow, setPayRow] = useState<RosterRow | null>(null);
  const [sheetRow, setSheetRow] = useState<RosterRow | null>(null);
  const [priceRow, setPriceRow] = useState<RosterRow | null>(null);
  const [statusAction, setStatusAction] = useState<{ action: StatusAction; row: RosterRow } | null>(null);
  const [voidTarget, setVoidTarget] = useState<PaymentRecord | null>(null);

  const students = useStudents();
  const enrollStudent = useEnrollStudent();
  const updateEnrollment = useUpdateEnrollment();
  const createPayment = useCreatePayment();
  const voidPayment = useVoidPayment();
  const sheetPayments = useEnrollmentPayments(sheetRow?.enrollment.id ?? null);

  const counts = useMemo(() => statusCounts(rows), [rows]);
  const visible = useMemo(() => filterRoster(rows, { search, status }), [rows, search, status]);

  const enrolledIds = useMemo(() => new Set(rows.map((r) => r.student.id)), [rows]);
  const available = useMemo(
    () => (students.data ?? []).filter((s) => !enrolledIds.has(s.id)).map((s) => ({ id: s.id, name: s.name, phone: s.phone })),
    [students.data, enrolledIds],
  );

  const payTarget: PaymentTarget[] = payRow
    ? [
        {
          enrollmentId: payRow.enrollment.id,
          courseId,
          studentName: payRow.student.name,
          courseTitle,
          status: payRow.enrollment.status,
          agreed: payRow.agreed,
          paid: payRow.paid,
        },
      ]
    : [];

  // Keep the sheet header in sync with refreshed roster data after a void.
  const liveSheetRow = sheetRow ? rows.find((r) => r.enrollment.id === sheetRow.enrollment.id) ?? sheetRow : null;

  const handleAction = (action: RosterAction, row: RosterRow) => {
    if (action === 'pay') setPayRow(row);
    else if (action === 'payments') setSheetRow(row);
    else if (action === 'price') setPriceRow(row);
    else setStatusAction({ action, row });
  };

  const runStatusAction = async () => {
    if (!statusAction) return;
    const { action, row } = statusAction;
    setStatusAction(null);
    try {
      const result = await updateEnrollment.mutateAsync({
        id: row.enrollment.id,
        courseId,
        patch: { status: statusActions[action].status },
      });
      if (action === 'reactivate') {
        toast.success(
          result.status === 'active'
            ? 'Inscripción reactivada: ya estaba pagada, acceso habilitado'
            : 'Inscripción reactivada: queda pendiente de pago',
        );
      } else if (action === 'authorize') toast.success('Acceso autorizado manualmente');
      else if (action === 'suspend') toast.success('Inscripción suspendida');
      else toast.success('Inscripción cancelada');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo actualizar la inscripción');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <RosterToolbar search={search} onSearchChange={setSearch} status={status} onStatusChange={setStatus} counts={counts} />
        <Button onClick={() => setEnrollOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Inscribir estudiante
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="mb-3 text-sm text-destructive">No se pudo cargar el grupo. Revisa tu conexión e inténtalo de nuevo.</p>
          <Button variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden />
          <p className="font-medium">Este curso aún no tiene estudiantes inscritos</p>
          <p className="mb-4 text-sm text-muted-foreground">Inscribe al primero para empezar a registrar pagos y asistencia.</p>
          <Button onClick={() => setEnrollOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Inscribir estudiante
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Ningún estudiante coincide con el filtro.
        </p>
      ) : (
        <RosterTable rows={visible} onAction={handleAction} />
      )}

      <EnrollStudentDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        courseTitle={courseTitle}
        coursePrice={coursePrice}
        students={available}
        loadingStudents={students.isLoading}
        submitting={enrollStudent.isPending}
        onSubmit={async (values) => {
          try {
            await enrollStudent.mutateAsync({ ...values, courseId });
            toast.success('Estudiante inscrito');
            setEnrollOpen(false);
          } catch (e) {
            console.error(e);
            toast.error('No se pudo inscribir al estudiante');
          }
        }}
      />

      <RegisterPaymentDialog
        open={!!payRow}
        onOpenChange={(open) => !open && setPayRow(null)}
        targets={payTarget}
        initialEnrollmentId={payRow?.enrollment.id}
        lockTarget
        submitting={createPayment.isPending}
        onSubmit={async ({ target, amount, method, paidAt, reference, notes }) => {
          try {
            const result = await createPayment.mutateAsync({
              enrollmentId: target.enrollmentId,
              courseId,
              amount,
              method,
              paidAt,
              reference,
              notes,
              statusBefore: target.status,
            });
            toast.success(result.activated ? 'Pago registrado — acceso habilitado automáticamente' : 'Pago registrado');
            setPayRow(null);
          } catch (e) {
            console.error(e);
            toast.error('No se pudo registrar el pago');
          }
        }}
      />

      <PaymentsSheet
        open={!!sheetRow}
        onOpenChange={(open) => !open && setSheetRow(null)}
        studentName={liveSheetRow?.student.name ?? ''}
        agreed={liveSheetRow?.agreed ?? 0}
        paid={liveSheetRow?.paid ?? 0}
        payments={sheetPayments.data ?? []}
        loading={sheetPayments.isLoading}
        error={sheetPayments.isError}
        onVoid={setVoidTarget}
      />

      <VoidPaymentDialog
        open={!!voidTarget}
        onOpenChange={(open) => !open && setVoidTarget(null)}
        summary={voidTarget ? { amount: voidTarget.amount, studentName: sheetRow?.student.name } : null}
        submitting={voidPayment.isPending}
        onConfirm={async (reason) => {
          if (!voidTarget) return;
          try {
            await voidPayment.mutateAsync({ paymentId: voidTarget.id, reason, courseId });
            toast.success('Pago anulado');
            setVoidTarget(null);
          } catch (e) {
            console.error(e);
            toast.error('No se pudo anular el pago');
          }
        }}
      />

      <EditPriceDialog
        open={!!priceRow}
        onOpenChange={(open) => !open && setPriceRow(null)}
        studentName={priceRow?.student.name ?? ''}
        currentPrice={priceRow?.agreed ?? 0}
        paid={priceRow?.paid ?? 0}
        submitting={updateEnrollment.isPending}
        onSubmit={async (price) => {
          if (!priceRow) return;
          try {
            await updateEnrollment.mutateAsync({ id: priceRow.enrollment.id, courseId, patch: { agreed_price: price } });
            toast.success('Valor acordado actualizado');
            setPriceRow(null);
          } catch (e) {
            console.error(e);
            toast.error('No se pudo actualizar el valor');
          }
        }}
      />

      <ConfirmDialog
        open={!!statusAction}
        onOpenChange={(open) => !open && setStatusAction(null)}
        title={statusAction ? statusActions[statusAction.action].title : ''}
        description={statusAction ? statusDescription(statusAction.action, statusAction.row.student.name) : null}
        confirmLabel={statusAction ? statusActions[statusAction.action].confirm : ''}
        destructive={statusAction ? statusActions[statusAction.action].destructive : false}
        onConfirm={runStatusAction}
      />
    </div>
  );
};
