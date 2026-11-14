import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatClock } from '@/lib/agenda';
import { attendanceStats } from '@/lib/operations';
import { upcomingSessions, type SessionLike } from '@/lib/groupViews';
import type { AttendanceStats, AttendanceStatus } from '@/types';

/** Pure view model of a student's group card. No Supabase or React imports. */

export const UPCOMING_LIMIT = 3;

/** "mié 18 nov, 6:00 p. m." (local time). */
export const classWhen = (session: Pick<SessionLike, 'starts_at'>): string =>
  `${format(new Date(session.starts_at), 'EEE d MMM', { locale: es })}, ${formatClock(new Date(session.starts_at))}`;

export interface StudentGroupView<S extends SessionLike> {
  /** Next classes (cancelled ones included, shown as "Cancelada"). */
  upcoming: S[];
  /** The student's own attendance over the classes of the group. */
  attendance: AttendanceStats;
  /** e.g. "Asistencia 67% (2 de 3 clases)"; null while nothing was recorded. */
  attendanceText: string | null;
}

export const studentGroupView = <S extends SessionLike>(
  sessions: S[],
  attendance: Record<string, AttendanceStatus>,
  now: Date,
  limit = UPCOMING_LIMIT,
): StudentGroupView<S> => {
  const recorded = sessions
    .filter((s) => s.status === 'scheduled' && attendance[s.id])
    .map((s) => ({ status: attendance[s.id] }));
  const stats = attendanceStats(recorded);
  const countable = stats.present + stats.late + stats.absent;

  return {
    upcoming: upcomingSessions(sessions, now, limit),
    attendance: stats,
    attendanceText:
      countable === 0
        ? null
        : `Asistencia ${Math.round(stats.rate * 100)}% (${stats.present + stats.late} de ${countable} clases)`,
  };
};
