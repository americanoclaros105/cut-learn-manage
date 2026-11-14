import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, CalendarDays, MapPin, UserRound } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCOP } from '@/lib/operations';
import { formatDayLabel } from '@/lib/groupForm';
import { formatSchedule } from '@/lib/groups';
import type { CourseGroupWithStats, GroupPhase } from '@/types';
import { GroupDot } from './GroupDot';
import { GroupOccupancy } from './GroupOccupancy';
import { GroupPhaseBadge } from './GroupPhaseBadge';

interface GroupCardProps {
  group: CourseGroupWithStats;
  phase: GroupPhase;
  collected: number;
  pending: number;
  /** Start of the next scheduled class, ISO instant. */
  nextClassAt: string | null;
  onOpen: () => void;
}

export const GroupCard = ({ group, phase, collected, pending, nextClassAt, onOpen }: GroupCardProps) => (
  <Card className={`transition-shadow hover:shadow-md ${phase === 'archived' ? 'opacity-70' : ''}`}>
    <button type="button" onClick={onOpen} className="w-full text-left" aria-label={`Abrir ${group.name}`}>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <GroupDot color={group.color} className="h-4 w-4" />
            <h3 className="truncate text-lg font-semibold">{group.name}</h3>
          </div>
          <GroupPhaseBadge phase={phase} />
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
            {formatDayLabel(group.start_date)} – {formatDayLabel(group.end_date)}
          </p>
          <p className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
            <span>{formatSchedule(group.schedules)}</span>
          </p>
          {group.location && (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden /> {group.location}
            </p>
          )}
          {group.instructor && (
            <p className="flex items-center gap-2">
              <UserRound className="h-4 w-4 shrink-0" aria-hidden /> {group.instructor}
            </p>
          )}
        </div>

        <GroupOccupancy capacity={group.capacity} enrolled={group.enrolled} />

        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md bg-green-50 px-3 py-2">
            <dt className="text-xs text-muted-foreground">Recaudado</dt>
            <dd className="font-semibold tabular-nums text-green-700">{formatCOP(collected)}</dd>
          </div>
          <div className={`rounded-md px-3 py-2 ${pending > 0 ? 'bg-amber-50' : 'bg-muted/50'}`}>
            <dt className="text-xs text-muted-foreground">Por cobrar</dt>
            <dd className={`font-semibold tabular-nums ${pending > 0 ? 'text-amber-700' : ''}`}>{formatCOP(pending)}</dd>
          </div>
        </dl>

        <p className="text-xs text-muted-foreground">
          {nextClassAt ? (
            <>
              Próxima clase:{' '}
              <span className="font-medium capitalize text-foreground">
                {format(new Date(nextClassAt), "EEE d MMM, h:mm a", { locale: es })}
              </span>
            </>
          ) : (
            'Sin clases próximas'
          )}
        </p>
      </CardContent>
    </button>
  </Card>
);
