import { describe, expect, it } from 'vitest';
import { classWhen, studentGroupView } from './studentGroups';

const now = new Date('2026-11-13T12:00:00Z');
const s = (id: string, starts_at: string, status: 'scheduled' | 'cancelled' = 'scheduled') => ({ id, starts_at, status });

describe('studentGroupView', () => {
  it('lists the next three classes, cancelled ones included', () => {
    const view = studentGroupView(
      [
        s('past', '2026-11-10T18:00:00Z'),
        s('a', '2026-11-14T18:00:00Z'),
        s('b', '2026-11-17T18:00:00Z', 'cancelled'),
        s('c', '2026-11-20T18:00:00Z'),
        s('d', '2026-11-27T18:00:00Z'),
      ],
      {},
      now,
    );
    expect(view.upcoming.map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('is empty (no crash) when sessions are hidden by RLS', () => {
    const view = studentGroupView([], {}, now);
    expect(view.upcoming).toEqual([]);
    expect(view.attendanceText).toBeNull();
  });

  it('summarizes own attendance over the group sessions only', () => {
    const view = studentGroupView(
      [
        s('1', '2026-11-01T18:00:00Z'),
        s('2', '2026-11-03T18:00:00Z'),
        s('3', '2026-11-05T18:00:00Z'),
        s('4', '2026-11-07T18:00:00Z'),
        s('5', '2026-11-09T18:00:00Z'),
      ],
      { '1': 'present', '2': 'late', '3': 'absent', '4': 'excused', other: 'absent' },
      now,
    );
    expect(view.attendance).toMatchObject({ present: 1, late: 1, absent: 1, excused: 1, total: 4 });
    expect(view.attendanceText).toBe('Asistencia 67% (2 de 3 clases)');
  });

  it('ignores attendance recorded on cancelled classes', () => {
    const view = studentGroupView([s('1', '2026-11-01T18:00:00Z', 'cancelled')], { '1': 'absent' }, now);
    expect(view.attendanceText).toBeNull();
  });
});

describe('classWhen', () => {
  it('formats the weekday, day, month and 12-hour time in Spanish', () => {
    expect(classWhen({ starts_at: new Date(2026, 10, 18, 18, 0).toISOString() })).toBe('mié 18 nov, 6:00 p. m.');
  });
});
