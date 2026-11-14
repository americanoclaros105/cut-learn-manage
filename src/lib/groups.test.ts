import { describe, expect, it } from 'vitest';
import {
  ACCESS_GRACE_DAYS,
  defaultAccessDates,
  expandSchedule,
  formatSchedule,
  groupErrorMessage,
  groupPhase,
  groupPhaseLabels,
  isGroupFull,
  seatsLeft,
  weekdayLabels,
  weekdayShortLabels,
} from './groups';

const mon = { weekday: 1, start_time: '18:00:00', end_time: '20:00:00' };
const wed = { weekday: 3, start_time: '18:00', end_time: '20:00' };
const sat = { weekday: 6, start_time: '09:00', end_time: '12:00' };

describe('expandSchedule', () => {
  it('lists every matching weekday between the dates, inclusive, in order', () => {
    // 2030-01-07 is a Monday.
    const out = expandSchedule('2030-01-07', '2030-01-20', [wed, mon]);
    expect(out).toEqual([
      { date: '2030-01-07', start: '18:00', end: '20:00' },
      { date: '2030-01-09', start: '18:00', end: '20:00' },
      { date: '2030-01-14', start: '18:00', end: '20:00' },
      { date: '2030-01-16', start: '18:00', end: '20:00' },
    ]);
  });

  it('supports several slots on the same day, sorted by start time', () => {
    const out = expandSchedule('2030-01-07', '2030-01-07', [
      { weekday: 1, start_time: '14:00', end_time: '16:00' },
      { weekday: 1, start_time: '08:00', end_time: '10:00' },
    ]);
    expect(out.map((o) => o.start)).toEqual(['08:00', '14:00']);
  });

  it('includes both boundary dates and handles Sunday as 0', () => {
    // 2030-01-06 is a Sunday.
    const out = expandSchedule('2030-01-06', '2030-01-06', [{ weekday: 0, start_time: '10:00', end_time: '11:00' }]);
    expect(out).toEqual([{ date: '2030-01-06', start: '10:00', end: '11:00' }]);
  });

  it('returns nothing for an empty schedule or an inverted range', () => {
    expect(expandSchedule('2030-01-07', '2030-01-20', [])).toEqual([]);
    expect(expandSchedule('2030-01-20', '2030-01-07', [mon])).toEqual([]);
  });

  it('is not affected by month/year boundaries or leap days', () => {
    // 2028-02-29 is a Tuesday (leap year).
    const out = expandSchedule('2028-02-27', '2028-03-02', [{ weekday: 2, start_time: '10:00', end_time: '11:00' }]);
    expect(out.map((o) => o.date)).toEqual(['2028-02-29']);
  });
});

describe('groupPhase', () => {
  const group = { start_date: '2030-02-01', end_date: '2030-03-01', archived_at: null };

  it('is upcoming before the start date', () => {
    expect(groupPhase(group, '2030-01-31')).toBe('upcoming');
  });

  it('is in progress from the start date through the end date, inclusive', () => {
    expect(groupPhase(group, '2030-02-01')).toBe('in_progress');
    expect(groupPhase(group, '2030-03-01')).toBe('in_progress');
  });

  it('is finished after the end date', () => {
    expect(groupPhase(group, '2030-03-02')).toBe('finished');
  });

  it('archived wins over any date', () => {
    expect(groupPhase({ ...group, archived_at: '2030-02-10T00:00:00Z' }, '2030-02-15')).toBe('archived');
  });

  it('accepts a Date and uses its local calendar day', () => {
    expect(groupPhase(group, new Date(2030, 1, 1, 23, 59))).toBe('in_progress');
    expect(groupPhase(group, new Date(2030, 0, 31, 23, 59))).toBe('upcoming');
  });
});

