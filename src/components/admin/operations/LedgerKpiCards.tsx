import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCOP, paymentMethodLabels } from '@/lib/operations';
import type { LedgerKpis } from '@/lib/accounting';

interface LedgerKpiCardsProps {
  kpis: LedgerKpis;
  /** Outstanding balance of every non cancelled enrollment (not period bound). */
  totalReceivable: number;
  pendingEnrollments: number;
}

const BarList = ({ items, empty }: { items: Array<{ key: string; label: string; amount: number }>; empty: string }) => {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(...items.map((i) => i.amount), 1);
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.key}>
          <div className="flex justify-between gap-2 text-sm">
            <span className="truncate">{item.label}</span>
            <span className="font-medium tabular-nums">{formatCOP(item.amount)}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-muted" aria-hidden>
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((item.amount / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

export const LedgerKpiCards = ({ kpis, totalReceivable, pendingEnrollments }: LedgerKpiCardsProps) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Recaudado en el período</p>
          <p className="text-2xl font-bold tabular-nums text-green-700">{formatCOP(kpis.collected)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Pagos en el período</p>
          <p className="text-2xl font-bold tabular-nums">{kpis.count}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Saldo total por cobrar</p>
          <p className="text-2xl font-bold tabular-nums text-amber-700">{formatCOP(totalReceivable)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Inscripciones pendientes de pago</p>
          <p className="text-2xl font-bold tabular-nums">{pendingEnrollments}</p>
        </CardContent>
      </Card>
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Por medio de pago</CardTitle>
        </CardHeader>
        <CardContent>
          <BarList
            empty="Sin pagos en el período."
            items={kpis.byMethod.map((m) => ({ key: m.method, label: `${paymentMethodLabels[m.method]} (${m.count})`, amount: m.amount }))}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Por curso</CardTitle>
        </CardHeader>
        <CardContent>
          <BarList
            empty="Sin pagos en el período."
            items={kpis.byCourse.map((c) => ({ key: c.courseId, label: `${c.title} (${c.count})`, amount: c.amount }))}
          />
        </CardContent>
      </Card>
    </div>
  </div>
);
