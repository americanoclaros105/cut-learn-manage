import type { CSSProperties } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Clock, MapPin, UserRound, Users } from 'lucide-react';
import type { AgendaSession } from '@/hooks/useAgenda';
import { cn } from '@/lib/utils';
import { sessionColorStyle } from './sessionColorStyle';

const timeRange = (session: AgendaSession): string => {
  const start = format(new Date(session.starts_at), 'h:mm a', { locale: es });
  return session.ends_at ? `${start} – ${format(new Date(session.ends_at), 'h:mm a', { locale: es })}` : start;
};

interface AgendaSessionCardProps {
  session: AgendaSession;
  now: Date;
  /** 'block' trims details to fit a grid cell; 'row' shows everything. */
  variant: 'block' | 'row';
  className?: string;
  style?: CSSProperties;
  onOpen: (session: AgendaSession) => void;
}

/** Roll-call status of a class: taken, pending (already started, no records) or none yet. */
const RollCallBadge = ({ session, now }: { session: AgendaSession; now: Date }) => {
  if (session.status === 'cancelled') return <span className="rounded bg-red-100 px-1.5 text-[11px] font-medium text-red-800">Cancelada</span>;
  if (session.rollCallTaken) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded bg-green-100 px-1.5 text-[11px] font-medium text-green-800">
        <CheckCircle2 className="h-3 w-3" aria-hidden /> Lista tomada
      </span>
    );
  }
  if (new Date(session.starts_at) <= now) {
    return <span className="rounded bg-amber-100 px-1.5 text-[11px] font-medium text-amber-800">Lista pendiente</span>;
  }
  return null;
};

/** One class of the agenda: course, group, time, place, instructor, enrolled count and roll call state. */
export const AgendaSessionCard = ({ session, now, variant, className, style, onOpen }: AgendaSessionCardProps) => {
  const cancelled = session.status === 'cancelled';
  const location = session.location ?? session.group?.location ?? null;
  const instructor = session.group?.instructor ?? null;
  const started = new Date(session.starts_at) <= now;
  const ended = session.ends_at ? new Date(session.ends_at) <= now : false;
  const live = !cancelled && started && !ended;
  const compact = variant === 'block';

  return (
    <button
      type="button"
      onClick={() => onOpen(session)}
      title={`${session.course_title}${session.group ? ` · ${session.group.name}` : ''}`}
      className={cn(
        'block w-full overflow-hidden rounded-md border border-l-4 p-1.5 text-left text-xs transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring',
        cancelled && 'border-dashed bg-muted/40 text-muted-foreground line-through decoration-1',
        live && 'ring-2 ring-primary',
        compact ? 'h-full' : 'sm:p-3 sm:text-sm',
        className,
      )}
      style={{ ...sessionColorStyle(session.group?.color, cancelled), ...style }}
    >
      <span className="block truncate font-semibold">{session.course_title}</span>
      <span className="block truncate">{session.group?.name ?? 'Sin grupo'}</span>
      <span className="mt-0.5 flex items-center gap-1 text-muted-foreground">
        <Clock className="h-3 w-3 shrink-0" aria-hidden />
        <span className="truncate">{timeRange(session)}</span>
      </span>
      <span className={cn('mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-muted-foreground', compact && 'hidden xl:flex')}>
        {location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden /> <span className="truncate">{location}</span>
          </span>
        )}
        {instructor && (
          <span className="inline-flex items-center gap-1">
            <UserRound className="h-3 w-3" aria-hidden /> <span className="truncate">{instructor}</span>
          </span>
        )}
        {session.enrolled !== null && (
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" aria-hidden /> {session.enrolled}
          </span>
        )}
      </span>
      <span className="mt-0.5 block">
        <RollCallBadge session={session} now={now} />
      </span>
      {cancelled && session.cancel_reason && !compact && <span className="mt-1 block text-xs no-underline">{session.cancel_reason}</span>}
    </button>
  );
};
