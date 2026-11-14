import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SessionStatus } from '@/types';

/**
 * Pure layout and navigation helpers of the admin agenda (week / day / list).
 * No Supabase or React imports. All calendar math uses the local time zone,
 * which is the one the academy teaches in.
 */

export const AGENDA_START_HOUR = 7;
export const AGENDA_END_HOUR = 22;
export const LIST_DAYS = 30;

const DEFAULT_CLASS_MINUTES = 60;
const MIN_BLOCK_HEIGHT_PCT = 3;
const GRID_MINUTES = (AGENDA_END_HOUR - AGENDA_START_HOUR) * 60;

export type AgendaView = 'week' | 'day' | 'list';

export interface AgendaRange {
  /** Inclusive. */
  from: Date;
  /** Exclusive. */
  to: Date;
}

export interface AgendaSessionLike {
  id: string;
  starts_at: string;
  ends_at: string | null;
  status: SessionStatus;
  course_id: string;
  group_id: string | null;
}

// ---------------------------------------------------------------------------
// Ranges and navigation
// ---------------------------------------------------------------------------

/** Monday 00:00 of the week of `anchor` and the following Monday (exclusive). */
export const weekRange = (anchor: Date): AgendaRange => {
  const day = startOfDay(anchor);
  const sinceMonday = (day.getDay() + 6) % 7;
  const from = addDays(day, -sinceMonday);
  return { from, to: addDays(from, 7) };
};

/** Seven days, Monday first, of the week of `anchor`. */
export const weekDays = (anchor: Date): Date[] => {
  const { from } = weekRange(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(from, i));
};

export const agendaRange = (view: AgendaView, anchor: Date): AgendaRange => {
  if (view === 'week') return weekRange(anchor);
  const from = startOfDay(anchor);
  return { from, to: addDays(from, view === 'day' ? 1 : LIST_DAYS) };
};

const viewStep: Record<AgendaView, number> = { week: 7, day: 1, list: LIST_DAYS };

/** Moves the anchor one page forward (+1) or back (-1) for the view. */
export const shiftAnchor = (view: AgendaView, anchor: Date, direction: 1 | -1): Date =>
  addDays(anchor, viewStep[view] * direction);

const shortDate = (d: Date) => format(d, 'd MMM', { locale: es });

const spanLabel = (first: Date, last: Date): string => {
  const year = format(last, 'yyyy');
  if (first.getFullYear() !== last.getFullYear()) return `${shortDate(first)} ${format(first, 'yyyy')} – ${shortDate(last)} ${year}`;
  if (first.getMonth() === last.getMonth()) return `${format(first, 'd')} – ${format(last, 'd MMM', { locale: es })} ${year}`;
  return `${shortDate(first)} – ${shortDate(last)} ${year}`;
};

