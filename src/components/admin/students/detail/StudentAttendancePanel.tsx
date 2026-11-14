import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { attendanceOrder, attendanceStyles } from '@/components/admin/operations/attendanceStyles';
import { attendanceStatusLabels } from '@/lib/operations';
import type { StudentEnrollmentRow } from '@/lib/studentDetail';
import { cn } from '@/lib/utils';
import { formatPercent } from './format';

interface StudentAttendancePanelProps {
  rows: StudentEnrollmentRow[];
  loading: boolean;
  error: boolean;
}

/** Per course: this student's status in every session plus their attendance rate. */
export const StudentAttendancePanel = ({ rows, loading, error }: StudentAttendancePanelProps) => {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (error) {
    return (
      <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
        No se pudo cargar la asistencia. Recarga la página para intentarlo de nuevo.
      </p>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <CalendarX className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden />
        <p className="font-medium">Sin inscripciones</p>
        <p className="text-sm text-muted-foreground">La asistencia aparece cuando el estudiante esté inscrito en un curso con clases.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <Card key={row.enrollment.id}>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">{row.course?.title ?? 'Curso no disponible'}</CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium">{row.attendance.total === 0 ? 'Sin registros' : `Asistencia ${formatPercent(row.attendance.rate)}`}</span>
              {attendanceOrder.map((status) => (
                <span key={status} className={cn('rounded-full px-2 py-0.5', attendanceStyles[status].tone)}>
                  {attendanceStatusLabels[status]}: {row.attendance[status]}
                </span>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {row.sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Este curso aún no tiene clases programadas.</p>
            ) : (
              <ul className="divide-y">
                {row.sessions.map(({ session, status }) => {
                  const style = status ? attendanceStyles[status] : null;
                  const Icon = style?.icon;
                  return (
                    <li key={session.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium">{format(new Date(session.starts_at), "EEE dd MMM yyyy, HH:mm", { locale: es })}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[session.topic, session.location].filter(Boolean).join(' · ') || 'Clase presencial'}
                        </p>
                      </div>
                      {status && style && Icon ? (
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', style.tone)}>
                          <Icon className="h-3 w-3" aria-hidden /> {attendanceStatusLabels[status]}
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Sin registrar</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
