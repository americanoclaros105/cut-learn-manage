import { describe, expect, it } from 'vitest';
import type { CourseGroupWithStats } from '@/types';
import {
  filterByGroup,
  filterGroups,
  groupPhaseCounts,
  ledgerForEnrollments,
  nextSession,
  occupancyInfo,
  paymentReminderTargets,
  rowsForGroup,
  sessionSummary,
  sessionsByDay,
  sortGroups,
  studentBalances,
  todaySession,
  transferOptions,
  unassignedCount,
  upcomingSessions,
} from './groupViews';

const group = (over: Partial<CourseGroupWithStats> & { id: string }): CourseGroupWithStats => ({
  course_id: 'c1',
  name: over.id,
  start_date: '2030-01-01',
  end_date: '2030-03-01',
  location: null,
  instructor: null,
  capacity: null,
  price: null,
  color: null,
  notes: null,
  archived_at: null,
  created_at: '',
  updated_at: '',
  schedules: [],
  enrolled: 0,
  seats_left: null,
  ...over,
});

const upcoming = group({ id: 'up', start_date: '2030-06-01', end_date: '2030-08-01' });
const later = group({ id: 'later', start_date: '2030-09-01', end_date: '2030-11-01' });
const current = group({ id: 'cur', start_date: '2030-01-01', end_date: '2030-12-31' });
const finished = group({ id: 'fin', start_date: '2029-01-01', end_date: '2029-03-01' });
const olderFinished = group({ id: 'fin2', start_date: '2028-01-01', end_date: '2028-03-01' });
const archived = group({ id: 'arc', archived_at: '2030-02-01T00:00:00Z' });
const all = [archived, olderFinished, later, finished, upcoming, current];
const today = '2030-04-10';

describe('sortGroups', () => {
  it('orders in progress, upcoming (soonest first), finished (latest first), archived last', () => {
    expect(sortGroups(all, today).map((g) => g.id)).toEqual(['cur', 'up', 'later', 'fin', 'fin2', 'arc']);
  });

  it('does not mutate the input', () => {
    const copy = [...all];
    sortGroups(all, today);
    expect(all).toEqual(copy);
  });
});

describe('filterGroups', () => {
  it('hides archived groups unless asked', () => {
    expect(filterGroups(all, { phase: 'all', showArchived: false }, today).map((g) => g.id)).not.toContain('arc');
    expect(filterGroups(all, { phase: 'all', showArchived: true }, today).map((g) => g.id)).toContain('arc');
  });

  it('filters by phase', () => {
    expect(filterGroups(all, { phase: 'upcoming', showArchived: false }, today).map((g) => g.id)).toEqual(['up', 'later']);
    expect(filterGroups(all, { phase: 'archived', showArchived: true }, today).map((g) => g.id)).toEqual(['arc']);
  });
});

describe('groupPhaseCounts', () => {
  it('counts per phase and in total', () => {
    expect(groupPhaseCounts(all, today)).toEqual({
      all: 6,
      upcoming: 2,
      in_progress: 1,
      finished: 2,
      archived: 1,
    });
  });
});

describe('occupancyInfo', () => {
  it('shows used and total seats with a percentage', () => {
    expect(occupancyInfo(15, 12)).toEqual({ label: '12/15 cupos', percent: 80, full: false });
  });

  it('flags a full group and caps the bar at 100', () => {
    expect(occupancyInfo(10, 10)).toEqual({ label: '10/10 cupos', percent: 100, full: true });
    expect(occupancyInfo(10, 12).percent).toBe(100);
  });

  it('has no bar without a capacity limit', () => {
    expect(occupancyInfo(null, 7)).toEqual({ label: '7 inscritos', percent: null, full: false });
    expect(occupancyInfo(null, 1).label).toBe('1 inscrito');
  });
});

describe('rows by group', () => {
  const r = (id: string, groupId: string | null, status = 'active') =>
    ({ enrollment: { id, group_id: groupId, status } }) as never;
  const rows = [r('1', 'g1'), r('2', null), r('3', 'g1', 'cancelled'), r('4', 'g2'), r('5', null, 'cancelled')];

  it('selects the rows of one group, or the ungrouped ones with null', () => {
    expect(rowsForGroup(rows, 'g1').map((x: { enrollment: { id: string } }) => x.enrollment.id)).toEqual(['1', '3']);
    expect(rowsForGroup(rows, null).map((x: { enrollment: { id: string } }) => x.enrollment.id)).toEqual(['2', '5']);
  });

  it('counts only non cancelled enrollments without group', () => {
    expect(unassignedCount(rows)).toBe(1);
  });

  it('filters by group selector: all, none or a group id', () => {
    const ids = (f: string) => filterByGroup(rows, f).map((x: { enrollment: { id: string } }) => x.enrollment.id);
    expect(ids('all')).toHaveLength(5);
    expect(ids('none')).toEqual(['2', '5']);
    expect(ids('g2')).toEqual(['4']);
  });
});

