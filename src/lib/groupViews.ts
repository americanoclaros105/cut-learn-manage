import { groupPhase, isGroupFull } from '@/lib/groups';
import { receivableMessage, type LedgerPayment } from '@/lib/accounting';
import type { RosterRow } from '@/lib/roster';
import type { CourseGroup, CourseGroupWithStats, GroupPhase, SessionStatus } from '@/types';

/**
 * Pure view logic for the groups admin screens (hub, detail, transfer,
 * calendar, finances). No Supabase or React imports.
 */

type TodayInput = string | Date;

// ---------------------------------------------------------------------------
// Group list
// ---------------------------------------------------------------------------

const phaseRank: Record<GroupPhase, number> = { in_progress: 0, upcoming: 1, finished: 2, archived: 3 };

/** In progress first, then upcoming (soonest first), finished (latest first) and archived last. */
export const sortGroups = <G extends Pick<CourseGroup, 'start_date' | 'end_date' | 'archived_at' | 'name'>>(
  groups: G[],
  today: TodayInput,
): G[] =>
  [...groups].sort((a, b) => {
    const pa = groupPhase(a, today);
    const pb = groupPhase(b, today);
    if (pa !== pb) return phaseRank[pa] - phaseRank[pb];
    if (pa === 'upcoming') return a.start_date.localeCompare(b.start_date) || a.name.localeCompare(b.name, 'es');
    return b.end_date.localeCompare(a.end_date) || a.name.localeCompare(b.name, 'es');
  });

export type GroupPhaseFilter = 'all' | GroupPhase;

export const filterGroups = <G extends Pick<CourseGroup, 'start_date' | 'end_date' | 'archived_at' | 'name'>>(
  groups: G[],
  { phase, showArchived }: { phase: GroupPhaseFilter; showArchived: boolean },
  today: TodayInput,
): G[] =>
  sortGroups(
    groups.filter((g) => {
      const current = groupPhase(g, today);
      if (current === 'archived' && !showArchived) return false;
      return phase === 'all' || current === phase;
    }),
    today,
  );

export const groupPhaseCounts = (
  groups: Array<Pick<CourseGroup, 'start_date' | 'end_date' | 'archived_at'>>,
  today: TodayInput,
): Record<GroupPhaseFilter, number> => {
  const counts: Record<GroupPhaseFilter, number> = { all: groups.length, upcoming: 0, in_progress: 0, finished: 0, archived: 0 };
  for (const g of groups) counts[groupPhase(g, today)] += 1;
  return counts;
};

export interface OccupancyInfo {
  label: string;
  /** 0-100, null when the group has no capacity limit. */
  percent: number | null;
  full: boolean;
}

export const occupancyInfo = (capacity: number | null, enrolled: number): OccupancyInfo => {
  if (capacity === null) return { label: enrolled === 1 ? '1 inscrito' : `${enrolled} inscritos`, percent: null, full: false };
  return {
    label: `${enrolled}/${capacity} cupos`,
    percent: Math.min(100, Math.round((enrolled / capacity) * 100)),
    full: isGroupFull(capacity, enrolled),
  };
};

// ---------------------------------------------------------------------------
// Roster rows by group
// ---------------------------------------------------------------------------

interface HasGroup {
  enrollment: { group_id?: string | null; status: string };
}

/** Rows of one group, or the ones without group when groupId is null. */
export const rowsForGroup = <R extends HasGroup>(rows: R[], groupId: string | null): R[] =>
  rows.filter((r) => (r.enrollment.group_id ?? null) === groupId);

/** Group selector used by the roster: 'all', 'none' (Sin grupo) or a group id. */
export const filterByGroup = <R extends HasGroup>(rows: R[], selector: string): R[] =>
  selector === 'all' ? rows : rowsForGroup(rows, selector === 'none' ? null : selector);

