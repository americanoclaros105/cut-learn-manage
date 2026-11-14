import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GroupDot } from '@/components/admin/groups/GroupDot';
import type { AgendaSession, UpcomingGroup } from '@/hooks/useAgenda';
import { formatClock, sessionHref } from '@/lib/agenda';
import { occupancyInfo } from '@/lib/groupViews';

interface TodayClassesCardProps {
  sessions: AgendaSession[];
  loading: boolean;
}

/** Dashboard card: classes happening today with a shortcut to each roll call. */
export const TodayClassesCard = ({ sessions, loading }: TodayClassesCardProps) => (
  <Card className="border-0 shadow-lg">
    <CardHeader className="flex flex-row items-center justify-between space-y-0">
      <CardTitle className="flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-primary" aria-hidden /> Clases de hoy
      </CardTitle>
      <Button asChild variant="link" className="h-auto p-0">
        <Link to="/admin/agenda">Ver agenda</Link>
      </Button>
    </CardHeader>
    <CardContent className="space-y-2">
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hoy no hay clases programadas.</p>
      ) : (
        sessions.map((s) => (
          <Link
            key={s.id}
            to={sessionHref(s)}
            className="flex items-center justify-between gap-3 rounded-lg bg-secondary p-3 transition-colors hover:bg-secondary/80"
          >
            <span className="flex min-w-0 items-center gap-2">
              <GroupDot color={s.group?.color ?? null} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{s.course_title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {formatClock(new Date(s.starts_at))} · {s.group?.name ?? 'Sin grupo'}
                </span>
              </span>
            </span>
            <span className="shrink-0 text-xs font-medium text-primary">{s.rollCallTaken ? 'Revisar lista' : 'Tomar lista'}</span>
          </Link>
        ))
      )}
    </CardContent>
  </Card>
);

interface UpcomingGroupsCardProps {
  groups: UpcomingGroup[];
  loading: boolean;
}

/** Dashboard card: the next groups that have not started yet, with their seats taken. */
export const UpcomingGroupsCard = ({ groups, loading }: UpcomingGroupsCardProps) => (
  <Card className="border-0 shadow-lg">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-primary" aria-hidden /> Próximos grupos por iniciar
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay grupos próximos a iniciar.</p>
      ) : (
        groups.map((g) => (
          <Link
            key={g.id}
            to={`/admin/cursos/${g.course_id}/grupos/${g.id}`}
            className="flex items-center justify-between gap-3 rounded-lg bg-secondary p-3 transition-colors hover:bg-secondary/80"
          >
            <span className="flex min-w-0 items-center gap-2">
              <GroupDot color={g.color} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{g.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {g.course_title} · inicia {format(new Date(`${g.start_date}T00:00:00`), "d 'de' MMM", { locale: es })}
                </span>
              </span>
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">{occupancyInfo(g.capacity, g.enrolled).label}</span>
          </Link>
        ))
      )}
    </CardContent>
  </Card>
);
