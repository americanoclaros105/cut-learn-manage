import { CreditCard, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LedgerTable } from '@/components/admin/operations/LedgerTable';
import type { PaymentRecord } from '@/hooks/usePayments';
import { formatCOP } from '@/lib/operations';

interface StudentPaymentsPanelProps {
  payments: PaymentRecord[];
  staffNames: Record<string, string>;
  loading: boolean;
  error: boolean;
  canRegister: boolean;
  onRetry: () => void;
  onRegister: () => void;
  onVoid: (payment: PaymentRecord) => void;
  onExport: () => void;
}

/** Full ledger of the student: valid and voided payments, totals, void and CSV export. */
export const StudentPaymentsPanel = ({
  payments,
  staffNames,
  loading,
  error,
  canRegister,
  onRetry,
  onRegister,
  onVoid,
  onExport,
}: StudentPaymentsPanelProps) => {
  const valid = payments.filter((p) => !p.voided_at);
  const voided = payments.length - valid.length;
  const total = valid.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" aria-live="polite">
          <span className="text-muted-foreground">Total pagado:</span>{' '}
          <strong className="tabular-nums">{formatCOP(total)}</strong>
          <span className="text-muted-foreground">
            {' '}
            · {valid.length} pago(s) vigente(s){voided > 0 ? ` · ${voided} anulado(s)` : ''}
          </span>
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExport} disabled={payments.length === 0}>
            <Download className="mr-2 h-4 w-4" aria-hidden /> Exportar CSV
          </Button>
          <Button onClick={onRegister} disabled={!canRegister}>
            <CreditCard className="mr-2 h-4 w-4" aria-hidden /> Registrar pago
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="mb-3 text-sm text-destructive">No se pudieron cargar los pagos.</p>
          <Button variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-medium">Aún no hay pagos registrados</p>
          <p className="text-sm text-muted-foreground">Registra el primer abono cuando el estudiante pague.</p>
        </div>
      ) : (
        <LedgerTable payments={payments} staffNames={staffNames} onVoid={onVoid} hideStudent />
      )}
    </div>
  );
};