/** Live (not cancelled) enrollments still without group. */
export const unassignedCount = (rows: HasGroup[]): number =>
  rows.filter((r) => (r.enrollment.group_id ?? null) === null && r.enrollment.status !== 'cancelled').length;

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export interface SessionLike {
  id: string;
  starts_at: string;
  status: SessionStatus;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day of an instant, 'YYYY-MM-DD'. */
export const localDay = (value: string | Date): string => {
  const d = typeof value === 'string' ? new Date(value) : value;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const byStart = (a: SessionLike, b: SessionLike) => a.starts_at.localeCompare(b.starts_at);

/** First scheduled (not cancelled) class that takes place today. */
export const todaySession = <S extends SessionLike>(sessions: S[], now: Date): S | null => {
  const today = localDay(now);
  return [...sessions].sort(byStart).find((s) => s.status === 'scheduled' && localDay(s.starts_at) === today) ?? null;
};

/** First scheduled class that has not started yet. */
export const nextSession = <S extends SessionLike>(sessions: S[], now: Date): S | null => {
  const t = now.getTime();
  return [...sessions].sort(byStart).find((s) => s.status === 'scheduled' && new Date(s.starts_at).getTime() >= t) ?? null;
};

/** The next `limit` classes that have not started yet (cancelled ones included, so students see them). */
export const upcomingSessions = <S extends SessionLike>(sessions: S[], now: Date, limit: number): S[] => {
  const t = now.getTime();
  return [...sessions]
    .filter((s) => new Date(s.starts_at).getTime() >= t)
    .sort(byStart)
    .slice(0, limit);
};

export const sessionsByDay = <S extends SessionLike>(sessions: S[]): Map<string, S[]> => {
  const map = new Map<string, S[]>();
  for (const s of [...sessions].sort(byStart)) {
    const key = localDay(s.starts_at);
    map.set(key, [...(map.get(key) ?? []), s]);
  }
  return map;
};

export interface SessionSummary {
  total: number;
  cancelled: number;
  /** Sessions with at least one attendance record. */
  withAttendance: number;
  upcoming: number;
  /** Scheduled classes already started whose roll call was never taken. */
  pendingRollCall: number;
}

export const sessionSummary = (
  sessions: SessionLike[],
  records: Array<{ session_id: string }>,
  now: Date,
): SessionSummary => {
  const withRecords = new Set(records.map((r) => r.session_id));
  const t = now.getTime();
  let upcoming = 0;
  let pendingRollCall = 0;
  for (const s of sessions) {
    if (s.status !== 'scheduled') continue;
    if (new Date(s.starts_at).getTime() >= t) upcoming += 1;
    else if (!withRecords.has(s.id)) pendingRollCall += 1;
  }
  return {
    total: sessions.length,
    cancelled: sessions.filter((s) => s.status === 'cancelled').length,
    withAttendance: sessions.filter((s) => withRecords.has(s.id)).length,
    upcoming,
    pendingRollCall,
  };
};

// ---------------------------------------------------------------------------
// Transfer
// ---------------------------------------------------------------------------

export interface TransferOption {
  id: string;
  name: string;
  color: string | null;
  /** null when the group has no limit. */
  seatsLeft: number | null;
  full: boolean;
  disabled: boolean;
}

/**
 * Active groups students can move to (the current one excluded). A group is
 * disabled when it is full or cannot take all `count` students being moved.
 */
export const transferOptions = (
  groups: CourseGroupWithStats[],
  currentGroupId: string | null,
  count = 1,
): TransferOption[] =>
  groups
    .filter((g) => !g.archived_at && g.id !== currentGroupId)
    .map((g) => {
      const full = isGroupFull(g.capacity, g.enrolled);
      const noRoom = g.seats_left !== null && g.seats_left < count;
      return { id: g.id, name: g.name, color: g.color, seatsLeft: g.seats_left, full, disabled: full || noRoom };
    });

// ---------------------------------------------------------------------------
// Finances
// ---------------------------------------------------------------------------

type BalanceRow = Pick<RosterRow, 'enrollment' | 'student' | 'balance'>;

/** Non cancelled students ordered by outstanding balance, largest first. */
export const studentBalances = <R extends BalanceRow>(rows: R[]): R[] =>
  rows
    .filter((r) => r.enrollment.status !== 'cancelled')
    .sort((a, b) => b.balance - a.balance || a.student.name.localeCompare(b.student.name, 'es'));

export interface ReminderTarget {
  enrollmentId: string;
  name: string;
  phone: string;
  balance: number;
  message: string;
}

/** Payment reminders for the debtors that have a phone number, largest balance first. */
export const paymentReminderTargets = (rows: BalanceRow[], courseTitle: string): ReminderTarget[] =>
  studentBalances(rows)
    .filter((r) => r.balance > 0 && !!r.student.phone)
    .map((r) => ({
      enrollmentId: r.enrollment.id,
      name: r.student.name,
      phone: r.student.phone as string,
      balance: r.balance,
      message: receivableMessage(r.student.name, courseTitle, r.balance),
    }));

export const ledgerForEnrollments = (payments: LedgerPayment[], enrollmentIds: Set<string>): LedgerPayment[] =>
  payments.filter((p) => p.enrollment_id !== null && enrollmentIds.has(p.enrollment_id));
