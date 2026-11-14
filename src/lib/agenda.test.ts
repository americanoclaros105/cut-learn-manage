import { describe, expect, it } from 'vitest';
import {
  AGENDA_END_HOUR,
  AGENDA_START_HOUR,
  agendaRange,
  blockPosition,
  filterAgenda,
  formatClock,
  hourMarks,
  layoutDay,
  nowLinePosition,
  rangeLabel,
  sessionHref,
  sessionsOfDay,
  shiftAnchor,
  weekDays,
  weekRange,
  type AgendaSessionLike,
} from './agenda';

const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min);
const iso = (y: number, m: number, d: number, h: number, min = 0) => local(y, m, d, h, min).toISOString();

describe('weekRange / weekDays', () => {
  it('starts on Monday and ends the next Monday (exclusive)', () => {
    // Wednesday 2026-11-11
    const { from, to } = weekRange(local(2026, 11, 11, 15, 30));
    expect(from).toEqual(local(2026, 11, 9));
    expect(to).toEqual(local(2026, 11, 16));
  });

  it('treats Sunday as the last day of its week', () => {
    const { from, to } = weekRange(local(2026, 11, 15, 10));
    expect(from).toEqual(local(2026, 11, 9));
    expect(to).toEqual(local(2026, 11, 16));
  });

  it('returns seven consecutive days Monday to Sunday', () => {
    const days = weekDays(local(2026, 11, 11));
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual(local(2026, 11, 9));
    expect(days[6]).toEqual(local(2026, 11, 15));
  });
});

describe('agendaRange / shiftAnchor', () => {
  const anchor = local(2026, 11, 11, 9);

  it('week view covers Monday to Monday', () => {
    expect(agendaRange('week', anchor)).toEqual({ from: local(2026, 11, 9), to: local(2026, 11, 16) });
  });

  it('day view covers the anchor day', () => {
    expect(agendaRange('day', anchor)).toEqual({ from: local(2026, 11, 11), to: local(2026, 11, 12) });
  });

  it('list view covers 30 days from the anchor day', () => {
    expect(agendaRange('list', anchor)).toEqual({ from: local(2026, 11, 11), to: local(2026, 12, 11) });
  });

  it('moves the anchor by the size of the view', () => {
    expect(shiftAnchor('week', anchor, 1)).toEqual(local(2026, 11, 18, 9));
    expect(shiftAnchor('week', anchor, -1)).toEqual(local(2026, 11, 4, 9));
    expect(shiftAnchor('day', anchor, 1)).toEqual(local(2026, 11, 12, 9));
    expect(shiftAnchor('list', anchor, 1)).toEqual(local(2026, 12, 11, 9));
  });
});

describe('rangeLabel', () => {
  it('shows a compact Spanish week range', () => {
    expect(rangeLabel('week', local(2026, 11, 11))).toBe('9 – 15 nov 2026');
  });

  it('names both months when the week crosses a month', () => {
    expect(rangeLabel('week', local(2026, 11, 30))).toBe('30 nov – 6 dic 2026');
  });

  it('writes the full date in day view', () => {
    expect(rangeLabel('day', local(2026, 11, 11))).toBe('miércoles 11 de noviembre de 2026');
  });

  it('shows the 30-day window in list view', () => {
    expect(rangeLabel('list', local(2026, 11, 11))).toBe('11 nov – 10 dic 2026');
  });
});

describe('blockPosition', () => {
  const span = AGENDA_END_HOUR - AGENDA_START_HOUR;

  it('positions a class by its start and duration inside the grid', () => {
    const p = blockPosition(iso(2026, 11, 9, 9), iso(2026, 11, 9, 11));
    expect(p.top).toBeCloseTo((2 / span) * 100);
    expect(p.height).toBeCloseTo((2 / span) * 100);
  });

  it('assumes one hour when the class has no end', () => {
    const p = blockPosition(iso(2026, 11, 9, 8), null);
    expect(p.height).toBeCloseTo((1 / span) * 100);
  });

  it('clamps classes that begin before the grid', () => {
    const p = blockPosition(iso(2026, 11, 9, 6), iso(2026, 11, 9, 9));
    expect(p.top).toBe(0);
    expect(p.height).toBeCloseTo((2 / span) * 100);
  });

  it('clamps classes that end after the grid', () => {
    const p = blockPosition(iso(2026, 11, 9, 21), iso(2026, 11, 9, 23, 30));
    expect(p.top + p.height).toBeCloseTo(100);
  });

  it('keeps very short classes visible', () => {
    const p = blockPosition(iso(2026, 11, 9, 10), iso(2026, 11, 9, 10, 10));
    expect(p.height).toBeGreaterThanOrEqual(3);
  });
});

