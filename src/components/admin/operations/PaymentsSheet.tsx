import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCOP, paymentMethodLabels } from '@/lib/operations';
import type { PaymentRecord } from '@/hooks/usePayments';

interface PaymentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  agreed: number;
  paid: number;
  payments: PaymentRecord[];
  loading: boolean;
  error: boolean;
  onVoid: (payment: PaymentRecord) => void;
}

const day = (value: string) => format(new Date(`${value.slice(0, 10)}T00:00:00`), 'dd MMM yyyy', { locale: es });

/** Ledger of one enrollment, voided payments included. */
export const PaymentsSheet = ({
  open,
  onOpenChange,
  studentName,
  agreed,
  paid,
  payments,
  loading,
  error,
  onVoid,
}: PaymentsSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent className="w-full overflow-y-auto sm:max-w-md">
      <SheetHeader>
        <SheetTitle>Pagos de {studentName}</SheetTitle>
        <SheetDescription>
          Acordado {formatCOP(agreed)} · Pagado {formatCOP(paid)} · Saldo {formatCOP(Math.max(0, agreed - paid))}
        </SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-3">
        {loading && (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        )}
        {error && <p className="text-sm text-destructive">No se pudieron cargar los pagos. Intenta de nuevo.</p>}
        {!loading && !error && payments.length === 0 && (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aún no hay pagos registrados.
          </p>
        )}
        {payments.map((p) => {
          const voided = !!p.voided_at;
          return (
            <div key={p.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`font-semibold tabular-nums ${voided ? 'text-muted-foreground line-through' : ''}`}>
                    {formatCOP(p.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {day(p.paid_at)} · {paymentMethodLabels[p.method]}
                    {p.reference ? ` · Ref. ${p.reference}` : ''}
                  </p>
                </div>
                {voided ? (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Anulado</span>
                ) : (
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onVoid(p)}>
                    <Ban className="mr-1 h-3 w-3" /> Anular
                  </Button>
                )}
              </div>
              {p.notes && <p className="mt-2 text-xs text-muted-foreground">{p.notes}</p>}
              {voided && p.void_reason && <p className="mt-2 text-xs text-muted-foreground">Motivo: {p.void_reason}</p>}
            </div>
          );
        })}
      </div>
    </SheetContent>
  </Sheet>
);
