import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AgendaSession } from '@/hooks/useAgenda';
import {
  AGENDA_END_HOUR,
  AGENDA_START_HOUR,
  blockPosition,
  hourMarks,
  layoutDay,
  nowLinePosition,
  sessionsOfDay,
} from '@/lib/agenda';
import { cn } from '@/lib/utils';
import { AgendaSessionCard } from './AgendaSessionCard';

const HOUR_PX = 56;
const GRID_HEIGHT = (AGENDA_END_HOUR - AGENDA_START_HOUR) * HOUR_PX;

interface AgendaGridProps {
  /** One column per day: seven for the week view, one for the day view. */
  days: Date[];
  sessions: AgendaSession[];
  now: Date;
  onOpen: (session: AgendaSession) => void;
}

/** Time grid (7:00 - 22:00): classes are blocks positioned by time, side by side when they overlap. */
export const AgendaGrid = ({ days, sessions, now, onOpen }: AgendaGridProps) => {
  const marks = hourMarks();
  const nowTop = nowLinePosition(now);
  const columns = `3.5rem repeat(${days.length}, minmax(0, 1fr))`;

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <div className="min-w-[640px]">
        <div className="grid border-b" style={{ gridTemplateColumns: columns }}>
          <div />
          {days.map((day) => {
            const today = isSameDay(day, now);
            return (
              <div key={day.toISOString()} className={cn('border-l px-2 py-2 text-center', today && 'bg-primary/10')}>
                <p className="text-xs uppercase text-muted-foreground">{format(day, 'EEE', { locale: es })}</p>
                <p className={cn('text-lg font-semibold', today && 'text-primary')}>{format(day, 'd')}</p>
              </div>
            );
          })}
        </div>

        <div className="grid" style={{ gridTemplateColumns: columns }}>
          <div className="relative" style={{ height: GRID_HEIGHT }}>
            {marks.map((mark, i) => (
              <span
                key={mark.hour}
                className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground"
                style={{ top: i * HOUR_PX, display: i === 0 ? 'none' : undefined }}
              >
                {mark.label}
              </span>
            ))}
          </div>

          {days.map((day) => {
            const today = isSameDay(day, now);
            const positioned = layoutDay(sessionsOfDay(sessions, day));
            return (
              <div
                key={day.toISOString()}
                className={cn('relative border-l', today && 'bg-primary/5')}
                style={{
                  height: GRID_HEIGHT,
                  backgroundImage: 'linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)',
                  backgroundSize: `100% ${HOUR_PX}px`,
                }}
              >
                {positioned.map(({ session, column, columns: count }) => {
                  const { top, height } = blockPosition(session.starts_at, session.ends_at);
                  return (
                    <div
                      key={session.id}
                      className="absolute px-0.5"
                      style={{ top: `${top}%`, height: `${height}%`, left: `${(column / count) * 100}%`, width: `${100 / count}%` }}
                    >
                      <AgendaSessionCard session={session} now={now} variant="block" onOpen={onOpen} />
                    </div>
                  );
                })}
                {today && nowTop !== null && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-red-500"
                    style={{ top: `${nowTop}%` }}
                  >
                    <span className="absolute -left-1 -top-[5px] h-2 w-2 rounded-full bg-red-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
