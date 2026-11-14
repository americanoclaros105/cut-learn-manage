import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { attendanceStatusLabels, attendanceStats } from '@/lib/operations';
import type { RosterRow } from '@/lib/roster';
import type { AttendanceRecord, ClassSession } from '@/hooks/useClassSessions';
import { attendanceStyles } from './attendanceStyles';

interface AttendanceMatrixProps {
  rows: RosterRow[];
  /** Oldest first reads naturally left to right. */
  sessions: ClassSession[];
  records: AttendanceRecord[];
}

/** Students x sessions history with icon plus letter in every cell. */
export const AttendanceMatrix = ({ rows, sessions, records }: AttendanceMatrixProps) => {
  const ordered = [...sessions].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const byKey = new Map(records.map((r) => [`${r.session_id}:${r.user_id}`, r]));

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-card">Estudiante</TableHead>
            {ordered.map((s) => (
              <TableHead key={s.id} className="whitespace-nowrap text-center">
                {format(new Date(s.starts_at), 'dd MMM', { locale: es })}
              </TableHead>
            ))}
            <TableHead className="text-right">%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const own = records.filter((r) => r.user_id === row.student.id);
            const stats = attendanceStats(own);
            return (
              <TableRow key={row.enrollment.id}>
                <TableCell className="sticky left-0 whitespace-nowrap bg-card font-medium">{row.student.name}</TableCell>
                {ordered.map((s) => {
                  const record = byKey.get(`${s.id}:${row.student.id}`);
                  if (!record) {
                    return (
                      <TableCell key={s.id} className="text-center text-muted-foreground">
                        <span aria-label="Sin registro">·</span>
                      </TableCell>
                    );
                  }
                  const style = attendanceStyles[record.status];
                  const Icon = style.icon;
                  return (
                    <TableCell key={s.id} className="text-center">
                      <span
                        title={attendanceStatusLabels[record.status]}
                        className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-semibold ${style.tone}`}
                      >
                        <Icon className="h-3 w-3" aria-hidden />
                        {style.short}
                        <span className="sr-only">{attendanceStatusLabels[record.status]}</span>
                      </span>
                    </TableCell>
                  );
                })}
                <TableCell className="text-right tabular-nums">
                  {stats.present + stats.late + stats.absent === 0 ? '—' : `${Math.round(stats.rate * 100)}%`}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
