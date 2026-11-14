import { formatCOP } from '@/lib/operations';
import type { RosterKpis } from '@/lib/roster';

interface RosterKpiChipsProps {
  kpis: RosterKpis;
}

interface Chip {
  label: string;
  value: string;
  tone?: string;
}

export const RosterKpiChips = ({ kpis }: RosterKpiChipsProps) => {
  const chips: Chip[] = [
    { label: 'Inscritos', value: String(kpis.enrolled) },
    { label: 'Activos', value: String(kpis.active), tone: 'text-green-700' },
    { label: 'Pendientes de pago', value: String(kpis.pending), tone: kpis.pending ? 'text-amber-700' : undefined },
    { label: 'Total acordado', value: formatCOP(kpis.totalAgreed) },
    { label: 'Recaudado', value: formatCOP(kpis.totalPaid), tone: 'text-green-700' },
    { label: 'Saldo por cobrar', value: formatCOP(kpis.totalBalance), tone: kpis.totalBalance ? 'text-amber-700' : undefined },
    {
      label: 'Asistencia promedio',
      value: kpis.avgAttendance === null ? 'Sin datos' : `${Math.round(kpis.avgAttendance * 100)}%`,
    },
  ];

  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-2">
      {chips.map((chip) => (
        <div key={chip.label} className="rounded-lg border bg-card px-3 py-2">
          <dt className="text-xs text-muted-foreground">{chip.label}</dt>
          <dd className={`text-base font-semibold tabular-nums ${chip.tone ?? ''}`}>{chip.value}</dd>
        </div>
      ))}
    </dl>
  );
};