describe('formatSchedule', () => {
  it('summarises weekdays sharing the same hours', () => {
    expect(formatSchedule([wed, mon])).toBe('Lun y Mié · 6:00 p. m. – 8:00 p. m.');
  });

  it('separates different hours with semicolons, ordered by weekday starting Monday', () => {
    expect(formatSchedule([sat, mon, wed])).toBe(
      'Lun y Mié · 6:00 p. m. – 8:00 p. m.; Sáb · 9:00 a. m. – 12:00 p. m.',
    );
  });

  it('joins three or more weekdays with commas and "y"', () => {
    const fri = { weekday: 5, start_time: '18:00', end_time: '20:00' };
    expect(formatSchedule([mon, wed, fri])).toBe('Lun, Mié y Vie · 6:00 p. m. – 8:00 p. m.');
  });

  it('puts Sunday last and formats midnight/noon correctly', () => {
    const sun = { weekday: 0, start_time: '00:00', end_time: '12:30' };
    expect(formatSchedule([sun, mon])).toBe('Lun · 6:00 p. m. – 8:00 p. m.; Dom · 12:00 a. m. – 12:30 p. m.');
  });

  it('keeps two slots of the same weekday as separate segments', () => {
    const out = formatSchedule([
      { weekday: 1, start_time: '14:00', end_time: '16:00' },
      { weekday: 1, start_time: '09:00', end_time: '11:00' },
    ]);
    expect(out).toBe('Lun · 9:00 a. m. – 11:00 a. m.; Lun · 2:00 p. m. – 4:00 p. m.');
  });

  it('says so when there is no schedule', () => {
    expect(formatSchedule([])).toBe('Sin horario');
  });
});

describe('seats', () => {
  it('seatsLeft is null without capacity and never negative', () => {
    expect(seatsLeft(null, 10)).toBeNull();
    expect(seatsLeft(12, 5)).toBe(7);
    expect(seatsLeft(12, 15)).toBe(0);
  });

  it('isGroupFull only when a capacity exists and is reached', () => {
    expect(isGroupFull(null, 100)).toBe(false);
    expect(isGroupFull(2, 1)).toBe(false);
    expect(isGroupFull(2, 2)).toBe(true);
  });
});

describe('labels', () => {
  it('has Spanish labels for phases and weekdays', () => {
    expect(groupPhaseLabels.upcoming).toBe('Próximo');
    expect(groupPhaseLabels.in_progress).toBe('En curso');
    expect(groupPhaseLabels.finished).toBe('Finalizado');
    expect(groupPhaseLabels.archived).toBe('Archivado');
    expect(weekdayLabels[0]).toBe('Domingo');
    expect(weekdayLabels[3]).toBe('Miércoles');
    expect(weekdayShortLabels[6]).toBe('Sáb');
  });
});

describe('defaultAccessDates', () => {
  it('suggests the group start and the end date plus the grace period', () => {
    expect(ACCESS_GRACE_DAYS).toBe(30);
    expect(defaultAccessDates({ start_date: '2030-02-01', end_date: '2030-03-01' })).toEqual({
      enabledFrom: '2030-02-01',
      expiresAt: '2030-03-31',
    });
  });

  it('rolls over months and years', () => {
    expect(defaultAccessDates({ start_date: '2030-11-01', end_date: '2030-12-15' }).expiresAt).toBe('2031-01-14');
  });
});

describe('groupErrorMessage', () => {
  it('maps the full-group database error to a friendly message', () => {
    expect(groupErrorMessage({ message: 'El grupo está lleno', code: 'P0001' })).toBe(
      'El grupo está lleno: no quedan cupos disponibles.',
    );
  });

  it('maps duplicate group names and overlapping slots', () => {
    expect(
      groupErrorMessage({ message: 'duplicate key value violates unique constraint "course_groups_course_name_key"' }),
    ).toBe('Ya existe un grupo con ese nombre en este curso.');
    expect(groupErrorMessage({ message: 'Los horarios del mismo día no pueden superponerse' })).toBe(
      'Los horarios del mismo día no pueden superponerse.',
    );
  });

  it('falls back to the original message, then to a generic one', () => {
    expect(groupErrorMessage(new Error('boom'))).toBe('boom');
    expect(groupErrorMessage(null)).toBe('No se pudo completar la operación.');
  });
});
