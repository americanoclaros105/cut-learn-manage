import { Card, CardContent } from '@/components/ui/card';
import { formatCOP } from '@/lib/operations';
import type { StudentKpis } from '@/lib/studentDetail';
import { cn } from '@/lib/utils';
import { formatPercent } from './format';

interface StudentKpiCardsProps {
  kpis: StudentKpis;
}

/** Quick numbers of the student; the pending balance turns red when something is owed. */
export const StudentKpiCards = ({ kpis }: StudentKpiCardsProps) => {
  const items = [
    { label: 'Cursos inscritos', value: String(kpis.enrolled), tone: '' },
    { label: 'Total acordado', value: formatCOP(kpis.totalAgreed), tone: '' },
    { label: 'Pagado', value: formatCOP(kpis.totalPaid), tone: 'text-green-700' },
    { label: 'Saldo pendiente', value: formatCOP(kpis.totalBalance), tone: kpis.totalBalance > 0 ? 'text-destructive' : '' },
    { label: 'Asistencia', value: formatPercent(kpis.attendanceRate), tone: '' },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className={cn('mt-1 text-xl font-semibold tabular-nums', item.tone)}>{item.value}</dd>
          </CardContent>
        </Card>
      ))}
    </dl>
  );
};