describe('sessions helpers', () => {
  const at = (y: number, m: number, d: number, h: number) => new Date(y, m - 1, d, h, 0).toISOString();
  const s = (id: string, startsAt: string, status: 'scheduled' | 'cancelled' = 'scheduled') => ({
    id,
    starts_at: startsAt,
    status,
  });
  const sessions = [
    s('past', at(2030, 4, 8, 18)),
    s('cancelled-today', at(2030, 4, 10, 9), 'cancelled'),
    s('today-late', at(2030, 4, 10, 18)),
    s('today-early', at(2030, 4, 10, 8)),
    s('next', at(2030, 4, 12, 18)),
    s('later', at(2030, 4, 15, 18)),
  ];

  it('finds the first scheduled class of today', () => {
    expect(todaySession(sessions, new Date(2030, 3, 10, 12, 0))?.id).toBe('today-early');
    expect(todaySession(sessions, new Date(2030, 3, 11, 12, 0))).toBeNull();
  });

  it('ignores a cancelled class today', () => {
    expect(todaySession([sessions[1]], new Date(2030, 3, 10, 12, 0))).toBeNull();
  });

  it('finds the next upcoming scheduled class', () => {
    expect(nextSession(sessions, new Date(2030, 3, 10, 19, 0))?.id).toBe('next');
    expect(nextSession(sessions, new Date(2031, 0, 1))).toBeNull();
  });

  it('groups sessions by local day', () => {
    const map = sessionsByDay(sessions);
    expect(map.get('2030-04-10')?.map((x) => x.id)).toEqual(['today-early', 'cancelled-today', 'today-late']);
    expect(map.get('2030-04-12')).toHaveLength(1);
  });

  it('summarizes the calendar', () => {
    const records = [{ session_id: 'past' }, { session_id: 'past' }, { session_id: 'today-early' }];
    expect(sessionSummary(sessions, records, new Date(2030, 3, 10, 19, 0))).toEqual({
      total: 6,
      cancelled: 1,
      withAttendance: 2,
      upcoming: 2,
      pendingRollCall: 1,
    });
  });
});

describe('transferOptions', () => {
  const groups = [
    group({ id: 'a', capacity: 10, enrolled: 4, seats_left: 6 }),
    group({ id: 'b', capacity: 10, enrolled: 10, seats_left: 0 }),
    group({ id: 'c' }),
    group({ id: 'd', archived_at: '2030-01-01T00:00:00Z' }),
  ];

  it('lists the other active groups, disabling full ones', () => {
    const options = transferOptions(groups, 'c');
    expect(options.map((o) => o.id)).toEqual(['a', 'b']);
    expect(options.find((o) => o.id === 'a')).toMatchObject({ disabled: false, seatsLeft: 6 });
    expect(options.find((o) => o.id === 'b')).toMatchObject({ disabled: true, seatsLeft: 0 });
  });

  it('disables groups without enough seats for a bulk move', () => {
    const options = transferOptions(groups, 'c', 7);
    expect(options.find((o) => o.id === 'a')).toMatchObject({ disabled: true, full: false });
    expect(transferOptions(groups, 'c', 6).find((o) => o.id === 'a')?.disabled).toBe(false);
  });

  it('offers every active group to an ungrouped enrollment', () => {
    expect(transferOptions(groups, null).map((o) => o.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('finance helpers', () => {
  const rows = [
    { enrollment: { id: 'e1', status: 'active' }, student: { name: 'Ana', phone: '300 111' }, agreed: 100, paid: 100, balance: 0 },
    { enrollment: { id: 'e2', status: 'pending' }, student: { name: 'Beto', phone: '300 222' }, agreed: 100, paid: 20, balance: 80 },
    { enrollment: { id: 'e3', status: 'pending' }, student: { name: 'Caro', phone: null }, agreed: 100, paid: 70, balance: 30 },
    { enrollment: { id: 'e4', status: 'cancelled' }, student: { name: 'Dani', phone: '300 444' }, agreed: 100, paid: 0, balance: 100 },
    { enrollment: { id: 'e5', status: 'pending' }, student: { name: 'Eva', phone: '300 555' }, agreed: 100, paid: 50, balance: 50 },
  ] as never[];

  it('sorts balances descending and skips cancelled enrollments', () => {
    expect(studentBalances(rows).map((r: { student: { name: string } }) => r.student.name)).toEqual(['Beto', 'Eva', 'Caro', 'Ana']);
  });

  it('builds payment reminders only for debtors with a phone', () => {
    const targets = paymentReminderTargets(rows, 'Micropigmentación');
    expect(targets.map((t) => t.name)).toEqual(['Beto', 'Eva']);
    expect(targets[0].phone).toBe('300 222');
    expect(targets[0].message).toContain('Beto');
    expect(targets[0].message).toContain('Micropigmentación');
  });

  it('keeps only the ledger payments of the given enrollments', () => {
    const payments = [
      { id: 'p1', enrollment_id: 'e1' },
      { id: 'p2', enrollment_id: 'e9' },
      { id: 'p3', enrollment_id: null },
    ] as never[];
    expect(ledgerForEnrollments(payments, new Set(['e1'])).map((p: { id: string }) => p.id)).toEqual(['p1']);
  });
});

describe('upcomingSessions', () => {
  const now = new Date('2026-11-13T12:00:00Z');
  const s = (id: string, starts_at: string, status: 'scheduled' | 'cancelled' = 'scheduled') => ({ id, starts_at, status });

  it('returns the next sessions in order, cancelled ones included', () => {
    const out = upcomingSessions(
      [
        s('past', '2026-11-10T18:00:00Z'),
        s('c', '2026-11-20T18:00:00Z'),
        s('a', '2026-11-14T18:00:00Z'),
        s('b', '2026-11-17T18:00:00Z', 'cancelled'),
        s('d', '2026-11-27T18:00:00Z'),
      ],
      now,
      3,
    );
    expect(out.map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('is empty when nothing is ahead', () => {
    expect(upcomingSessions([s('past', '2026-11-10T18:00:00Z')], now, 3)).toEqual([]);
  });
});