describe('layoutDay', () => {
  const s = (id: string, startH: number, endH: number): AgendaSessionLike => ({
    id,
    starts_at: iso(2026, 11, 9, startH),
    ends_at: iso(2026, 11, 9, endH),
    status: 'scheduled',
    course_id: 'c1',
    group_id: 'g1',
  });

  it('gives a lone class the full width', () => {
    expect(layoutDay([s('a', 9, 10)])).toEqual([{ session: s('a', 9, 10), column: 0, columns: 1 }]);
  });

  it('puts back-to-back classes in the same column', () => {
    const out = layoutDay([s('a', 9, 10), s('b', 10, 11)]);
    expect(out.map((o) => [o.column, o.columns])).toEqual([
      [0, 1],
      [0, 1],
    ]);
  });

  it('splits overlapping classes into side-by-side columns', () => {
    const out = layoutDay([s('a', 9, 11), s('b', 10, 12)]);
    expect(out.map((o) => [o.session.id, o.column, o.columns])).toEqual([
      ['a', 0, 2],
      ['b', 1, 2],
    ]);
  });

  it('reuses a free column inside the same overlapping cluster', () => {
    const out = layoutDay([s('a', 9, 12), s('b', 9, 10), s('c', 10, 11)]);
    const byId = Object.fromEntries(out.map((o) => [o.session.id, o]));
    expect(byId.a.column).toBe(0);
    expect(byId.b.column).toBe(1);
    expect(byId.c.column).toBe(1);
    expect(byId.a.columns).toBe(2);
    expect(byId.c.columns).toBe(2);
  });

  it('keeps separate clusters independent', () => {
    const out = layoutDay([s('a', 9, 10), s('b', 9, 10), s('c', 14, 15)]);
    const byId = Object.fromEntries(out.map((o) => [o.session.id, o]));
    expect(byId.a.columns).toBe(2);
    expect(byId.c.columns).toBe(1);
  });
});

describe('filterAgenda', () => {
  const list: AgendaSessionLike[] = [
    { id: '1', starts_at: iso(2026, 11, 9, 9), ends_at: null, status: 'scheduled', course_id: 'c1', group_id: 'g1' },
    { id: '2', starts_at: iso(2026, 11, 9, 10), ends_at: null, status: 'cancelled', course_id: 'c1', group_id: 'g2' },
    { id: '3', starts_at: iso(2026, 11, 9, 11), ends_at: null, status: 'scheduled', course_id: 'c2', group_id: null },
  ];

  it('hides cancelled classes unless asked', () => {
    expect(filterAgenda(list, { courseId: 'all', groupId: 'all', showCancelled: false }).map((s) => s.id)).toEqual(['1', '3']);
    expect(filterAgenda(list, { courseId: 'all', groupId: 'all', showCancelled: true })).toHaveLength(3);
  });

  it('filters by course and by group', () => {
    expect(filterAgenda(list, { courseId: 'c2', groupId: 'all', showCancelled: true }).map((s) => s.id)).toEqual(['3']);
    expect(filterAgenda(list, { courseId: 'all', groupId: 'g2', showCancelled: true }).map((s) => s.id)).toEqual(['2']);
  });

  it('supports the "none" group selector for classes without group', () => {
    expect(filterAgenda(list, { courseId: 'all', groupId: 'none', showCancelled: true }).map((s) => s.id)).toEqual(['3']);
  });
});

describe('hourMarks / nowLinePosition', () => {
  it('lists one mark per hour of the grid', () => {
    const marks = hourMarks();
    expect(marks[0]).toEqual({ hour: AGENDA_START_HOUR, label: '7 a. m.' });
    expect(marks.at(-1)?.hour).toBe(AGENDA_END_HOUR - 1);
    expect(marks).toHaveLength(AGENDA_END_HOUR - AGENDA_START_HOUR);
    expect(marks.find((m) => m.hour === 12)?.label).toBe('12 p. m.');
    expect(marks.find((m) => m.hour === 18)?.label).toBe('6 p. m.');
  });

  it('places the now line proportionally and hides it outside the grid', () => {
    const span = AGENDA_END_HOUR - AGENDA_START_HOUR;
    expect(nowLinePosition(local(2026, 11, 9, 9, 30))).toBeCloseTo((2.5 / span) * 100);
    expect(nowLinePosition(local(2026, 11, 9, 6))).toBeNull();
    expect(nowLinePosition(local(2026, 11, 9, 22, 30))).toBeNull();
  });
});

describe('sessionHref', () => {
  it('opens the roll call of the class inside its group', () => {
    expect(sessionHref({ id: 's1', course_id: 'c1', group_id: 'g1' })).toBe('/admin/cursos/c1/grupos/g1?tab=calendario&clase=s1');
  });

  it('sends classes without group to the "sin grupo" tab of the course hub', () => {
    expect(sessionHref({ id: 's1', course_id: 'c1', group_id: null })).toBe('/admin/cursos/c1/grupos?tab=sin-grupo');
  });
});

describe('sessionsOfDay', () => {
  const at = (id: string, h: number, day = 9): AgendaSessionLike => ({
    id,
    starts_at: iso(2026, 11, day, h),
    ends_at: null,
    status: 'scheduled',
    course_id: 'c1',
    group_id: null,
  });

  it('keeps the classes that start on that local day, in time order', () => {
    const out = sessionsOfDay([at('late', 18), at('other', 9, 10), at('early', 8)], local(2026, 11, 9, 15));
    expect(out.map((s) => s.id)).toEqual(['early', 'late']);
  });
});

describe('formatClock', () => {
  it('writes 12-hour time with a. m. / p. m.', () => {
    expect(formatClock(local(2026, 11, 9, 0, 5))).toBe('12:05 a. m.');
    expect(formatClock(local(2026, 11, 9, 9, 30))).toBe('9:30 a. m.');
    expect(formatClock(local(2026, 11, 9, 12, 0))).toBe('12:00 p. m.');
    expect(formatClock(local(2026, 11, 9, 18, 0))).toBe('6:00 p. m.');
  });
});