/** Title of the visible range, e.g. "9 – 15 nov 2026". */
export const rangeLabel = (view: AgendaView, anchor: Date): string => {
  if (view === 'day') return format(anchor, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  const { from, to } = agendaRange(view, anchor);
  return spanLabel(from, addDays(to, -1));
};

// ---------------------------------------------------------------------------
// Grid geometry
// ---------------------------------------------------------------------------

const minutesIntoGrid = (date: Date): number => (date.getHours() - AGENDA_START_HOUR) * 60 + date.getMinutes();

const sessionEnd = (startsAt: string, endsAt: string | null): Date => {
  const start = new Date(startsAt);
  return endsAt ? new Date(endsAt) : new Date(start.getTime() + DEFAULT_CLASS_MINUTES * 60_000);
};

export interface BlockPosition {
  /** Percent of the grid height. */
  top: number;
  height: number;
}

/** Vertical position of a class inside the 7:00 - 22:00 grid, clamped to it. */
export const blockPosition = (startsAt: string, endsAt: string | null): BlockPosition => {
  const start = minutesIntoGrid(new Date(startsAt));
  const end = minutesIntoGrid(sessionEnd(startsAt, endsAt));
  const clampedStart = Math.min(Math.max(start, 0), GRID_MINUTES);
  const clampedEnd = Math.min(Math.max(end, 0), GRID_MINUTES);
  const height = Math.max(((clampedEnd - clampedStart) / GRID_MINUTES) * 100, MIN_BLOCK_HEIGHT_PCT);
  const top = Math.min((clampedStart / GRID_MINUTES) * 100, 100 - height);
  return { top, height };
};

const hourLabel = (hour: number): string => `${hour % 12 === 0 ? 12 : hour % 12} ${hour >= 12 ? 'p. m.' : 'a. m.'}`;

export const hourMarks = (): Array<{ hour: number; label: string }> =>
  Array.from({ length: AGENDA_END_HOUR - AGENDA_START_HOUR }, (_, i) => {
    const hour = AGENDA_START_HOUR + i;
    return { hour, label: hourLabel(hour) };
  });

/** Percent of the grid where "now" falls, or null outside 7:00 - 22:00. */
export const nowLinePosition = (now: Date): number | null => {
  const minutes = minutesIntoGrid(now);
  return minutes < 0 || minutes >= GRID_MINUTES ? null : (minutes / GRID_MINUTES) * 100;
};

export interface PositionedSession<S extends AgendaSessionLike> {
  session: S;
  /** 0-based column inside its overlap cluster. */
  column: number;
  /** Columns of the cluster: the block width is 1 / columns. */
  columns: number;
}

/**
 * Side-by-side columns for the classes of one day: overlapping classes form a
 * cluster and share its width; back-to-back classes do not overlap.
 */
export const layoutDay = <S extends AgendaSessionLike>(sessions: S[]): Array<PositionedSession<S>> => {
  const items = sessions
    .map((session) => ({
      session,
      start: new Date(session.starts_at).getTime(),
      end: sessionEnd(session.starts_at, session.ends_at).getTime(),
    }))
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const out: Array<PositionedSession<S>> = [];
  let cluster: Array<{ index: number }> = [];
  let columnEnds: number[] = [];
  let clusterEnd = -Infinity;

  const closeCluster = () => {
    for (const { index } of cluster) out[index].columns = columnEnds.length;
    cluster = [];
    columnEnds = [];
  };

  for (const item of items) {
    if (item.start >= clusterEnd) closeCluster();
    let column = columnEnds.findIndex((end) => end <= item.start);
    if (column === -1) column = columnEnds.length;
    columnEnds[column] = item.end;
    clusterEnd = cluster.length === 0 ? item.end : Math.max(clusterEnd, item.end);
    cluster.push({ index: out.length });
    out.push({ session: item.session, column, columns: 1 });
  }
  closeCluster();
  return out;
};

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface AgendaFilters {
  /** 'all' or a course id. */
  courseId: string;
  /** 'all', 'none' (classes without group) or a group id. */
  groupId: string;
  showCancelled: boolean;
}

export const filterAgenda = <S extends AgendaSessionLike>(sessions: S[], filters: AgendaFilters): S[] =>
  sessions.filter((s) => {
    if (!filters.showCancelled && s.status === 'cancelled') return false;
    if (filters.courseId !== 'all' && s.course_id !== filters.courseId) return false;
    if (filters.groupId === 'all') return true;
    return (s.group_id ?? 'none') === filters.groupId;
  });

// ---------------------------------------------------------------------------
// Days and links
// ---------------------------------------------------------------------------

/** Classes that start on the local day of `day`, in time order. */
export const sessionsOfDay = <S extends AgendaSessionLike>(sessions: S[], day: Date): S[] =>
  sessions.filter((s) => isSameDay(new Date(s.starts_at), day)).sort((a, b) => a.starts_at.localeCompare(b.starts_at));

/** Where the roll call of a class lives: its group page, or the course hub for legacy classes. */
export const sessionHref = (session: Pick<AgendaSessionLike, 'id' | 'course_id' | 'group_id'>): string =>
  session.group_id
    ? `/admin/cursos/${session.course_id}/grupos/${session.group_id}?tab=calendario&clase=${session.id}`
    : `/admin/cursos/${session.course_id}/grupos?tab=sin-grupo`;
