import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, ChevronRight, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { attendanceStatusLabels, attendanceStats } from '@/lib/operations';
import type { AttendanceRecord, ClassSession } from '@/hooks/useClassSessions';
import { attendanceOrder, attendanceStyles } from './attendanceStyles';

interface SessionsListProps {
  sessions: ClassSession[];
  records: AttendanceRecord[];
  onOpen: (session: ClassSession) => void;
}

export const SessionsList = ({ sessions, records, onOpen }: SessionsListProps) => (
  <ul className="grid gap-3">
    {sessions.map((session) => {
      const stats = attendanceStats(records.filter((r) => r.session_id === session.id));
      return (
        <li key={session.id}>
          <button type="button" onClick={() => onOpen(session)} className="w-full text-left" aria-label={`Abrir la lista de la clase ${session.topic ?? ''}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                  <CalendarDays className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium capitalize">{format(new Date(session.starts_at), "EEEE d 'de' MMMM, h:mm a", { locale: es })}</p>
                  <p className="truncate text-sm text-muted-foreground">{session.topic || 'Sin tema'}</p>
                  {session.location && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" aria-hidden /> {session.location}
                    </p>
                  )}
                </div>
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
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
              </CardContent>
            </Card>
          </button>
        </li>
      );
    })}
  </ul>
);
