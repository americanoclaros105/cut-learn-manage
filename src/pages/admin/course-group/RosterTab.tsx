import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowRightLeft, MessageCircle, UserPlus, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { BulkReminderDialog } from '@/components/admin/groups/BulkReminderDialog';
import { TransferGroupDialog } from '@/components/admin/groups/TransferGroupDialog';
import { ConfirmDialog } from '@/components/admin/operations/ConfirmDialog';
import { statusActions, statusDescription, statusSuccessMessage, type StatusAction } from '@/components/admin/operations/enrollmentStatusActions';
import { EditPriceDialog } from '@/components/admin/operations/EditPriceDialog';
import { EnrollStudentDialog } from '@/components/admin/operations/EnrollStudentDialog';
import { PaymentsSheet } from '@/components/admin/operations/PaymentsSheet';
import { RegisterPaymentDialog, type PaymentTarget } from '@/components/admin/operations/RegisterPaymentDialog';
import { RosterTable, type RosterAction, type RosterSelection } from '@/components/admin/operations/RosterTable';
import { RosterToolbar } from '@/components/admin/operations/RosterToolbar';
import { VoidPaymentDialog } from '@/components/admin/operations/VoidPaymentDialog';
import { useTransferEnrollmentGroup } from '@/hooks/useCourseGroups';
import { useEnrollStudent, useUpdateEnrollment } from '@/hooks/useEnrollments';
import { useCreatePayment, useEnrollmentPayments, useVoidPayment, type PaymentRecord } from '@/hooks/usePayments';
import { useStudents } from '@/hooks/useStudents';
import { defaultAccessDates, groupErrorMessage } from '@/lib/groups';
import { filterByGroup, paymentReminderTargets, transferOptions } from '@/lib/groupViews';
import { filterRoster, statusCounts, type RosterRow, type RosterStatusFilter } from '@/lib/roster';
import type { CourseGroupWithStats } from '@/types';

interface RosterTabProps {
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  rows: RosterRow[];
  /** Every group of the course (names, capacity) for the Grupo column, filter and transfers. */
  groups: CourseGroupWithStats[];
  /** Detail view of one group: `rows` are already its students and new enrollments go to it. */
  scopeGroup?: CourseGroupWithStats | null;
  /** Every roster row of the course, to hide already enrolled students when `rows` is scoped. */
  allRows?: RosterRow[];
  /** Course-wide view: controlled group selector ('all' | 'none' | group id). */
  groupFilter?: string;
  onGroupFilterChange?: (value: string) => void;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

/** Roster container: owns filters, dialogs and mutations; presentational pieces get props only. */
export const RosterTab = ({
  courseId,
  courseTitle,
  coursePrice,
  rows,
  groups,
  scopeGroup = null,
  allRows,
  groupFilter = 'all',
  onGroupFilterChange,
  loading,
  error,
  onRetry,
}: RosterTabProps) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RosterStatusFilter>('all');

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [payRow, setPayRow] = useState<RosterRow | null>(null);
  const [sheetRow, setSheetRow] = useState<RosterRow | null>(null);
  const [priceRow, setPriceRow] = useState<RosterRow | null>(null);
  const [statusAction, setStatusAction] = useState<{ action: StatusAction; row: RosterRow } | null>(null);
  const [voidTarget, setVoidTarget] = useState<PaymentRecord | null>(null);
  const [transferRows, setTransferRows] = useState<RosterRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [remindOpen, setRemindOpen] = useState(false);

  const students = useStudents();
  const enrollStudent = useEnrollStudent();
  const updateEnrollment = useUpdateEnrollment();
  const createPayment = useCreatePayment();
  const voidPayment = useVoidPayment();
  const transferGroup = useTransferEnrollmentGroup();
  const sheetPayments = useEnrollmentPayments(sheetRow?.enrollment.id ?? null);

  const groupRows = useMemo(() => filterByGroup(rows, scopeGroup ? 'all' : groupFilter), [rows, scopeGroup, groupFilter]);
  const counts = useMemo(() => statusCounts(groupRows), [groupRows]);
  const visible = useMemo(() => filterRoster(groupRows, { search, status }), [groupRows, search, status]);
  const groupsById = useMemo(
    () => Object.fromEntries(groups.map((g) => [g.id, { name: g.name, color: g.color }])),
    [groups],
  );

  const enrolledIds = useMemo(() => new Set((allRows ?? rows).map((r) => r.student.id)), [allRows, rows]);
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

