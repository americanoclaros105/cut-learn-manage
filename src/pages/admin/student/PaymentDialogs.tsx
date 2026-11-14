import { useMemo } from 'react';
import { toast } from 'sonner';
import { RegisterPaymentDialog, type PaymentTarget } from '@/components/admin/operations/RegisterPaymentDialog';
import { VoidPaymentDialog } from '@/components/admin/operations/VoidPaymentDialog';
import { useCreatePayment, useVoidPayment, type PaymentRecord } from '@/hooks/usePayments';
import type { StudentEnrollmentRow } from '@/lib/studentDetail';

export interface PaymentRequest {
  /** Preselected enrollment; when set the dialog is locked to it. */
  enrollmentId: string | null;
}

interface PaymentDialogsProps {
  studentName: string;
  rows: StudentEnrollmentRow[];
  payRequest: PaymentRequest | null;
  onPayClose: () => void;
  voidTarget: PaymentRecord | null;
  onVoidClose: () => void;
}

/** Register-payment and void dialogs shared by the summary and payments tabs. */
export const PaymentDialogs = ({ studentName, rows, payRequest, onPayClose, voidTarget, onVoidClose }: PaymentDialogsProps) => {
  const createPayment = useCreatePayment();
  const voidPayment = useVoidPayment();

  const targets = useMemo<PaymentTarget[]>(
    () =>
      rows
        .filter((r) => r.enrollment.status !== 'cancelled')
        .map((r) => ({
          enrollmentId: r.enrollment.id,
          courseId: r.enrollment.course_id,
          studentName,
          courseTitle: r.course?.title ?? 'Curso no disponible',
          status: r.enrollment.status,
          agreed: r.agreed,
          paid: r.paid,
        })),
    [rows, studentName],
  );

  const initialId = payRequest?.enrollmentId ?? (targets.length === 1 ? targets[0].enrollmentId : null);

  return (
    <>
      <RegisterPaymentDialog
        open={!!payRequest}
        onOpenChange={(open) => !open && onPayClose()}
        targets={targets}
        initialEnrollmentId={initialId}
        lockTarget={!!payRequest?.enrollmentId}
        submitting={createPayment.isPending}
        onSubmit={async ({ target, amount, method, paidAt, reference, notes }) => {
          try {
            const result = await createPayment.mutateAsync({
              enrollmentId: target.enrollmentId,
              courseId: target.courseId,
              amount,
              method,
              paidAt,
              reference,
              notes,
              statusBefore: target.status,
            });
            toast.success(result.activated ? 'Pago registrado — acceso habilitado automáticamente' : 'Pago registrado');
            onPayClose();
          } catch (e) {
            console.error(e);
            toast.error('No se pudo registrar el pago');
          }
        }}
      />

      <VoidPaymentDialog
        open={!!voidTarget}
        onOpenChange={(open) => !open && onVoidClose()}
        summary={voidTarget ? { amount: voidTarget.amount, studentName, courseTitle: voidTarget.course_title } : null}
        submitting={voidPayment.isPending}
        onConfirm={async (reason) => {
          if (!voidTarget) return;
          try {
            await voidPayment.mutateAsync({ paymentId: voidTarget.id, reason, courseId: voidTarget.course_id });
            toast.success('Pago anulado');
            onVoidClose();
          } catch (e) {
            console.error(e);
            toast.error('No se pudo anular el pago');
          }
        }}
      />
    </>
  );
};
