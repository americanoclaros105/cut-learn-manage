import { Banknote, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { EnrollmentStatusBadge } from '@/components/admin/operations/EnrollmentStatusBadge';
import { receivableMessage } from '@/lib/accounting';
import { formatCOP } from '@/lib/operations';
import type { RosterKpis, RosterRow } from '@/lib/roster';
import { openWhatsAppMessage } from '@/lib/whatsapp';

interface GroupFinanceSummaryProps {
  kpis: Pick<RosterKpis, 'totalAgreed' | 'totalPaid' | 'totalBalance'>;
  /** Already sorted by balance, largest first. */
  rows: RosterRow[];
  courseTitle: string;
  onRegisterPayment: (row: RosterRow) => void;
}

/** Agreed / collected / pending totals and the per-student balances of one group. */
export const GroupFinanceSummary = ({ kpis, rows, courseTitle, onRegisterPayment }: GroupFinanceSummaryProps) => {
  const pct = kpis.totalAgreed > 0 ? Math.min(100, Math.round((kpis.totalPaid / kpis.totalAgreed) * 100)) : 100;
  return (
    <div className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <dt className="text-xs text-muted-foreground">Acordado</dt>
          <dd className="text-xl font-semibold tabular-nums">{formatCOP(kpis.totalAgreed)}</dd>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <dt className="text-xs text-muted-foreground">Recaudado</dt>
          <dd className="text-xl font-semibold tabular-nums text-green-700">{formatCOP(kpis.totalPaid)}</dd>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <dt className="text-xs text-muted-foreground">Saldo por cobrar</dt>
          <dd className={`text-xl font-semibold tabular-nums ${kpis.totalBalance > 0 ? 'text-amber-700' : ''}`}>
            {formatCOP(kpis.totalBalance)}
          </dd>
        </div>
      </dl>
      <div className="space-y-1">
        <Progress value={pct} className="h-2" aria-label={`Recaudado ${pct}%`} />
        <p className="text-xs text-muted-foreground">{pct}% del valor acordado ya está recaudado.</p>
      </div>

      <h3 className="pt-2 font-semibold">Saldo por estudiante</h3>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Este grupo no tiene estudiantes inscritos.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {rows.map((row) => (
            <li key={row.enrollment.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{row.student.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <EnrollmentStatusBadge status={row.enrollment.status} />
                  <span className="tabular-nums">
                    {formatCOP(row.paid)} de {formatCOP(row.agreed)}
                  </span>
                </div>
              </div>
              <p className={`w-32 text-right text-sm font-semibold tabular-nums ${row.balance > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                {row.balance > 0 ? formatCOP(row.balance) : 'Al día'}
              </p>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => onRegisterPayment(row)}>
                  <Banknote className="mr-1 h-4 w-4" aria-hidden /> Registrar pago
                </Button>
                {row.balance > 0 && row.student.phone && (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Recordar el pago por WhatsApp a ${row.student.name}`}
                    onClick={() =>
                      openWhatsAppMessage(row.student.phone as string, receivableMessage(row.student.name, courseTitle, row.balance))
                    }
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