  const selectedRows = useMemo(() => rows.filter((r) => selected.has(r.enrollment.id)), [rows, selected]);
  const selection: RosterSelection = {
    selected,
    onToggle: (id) =>
      setSelected((prev) => {
        const next = new Set(prev);
        if (!next.delete(id)) next.add(id);
        return next;
      }),
    onToggleAll: (ids, checked) =>
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of ids) {
          if (checked) next.add(id);
          else next.delete(id);
        }
        return next;
      }),
  };

  const reminders = useMemo(() => paymentReminderTargets(selectedRows, courseTitle), [selectedRows, courseTitle]);

  const transferFrom = transferRows.length > 0 ? (transferRows[0].enrollment.group_id ?? null) : null;
  const sameOrigin = transferRows.every((r) => (r.enrollment.group_id ?? null) === transferFrom);
  const options = useMemo(
    () => transferOptions(groups, sameOrigin ? transferFrom : null, transferRows.length || 1),
    [groups, sameOrigin, transferFrom, transferRows.length],
  );

  const runTransfer = async (groupId: string) => {
    const batch = transferRows;
    let moved = 0;
    let lastError: unknown = null;
    for (const row of batch) {
      try {
        await transferGroup.mutateAsync({ enrollmentId: row.enrollment.id, courseId, groupId });
        moved += 1;
      } catch (e) {
        console.error(e);
        lastError = e;
      }
    }
    setTransferRows([]);
    setSelected(new Set());
    const target = groups.find((g) => g.id === groupId)?.name ?? 'el grupo';
    if (moved === batch.length) {
      toast.success(moved === 1 ? `Trasladado a ${target}` : `${moved} estudiantes trasladados a ${target}`);
    } else {
      toast.error(`Se trasladaron ${moved} de ${batch.length}`, { description: groupErrorMessage(lastError) });
    }
  };

  const handleAction = (action: RosterAction, row: RosterRow) => {
    if (action === 'transfer') setTransferRows([row]);
    else if (action === 'pay') setPayRow(row);
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
      toast.success(statusSuccessMessage(action, result.status));
    } catch (e) {
      console.error(e);
      toast.error('No se pudo actualizar la inscripción');
    }
  };

  const enrollGroupDates = scopeGroup ? defaultAccessDates(scopeGroup) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {!scopeGroup && onGroupFilterChange && (
            <Select value={groupFilter} onValueChange={onGroupFilterChange}>
              <SelectTrigger className="md:w-52" aria-label="Filtrar por grupo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los grupos</SelectItem>
                <SelectItem value="none">Sin grupo</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <RosterToolbar search={search} onSearchChange={setSearch} status={status} onStatusChange={setStatus} counts={counts} />
        </div>
        <Button onClick={() => setEnrollOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Inscribir estudiante
        </Button>
      </div>

      {selectedRows.length > 0 && (
        <div
          role="region"
          aria-label="Acciones sobre seleccionados"
          className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2"
        >
          <span className="text-sm font-medium">
            {selectedRows.length} {selectedRows.length === 1 ? 'seleccionado' : 'seleccionados'}
          </span>
          <Button size="sm" variant="outline" onClick={() => setTransferRows(selectedRows)}>
            <ArrowRightLeft className="mr-1 h-4 w-4" /> Trasladar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setRemindOpen(true)}>
            <MessageCircle className="mr-1 h-4 w-4" /> Recordatorio de pago por WhatsApp
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            <X className="mr-1 h-4 w-4" /> Limpiar
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="mb-3 text-sm text-destructive">No se pudieron cargar los inscritos. Revisa tu conexión e inténtalo de nuevo.</p>
          <Button variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden />
          <p className="font-medium">
            {scopeGroup ? 'Este grupo aún no tiene estudiantes' : 'Este curso aún no tiene estudiantes inscritos'}
          </p>
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
        <RosterTable rows={visible} onAction={handleAction} groups={groupsById} selection={selection} />
      )}

      <EnrollStudentDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        courseTitle={courseTitle}
        coursePrice={scopeGroup?.price ?? coursePrice}
        groupName={scopeGroup?.name}
        defaultEnabledFrom={enrollGroupDates?.enabledFrom}
        defaultExpiresAt={enrollGroupDates?.expiresAt}
        students={available}
        loadingStudents={students.isLoading}
        submitting={enrollStudent.isPending}
        onSubmit={async (values) => {
          try {
            await enrollStudent.mutateAsync({ ...values, courseId, groupId: scopeGroup?.id ?? null });
            toast.success('Estudiante inscrito');
            setEnrollOpen(false);
          } catch (e) {
            console.error(e);
            toast.error('No se pudo inscribir al estudiante', { description: groupErrorMessage(e) });
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

      <TransferGroupDialog
        open={transferRows.length > 0}
        onOpenChange={(open) => !open && setTransferRows([])}
        studentNames={transferRows.map((r) => r.student.name)}
        fromGroupName={sameOrigin && transferFrom ? (groupsById[transferFrom]?.name ?? null) : null}
        options={options}
        submitting={transferGroup.isPending}
        onConfirm={runTransfer}
      />

      <BulkReminderDialog
        open={remindOpen}
        onOpenChange={setRemindOpen}
        targets={reminders}
        skipped={selectedRows.length - reminders.length}
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
