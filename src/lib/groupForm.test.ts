import { describe, expect, it } from 'vitest';
import {
  GROUP_COLORS,
  emptyScheduleRow,
  formatDayLabel,
  monthGrid,
  monthsBetween,
  nextGroupColor,
  nextGroupName,
  rowsToSlots,
  schedulePreview,
  slotsToRows,
  validateGroupForm,
  validateScheduleRows,
  type ScheduleRow,
} from './groupForm';

const row = (id: string, weekdays: number[], start: string, end: string): ScheduleRow => ({ id, weekdays, start, end });

describe('nextGroupName', () => {
  it('suggests Grupo A when the course has no groups', () => {
    expect(nextGroupName([])).toBe('Grupo A');
  });

  it('suggests the next unused letter, ignoring case and spaces', () => {
    expect(nextGroupName(['Grupo A', ' grupo b '])).toBe('Grupo C');
  });

  it('fills the first gap and ignores unrelated names', () => {
    expect(nextGroupName(['Grupo A', 'Grupo C', 'Intensivo'])).toBe('Grupo B');
  });

  it('falls back to a number once the alphabet is exhausted', () => {
    const all = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => `Grupo ${l}`);
    expect(nextGroupName(all)).toBe('Grupo 27');
  });
});

describe('nextGroupColor', () => {
  it('returns the first palette color when nothing is used', () => {
    expect(nextGroupColor([])).toBe(GROUP_COLORS[0]);
  });

  it('skips used colors (null and case ignored)', () => {
    expect(nextGroupColor([GROUP_COLORS[0].toUpperCase(), null])).toBe(GROUP_COLORS[1]);
  });

  it('cycles when every color is taken', () => {
    expect(nextGroupColor(GROUP_COLORS)).toBe(GROUP_COLORS[0]);
  });
});

describe('validateScheduleRows', () => {
  it('accepts a clean schedule', () => {
    expect(validateScheduleRows([row('a', [1, 3], '18:00', '20:00'), row('b', [6], '09:00', '12:00')])).toEqual([]);
  });

  it('requires at least one weekday per row', () => {
    const issues = validateScheduleRows([row('a', [], '18:00', '20:00')]);
    expect(issues).toEqual([{ rowId: 'a', message: 'Elige al menos un día.' }]);
  });

  it('requires an end time after the start time', () => {
    const equal = validateScheduleRows([row('a', [1], '18:00', '18:00')]);
    const before = validateScheduleRows([row('b', [1], '18:00', '17:00')]);
    expect(equal[0].message).toBe('La hora de fin debe ser posterior a la de inicio.');
    expect(before[0].rowId).toBe('b');
  });

  it('requires both times', () => {
    expect(validateScheduleRows([row('a', [1], '', '20:00')])[0].message).toBe('Indica la hora de inicio y de fin.');
  });

  it('flags overlapping ranges on the same weekday, naming the day', () => {
    const issues = validateScheduleRows([row('a', [1, 3], '18:00', '20:00'), row('b', [3], '19:00', '21:00')]);
    expect(issues).toEqual([{ rowId: 'b', message: 'Se superpone con otro horario del Miércoles.' }]);
  });

  it('allows back to back ranges and the same hours on different days', () => {
    expect(validateScheduleRows([row('a', [1], '08:00', '10:00'), row('b', [1], '10:00', '12:00')])).toEqual([]);
    expect(validateScheduleRows([row('a', [1], '08:00', '10:00'), row('b', [2], '08:00', '10:00')])).toEqual([]);
  });

  it('does not report an overlap for a row that is already invalid', () => {
    const issues = validateScheduleRows([row('a', [1], '18:00', '20:00'), row('b', [1], '20:00', '19:00')]);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toBe('La hora de fin debe ser posterior a la de inicio.');
  });
});

describe('rowsToSlots / slotsToRows', () => {
  it('expands a row into one slot per weekday, Monday first', () => {
    expect(rowsToSlots([row('a', [3, 1, 0], '18:00', '20:00')])).toEqual([
      { weekday: 1, start_time: '18:00', end_time: '20:00' },
      { weekday: 3, start_time: '18:00', end_time: '20:00' },
      { weekday: 0, start_time: '18:00', end_time: '20:00' },
    ]);
  });

  it('removes duplicated weekdays inside a row', () => {
    expect(rowsToSlots([row('a', [1, 1], '18:00', '20:00')])).toHaveLength(1);
  });

  it('groups stored slots with the same hours back into one row', () => {
    let n = 0;
    const rows = slotsToRows(
      [
        { weekday: 1, start_time: '18:00:00', end_time: '20:00:00' },
        { weekday: 6, start_time: '09:00:00', end_time: '12:00:00' },
        { weekday: 3, start_time: '18:00:00', end_time: '20:00:00' },
      ],
      () => `r${++n}`,
    );
    expect(rows).toEqual([
      { id: 'r1', weekdays: [1, 3], start: '18:00', end: '20:00' },
      { id: 'r2', weekdays: [6], start: '09:00', end: '12:00' },
    ]);
  });

  it('creates a blank row with sensible defaults', () => {
    expect(emptyScheduleRow('x')).toEqual({ id: 'x', weekdays: [], start: '18:00', end: '20:00' });
  });
});

