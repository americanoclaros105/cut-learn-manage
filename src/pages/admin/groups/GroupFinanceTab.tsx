import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GroupFinanceSummary } from '@/components/admin/groups/GroupFinanceSummary';
import { LedgerTable } from '@/components/admin/operations/LedgerTable';
import { RegisterPaymentDialog, type PaymentTarget } from '@/components/admin/operations/RegisterPaymentDialog';
import { VoidPaymentDialog } from '@/components/admin/operations/VoidPaymentDialog';
import { useCreatePayment, useLedgerPayments, useVoidPayment } from '@/hooks/usePayments';
import { buildLedgerCsv, type LedgerPayment } from '@/lib/accounting';
import { downloadTextFile } from '@/lib/download';
import { ledgerForEnrollments, studentBalances } from '@/lib/groupViews';
import { rosterKpis, type RosterRow } from '@/lib/roster';

interface GroupFinanceTabProps {
  courseId: string;
  courseTitle: string;
  groupName: string;
  /** Roster rows of the group (every status). */
  rows: RosterRow[];
  loading: boolean;
}

const slug = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

/** Finances of one group: totals, balances per student and the ledger of its enrollments. */
export const GroupFinanceTab = ({ courseId, courseTitle, groupName, rows, loading }: GroupFinanceTabProps) => {
  const ledger = useLedgerPayments();
  const createPayment = useCreatePayment();
  const voidPayment = useVoidPayment();
  const [payRow, setPayRow] = useState<RosterRow | null>(null);
  const [voidTarget, setVoidTarget] = useState<LedgerPayment | null>(null);

  const kpis = useMemo(() => rosterKpis(rows), [rows]);
  const balances = useMemo(() => studentBalances([...rows]), [rows]);
  const payments = useMemo(
    () =>
      ledgerForEnrollments(
        ledger.data?.payments ?? [],
        new Set(rows.map((r) => r.enrollment.id)),
      ).sort((a, b) => b.paid_at.localeCompare(a.paid_at) || b.created_at.localeCompare(a.created_at)),
    [ledger.data, rows],
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

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GroupFinanceSummary kpis={kpis} rows={balances} courseTitle={courseTitle} onRegisterPayment={setPayRow} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Pagos del grupo</h3>
          <Button
            variant="outline"
            size="sm"
            disabled={payments.length === 0}
            onClick={() => downloadTextFile(`pagos_${slug(courseTitle)}_${slug(groupName)}.csv`, buildLedgerCsv(payments))}
          >
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </div>
        {ledger.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : ledger.isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="mb-3 text-sm text-destructive">No se pudo cargar el libro de pagos.</p>
            <Button variant="outline" onClick={() => ledger.refetch()}>
              Reintentar
            </Button>
          </div>
        ) : payments.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Aún no hay pagos registrados para este grupo.
          </p>
        ) : (
          <LedgerTable payments={payments} staffNames={ledger.data?.staffNames ?? {}} onVoid={setVoidTarget} />
        )}
      </section>

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

      <VoidPaymentDialog
        open={!!voidTarget}
        onOpenChange={(open) => !open && setVoidTarget(null)}
        summary={voidTarget ? { amount: voidTarget.amount, studentName: voidTarget.student_name, courseTitle: voidTarget.course_title } : null}
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
    </div>
  );
};
