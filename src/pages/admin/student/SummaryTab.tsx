import { useState } from 'react';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/admin/operations/ConfirmDialog';
import { EditPriceDialog } from '@/components/admin/operations/EditPriceDialog';
import {
  statusActions,
  statusDescription,
  statusSuccessMessage,
  type StatusAction,
} from '@/components/admin/operations/enrollmentStatusActions';
import { EnrollmentCard, type EnrollmentAction, type EnrollmentGroupInfo } from '@/components/admin/students/detail/EnrollmentCard';
import { EnrollmentDatesDialog } from '@/components/admin/students/detail/EnrollmentDatesDialog';
import { useUpdateEnrollment } from '@/hooks/useEnrollments';
import type { StudentEnrollmentRow } from '@/lib/studentDetail';
import { ChangeGroupDialog } from './ChangeGroupDialog';

interface SummaryTabProps {
  studentName: string;
  rows: StudentEnrollmentRow[];
  /** Groups of the student's courses by id. */
  groupsById: Map<string, EnrollmentGroupInfo>;
  onPay: (enrollmentId: string) => void;
  onEnroll: () => void;
}

/** Enrollment cards and the dialogs behind their actions (price, dates, status). */
export const SummaryTab = ({ studentName, rows, groupsById, onPay, onEnroll }: SummaryTabProps) => {
  const updateEnrollment = useUpdateEnrollment();
  const [priceRow, setPriceRow] = useState<StudentEnrollmentRow | null>(null);
  const [datesRow, setDatesRow] = useState<StudentEnrollmentRow | null>(null);
  const [groupRow, setGroupRow] = useState<StudentEnrollmentRow | null>(null);
  const [statusAction, setStatusAction] = useState<{ action: StatusAction; row: StudentEnrollmentRow } | null>(null);

  const handleAction = (action: EnrollmentAction, row: StudentEnrollmentRow) => {
    if (action === 'pay') onPay(row.enrollment.id);
    else if (action === 'price') setPriceRow(row);
    else if (action === 'dates') setDatesRow(row);
    else if (action === 'group') setGroupRow(row);
    else setStatusAction({ action, row });
  };

  const runStatusAction = async () => {
    if (!statusAction) return;
    const { action, row } = statusAction;
    setStatusAction(null);
    try {
      const result = await updateEnrollment.mutateAsync({
        id: row.enrollment.id,
        courseId: row.enrollment.course_id,
        patch: { status: statusActions[action].status },
      });
      toast.success(statusSuccessMessage(action, result.status));
    } catch (e) {
      console.error(e);
      toast.error('No se pudo actualizar la inscripción');
    }
  };

  // Live (non-cancelled) enrollments first, cancelled ones at the end.
  const ordered = [...rows].sort(
    (a, b) => Number(a.enrollment.status === 'cancelled') - Number(b.enrollment.status === 'cancelled'),
  );

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-medium">Este estudiante aún no está inscrito en ningún curso</p>
          <p className="mb-4 text-sm text-muted-foreground">Inscríbelo para acordar un valor y registrar pagos.</p>
          <Button onClick={onEnroll}>
            <UserPlus className="mr-2 h-4 w-4" aria-hidden /> Inscribir en curso
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onEnroll}>
              <UserPlus className="mr-2 h-4 w-4" aria-hidden /> Inscribir en curso
            </Button>
          </div>
          {ordered.map((row) => (
            <EnrollmentCard
              key={row.enrollment.id}
              row={row}
              group={groupsById.get(row.enrollment.group_id ?? '') ?? null}
              onAction={handleAction}
            />
          ))}
        </>
      )}

      <EditPriceDialog
        open={!!priceRow}
        onOpenChange={(open) => !open && setPriceRow(null)}
        studentName={studentName}
        currentPrice={priceRow?.agreed ?? 0}
        paid={priceRow?.paid ?? 0}
        submitting={updateEnrollment.isPending}
        onSubmit={async (price) => {
          if (!priceRow) return;
          try {
            await updateEnrollment.mutateAsync({
              id: priceRow.enrollment.id,
              courseId: priceRow.enrollment.course_id,
              patch: { agreed_price: price },
            });
            toast.success('Valor acordado actualizado');
            setPriceRow(null);
          } catch (e) {
            console.error(e);
            toast.error('No se pudo actualizar el valor');
          }
        }}
      />

      <EnrollmentDatesDialog
        open={!!datesRow}
        onOpenChange={(open) => !open && setDatesRow(null)}
        courseTitle={datesRow?.course?.title ?? 'Curso'}
        enabledFrom={datesRow?.enrollment.enabled_from ?? null}
        expiresAt={datesRow?.enrollment.expires_at ?? null}
        submitting={updateEnrollment.isPending}
        onSubmit={async (dates) => {
          if (!datesRow) return;
          try {
            await updateEnrollment.mutateAsync({
              id: datesRow.enrollment.id,
              courseId: datesRow.enrollment.course_id,
              patch: dates,
            });
            toast.success('Fechas de acceso actualizadas');
            setDatesRow(null);
          } catch (e) {
            console.error(e);
            toast.error('No se pudieron actualizar las fechas');
          }
        }}
      />

      <ChangeGroupDialog
        studentName={studentName}
        row={groupRow}
        currentGroupName={groupRow ? (groupsById.get(groupRow.enrollment.group_id ?? '')?.name ?? null) : null}
        onClose={() => setGroupRow(null)}
      />

      <ConfirmDialog
        open={!!statusAction}
        onOpenChange={(open) => !open && setStatusAction(null)}
        title={statusAction ? statusActions[statusAction.action].title : ''}
        description={statusAction ? statusDescription(statusAction.action, studentName) : null}
        confirmLabel={statusAction ? statusActions[statusAction.action].confirm : ''}
        destructive={statusAction ? statusActions[statusAction.action].destructive : false}
        onConfirm={runStatusAction}
      />
    </div>
  );
};
