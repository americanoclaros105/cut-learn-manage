import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ban, CalendarDays, ChevronRight, MapPin, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { attendanceStatusLabels, attendanceStats } from '@/lib/operations';
import type { AttendanceRecord, ClassSession } from '@/hooks/useClassSessions';
import { attendanceOrder, attendanceStyles } from './attendanceStyles';

interface SessionsListProps {
  sessions: ClassSession[];
  records: AttendanceRecord[];
  onOpen: (session: ClassSession) => void;
  /** When both are given, each class shows its cancel / restore action. */
  onCancel?: (session: ClassSession) => void;
  onRestore?: (session: ClassSession) => void;
}

export const SessionsList = ({ sessions, records, onOpen, onCancel, onRestore }: SessionsListProps) => (
  <ul className="grid gap-3">
    {sessions.map((session) => {
      const stats = attendanceStats(records.filter((r) => r.session_id === session.id));
      const cancelled = session.status === 'cancelled';
      return (
        <li key={session.id}>
          <Card className={`transition-shadow hover:shadow-md ${cancelled ? 'bg-muted/40' : ''}`}>
            <CardContent className="flex items-center gap-2 p-2 sm:gap-4 sm:p-3">
              <button
                type="button"
                onClick={() => onOpen(session)}
                disabled={cancelled}
                className="flex min-w-0 flex-1 items-center gap-4 rounded-md p-2 text-left disabled:cursor-not-allowed"
                aria-label={`Abrir la lista de la clase ${session.topic ?? ''}`}
              >
                <div className={`rounded-lg p-3 ${cancelled ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                  <CalendarDays className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-medium capitalize ${cancelled ? 'line-through text-muted-foreground' : ''}`}>
                    {format(new Date(session.starts_at), "EEEE d 'de' MMMM, h:mm a", { locale: es })}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {cancelled ? `Cancelada${session.cancel_reason ? `: ${session.cancel_reason}` : ''}` : session.topic || 'Sin tema'}
                  </p>
                  {session.location && !cancelled && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" aria-hidden /> {session.location}
                    </p>
                  )}
                </div>
                {!cancelled && (
                  <div className="hidden gap-1 sm:flex" aria-label="Resumen de asistencia">
                    {stats.total === 0 ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Lista sin tomar</span>
                    ) : (
                      attendanceOrder.map((status) => {
                        const Icon = attendanceStyles[status].icon;
                        return (
                          <span
                            key={status}
                            title={attendanceStatusLabels[status]}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${attendanceStyles[status].tone}`}
                          >
                            <Icon className="h-3 w-3" aria-hidden />
                            <span className="sr-only">{attendanceStatusLabels[status]}</span>
                            {stats[status]}
                          </span>
                        );
                      })
                    )}
                  </div>
                )}
                {!cancelled && <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />}
              </button>
              {cancelled && onRestore && (
                <Button size="sm" variant="outline" onClick={() => onRestore(session)}>
                  <Undo2 className="mr-1 h-4 w-4" aria-hidden /> Restaurar
                </Button>
              )}
              {!cancelled && onCancel && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onCancel(session)}
                  aria-label="Cancelar clase"
                  title="Cancelar clase"
                >
                  <Ban className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        </li>
      );
    })}
  </ul>
);
