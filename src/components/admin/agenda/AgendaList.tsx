import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarX } from 'lucide-react';
import type { AgendaSession } from '@/hooks/useAgenda';
import { sessionsOfDay } from '@/lib/agenda';
import { cn } from '@/lib/utils';
import { AgendaSessionCard } from './AgendaSessionCard';

interface AgendaListProps {
  days: Date[];
  sessions: AgendaSession[];
  now: Date;
  /** Hide days without classes (list view); the week and day views keep them so the empty day is visible. */
  hideEmptyDays?: boolean;
  className?: string;
  onOpen: (session: AgendaSession) => void;
}

/** Classes stacked by day: the mobile layout of the week and day views and the "upcoming classes" list. */
export const AgendaList = ({ days, sessions, now, hideEmptyDays, className, onOpen }: AgendaListProps) => {
  const groups = days
    .map((day) => ({ day, items: sessionsOfDay(sessions, day) }))
    .filter((g) => !hideEmptyDays || g.items.length > 0);

  if (groups.length === 0) {
    return (
      <div className={cn('rounded-lg border border-dashed p-10 text-center', className)}>
        <CalendarX className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden />
        <p className="font-medium">No hay clases en este periodo</p>
        <p className="text-sm text-muted-foreground">Cambia de fechas o quita algún filtro.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {groups.map(({ day, items }) => {
        const today = isSameDay(day, now);
        return (
          <section key={day.toISOString()} aria-label={format(day, "EEEE d 'de' MMMM", { locale: es })}>
            <h3 className={cn('mb-2 flex items-center gap-2 text-sm font-semibold capitalize', today && 'text-primary')}>
              {format(day, "EEEE d 'de' MMMM", { locale: es })}
              {today && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium normal-case text-primary-foreground">Hoy</span>}
            </h3>
            {items.length === 0 ? (
              <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">Sin clases</p>
            ) : (
              <ul className="space-y-2">
                {items.map((session) => (
                  <li key={session.id}>
                    <AgendaSessionCard session={session} now={now} variant="row" onOpen={onOpen} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
};