describe('formatDayLabel', () => {
  it('formats a calendar day in Spanish without timezone shifts', () => {
    expect(formatDayLabel('2030-01-07')).toBe('7 ene 2030');
    expect(formatDayLabel('2030-12-31')).toBe('31 dic 2030');
  });
});

describe('schedulePreview', () => {
  const slots = [
    { weekday: 1, start_time: '18:00', end_time: '20:00' },
    { weekday: 3, start_time: '18:00', end_time: '20:00' },
  ];

  it('counts classes and names the first and last day', () => {
    // Mon 2030-01-07 .. Sun 2030-01-20: Mon 7, Wed 9, Mon 14, Wed 16.
    const preview = schedulePreview('2030-01-07', '2030-01-20', slots);
    expect(preview.count).toBe(4);
    expect(preview.dates.has('2030-01-16')).toBe(true);
    expect(preview.text).toBe('Este horario genera 4 clases entre el 7 ene 2030 y el 16 ene 2030.');
  });

  it('uses the singular for one class', () => {
    expect(schedulePreview('2030-01-07', '2030-01-08', slots).text).toBe('Este horario genera 1 clase el 7 ene 2030.');
  });

  it('asks for a schedule when there is none', () => {
    expect(schedulePreview('2030-01-07', '2030-01-20', []).text).toBe('Agrega un horario para ver las clases que se generarán.');
  });

  it('asks for valid dates when they are missing or reversed', () => {
    expect(schedulePreview('', '2030-01-20', slots).text).toBe('Elige las fechas de inicio y fin para ver las clases.');
    expect(schedulePreview('2030-01-20', '2030-01-07', slots).count).toBe(0);
  });

  it('says so when no class falls inside the range', () => {
    expect(schedulePreview('2030-01-08', '2030-01-08', slots).text).toBe(
      'Este horario no genera clases entre esas fechas.',
    );
  });
});

describe('monthGrid', () => {
  it('builds Monday-first weeks padded with nulls and flags class days', () => {
    // January 2030 starts on Tuesday and has 31 days.
    const weeks = monthGrid(2030, 0, new Set(['2030-01-07', '2030-01-31']));
    expect(weeks[0]).toEqual([null, expect.objectContaining({ day: 1, iso: '2030-01-01', isClass: false }), expect.anything(), expect.anything(), expect.anything(), expect.anything(), expect.anything()]);
    const flat = weeks.flat().filter((c) => c !== null);
    expect(flat).toHaveLength(31);
    expect(flat.filter((c) => c!.isClass).map((c) => c!.iso)).toEqual(['2030-01-07', '2030-01-31']);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks).toHaveLength(5);
  });

  it('starts on the first column when the month begins on Monday', () => {
    // April 2030 starts on a Monday.
    expect(monthGrid(2030, 3, new Set())[0][0]).toEqual({ day: 1, iso: '2030-04-01', isClass: false });
  });
});

describe('validateGroupForm', () => {
  const valid = {
    name: 'Grupo A',
    start_date: '2030-01-07',
    end_date: '2030-03-07',
    capacity: '15',
    price: '1.200.000',
  };

  it('accepts valid values', () => {
    expect(validateGroupForm(valid)).toEqual({});
  });

  it('requires a name', () => {
    expect(validateGroupForm({ ...valid, name: '  ' }).name).toBe('Escribe el nombre del grupo.');
  });

  it('requires both dates and an end that is not before the start', () => {
    expect(validateGroupForm({ ...valid, start_date: '' }).start_date).toBe('Elige la fecha de inicio.');
    expect(validateGroupForm({ ...valid, end_date: '' }).end_date).toBe('Elige la fecha de fin.');
    expect(validateGroupForm({ ...valid, end_date: '2030-01-01' }).end_date).toBe(
      'La fecha de fin no puede ser anterior a la de inicio.',
    );
  });

  it('accepts a one-day group', () => {
    expect(validateGroupForm({ ...valid, end_date: valid.start_date })).toEqual({});
  });

  it('rejects zero or fractional capacity but allows it to be blank', () => {
    expect(validateGroupForm({ ...valid, capacity: '' })).toEqual({});
    expect(validateGroupForm({ ...valid, capacity: '0' }).capacity).toBe('El cupo debe ser un número entero mayor que 0.');
    expect(validateGroupForm({ ...valid, capacity: '2.5' }).capacity).toBe('El cupo debe ser un número entero mayor que 0.');
  });
});

describe('monthsBetween', () => {
  it('lists every month touched by the range, inclusive', () => {
    expect(monthsBetween('2030-01-20', '2030-03-05')).toEqual([
      { year: 2030, month: 0 },
      { year: 2030, month: 1 },
      { year: 2030, month: 2 },
    ]);
  });

  it('crosses years and handles a single month', () => {
    expect(monthsBetween('2030-11-10', '2031-01-02')).toEqual([
      { year: 2030, month: 10 },
      { year: 2030, month: 11 },
      { year: 2031, month: 0 },
    ]);
    expect(monthsBetween('2030-05-01', '2030-05-31')).toEqual([{ year: 2030, month: 4 }]);
  });

  it('returns nothing for missing or reversed dates and caps very long ranges', () => {
    expect(monthsBetween('', '2030-05-31')).toEqual([]);
    expect(monthsBetween('2030-06-01', '2030-05-31')).toEqual([]);
    expect(monthsBetween('2030-01-01', '2040-01-01', 12)).toHaveLength(12);
  });
});
