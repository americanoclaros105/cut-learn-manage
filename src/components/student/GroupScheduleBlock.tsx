import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, MapPin, UserRound } from 'lucide-react';
import { GroupDot } from '@/components/admin/groups/GroupDot';
import type { MyGroupInfo } from '@/hooks/useMyGroups';
import { formatSchedule } from '@/lib/groups';
import { classWhen, studentGroupView } from '@/lib/studentGroups';
import type { EffectiveAccess } from '@/types';

const dmy = (day: string) => format(new Date(`${day.slice(0, 10)}T00:00:00`), 'dd/MM/yyyy');

interface GroupScheduleBlockProps {
  group: MyGroupInfo;
  /** Enrollment access: classes are only readable while it is active, so the empty text differs. */
  access: EffectiveAccess;
  now: Date;
}

/** The student's group for a course: name, weekly schedule, dates, place, next classes and own attendance. */
export const GroupScheduleBlock = ({ group, access, now }: GroupScheduleBlockProps) => {
  const view = studentGroupView(group.sessions, group.attendance, now);
  const place = group.location;

  return (
    <div className="mb-4 space-y-2 rounded-lg border bg-muted/40 p-3 text-sm" onClick={(e) => e.stopPropagation()}>
      <p className="flex items-center gap-2 font-semibold">
        <GroupDot color={group.color} /> {group.name}
      </p>
      <p className="flex items-start gap-1.5 text-muted-foreground">
        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          {formatSchedule(group.schedules)}
          <span className="block text-xs">
            {dmy(group.start_date)} → {dmy(group.end_date)}
          </span>
        </span>
      </p>
      {(place || group.instructor) && (
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {place && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden /> {place}
            </span>
          )}
          {group.instructor && (
            <span className="inline-flex items-center gap-1">
              <UserRound className="h-3.5 w-3.5" aria-hidden /> {group.instructor}
            </span>
          )}
        </p>
      )}

      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground">Próximas clases</p>
        {view.upcoming.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {group.sessions.length === 0 && access !== 'active'
              ? 'Verás las fechas de tus clases cuando tu inscripción esté activa.'
              : 'No hay clases próximas programadas.'}
          </p>
        ) : (
          <ul className="mt-1 space-y-1">
            {view.upcoming.map((session) => (
              <li key={session.id} className="flex flex-wrap items-center justify-between gap-x-2">
                <span className={session.status === 'cancelled' ? 'capitalize text-muted-foreground line-through' : 'capitalize'}>
                  {classWhen(session)}
                </span>
                {session.status === 'cancelled' && (
                  <span className="text-xs font-medium text-red-700">
                    Cancelada{session.cancel_reason ? `: ${session.cancel_reason}` : ''}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {view.attendanceText && <p className="text-xs font-medium">{view.attendanceText}</p>}
    </div>
  );
};
