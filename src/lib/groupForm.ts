import { expandSchedule, weekdayLabels } from '@/lib/groups';
import type { GroupScheduleSlot } from '@/types';

/**
 * Pure helpers behind the group form: name/color suggestions, the schedule
 * builder (rows of weekday chips + hours), validation and the live preview.
 * No Supabase or React imports.
 */

/** Palette offered in the form (hex, so it can be stored as is in `course_groups.color`). */
export const GROUP_COLORS = [
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#0ea5e9',
  '#8b5cf6',
  '#ef4444',
  '#14b8a6',
] as const;

const normalize = (text: string): string => text.trim().toLowerCase();

/** "Grupo A", "Grupo B"... the first letter not used yet; numeric once the alphabet runs out. */
export const nextGroupName = (existingNames: string[]): string => {
  const used = new Set(existingNames.map(normalize));
  for (let code = 65; code <= 90; code += 1) {
    const candidate = `Grupo ${String.fromCharCode(code)}`;
    if (!used.has(normalize(candidate))) return candidate;
  }
  return `Grupo ${existingNames.length + 1}`;
};

/** First palette color not used by another group; cycles when all are taken. */
export const nextGroupColor = (usedColors: ReadonlyArray<string | null | undefined>): string => {
  const used = new Set(usedColors.filter((c): c is string => !!c).map(normalize));
  return GROUP_COLORS.find((c) => !used.has(c)) ?? GROUP_COLORS[usedColors.length % GROUP_COLORS.length];
};

// ---------------------------------------------------------------------------
// Schedule builder
// ---------------------------------------------------------------------------

/** One builder row: several weekdays sharing the same hours. */
export interface ScheduleRow {
  id: string;
  /** 0 = Sunday ... 6 = Saturday. */
  weekdays: number[];
  /** 'HH:MM' */
  start: string;
  end: string;
}

export interface ScheduleIssue {
  rowId: string;
  message: string;
}

export const emptyScheduleRow = (id: string): ScheduleRow => ({ id, weekdays: [], start: '18:00', end: '20:00' });

const weekOrder = (weekday: number): number => (weekday + 6) % 7;
const hhmm = (time: string): string => time.slice(0, 5);

/** One issue per invalid row: missing day/hours, end not after start, or overlap with an earlier row. */
export const validateScheduleRows = (rows: ScheduleRow[]): ScheduleIssue[] => {
  const issues: ScheduleIssue[] = [];
  const valid: ScheduleRow[] = [];

  for (const row of rows) {
    if (row.weekdays.length === 0) {
      issues.push({ rowId: row.id, message: 'Elige al menos un día.' });
    } else if (!row.start || !row.end) {
      issues.push({ rowId: row.id, message: 'Indica la hora de inicio y de fin.' });
    } else if (row.end <= row.start) {
      issues.push({ rowId: row.id, message: 'La hora de fin debe ser posterior a la de inicio.' });
    } else {
      const clash = valid
        .flatMap((other) =>
          row.start < other.end && other.start < row.end ? row.weekdays.filter((d) => other.weekdays.includes(d)) : [],
        )
        .sort((a, b) => weekOrder(a) - weekOrder(b))[0];
      if (clash !== undefined) {
        issues.push({ rowId: row.id, message: `Se superpone con otro horario del ${weekdayLabels[clash]}.` });
      } else {
        valid.push(row);
      }
    }
  }
  return issues;
};

/** Flattens builder rows into the one-slot-per-weekday shape stored in the database (Monday first). */
export const rowsToSlots = (rows: ScheduleRow[]): GroupScheduleSlot[] => {
  const slots: GroupScheduleSlot[] = [];
  for (const row of rows) {
    for (const weekday of new Set(row.weekdays)) {
      slots.push({ weekday, start_time: hhmm(row.start), end_time: hhmm(row.end) });
    }
  }
  return slots.sort(
    (a, b) => weekOrder(a.weekday) - weekOrder(b.weekday) || a.start_time.localeCompare(b.start_time),
  );
};

/** Groups stored slots that share the same hours back into builder rows. */
export const slotsToRows = (slots: GroupScheduleSlot[], newId: () => string): ScheduleRow[] => {
  const buckets = new Map<string, ScheduleRow>();
  const ordered = [...slots].sort(
    (a, b) => weekOrder(a.weekday) - weekOrder(b.weekday) || a.start_time.localeCompare(b.start_time),
  );
  for (const slot of ordered) {
    const start = hhmm(slot.start_time);
    const end = hhmm(slot.end_time);
    const key = `${start}-${end}`;
    const row = buckets.get(key) ?? { id: newId(), weekdays: [], start, end };
    row.weekdays.push(slot.weekday);
    buckets.set(key, row);
  }
  return [...buckets.values()];
};

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

const monthShort = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;

/** '2030-01-07' -> '7 ene 2030' (string based: no timezone shifts). */
export const formatDayLabel = (iso: string): string => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${monthShort[m - 1]} ${y}`;
};

export interface SchedulePreview {
  count: number;
  /** Every class day, 'YYYY-MM-DD'. */
  dates: Set<string>;
  text: string;
}

export const schedulePreview = (startDate: string, endDate: string, slots: GroupScheduleSlot[]): SchedulePreview => {
  const empty = (text: string): SchedulePreview => ({ count: 0, dates: new Set(), text });
  if (slots.length === 0) return empty('Agrega un horario para ver las clases que se generarán.');
  if (!startDate || !endDate) return empty('Elige las fechas de inicio y fin para ver las clases.');
  if (endDate < startDate) return empty('La fecha de fin es anterior a la de inicio.');

  const occurrences = expandSchedule(startDate, endDate, slots);
  const count = occurrences.length;
  const dates = new Set(occurrences.map((o) => o.date));
  if (count === 0) return { count, dates, text: 'Este horario no genera clases entre esas fechas.' };

  const first = formatDayLabel(occurrences[0].date);
  const last = formatDayLabel(occurrences[count - 1].date);
  const text =
    count === 1
      ? `Este horario genera 1 clase el ${first}.`
      : `Este horario genera ${count} clases entre el ${first} y el ${last}.`;
  return { count, dates, text };
};

/** Every (year, 0-based month) touched by the range, capped so a typo like year 2300 cannot render forever. */
export const monthsBetween = (startDate: string, endDate: string, max = 24): Array<{ year: number; month: number }> => {
  if (!startDate || !endDate || endDate < startDate) return [];
  const [sy, sm] = startDate.split('-').map(Number);
  const [ey, em] = endDate.split('-').map(Number);
  const out: Array<{ year: number; month: number }> = [];
  for (let index = sy * 12 + (sm - 1); index <= ey * 12 + (em - 1) && out.length < max; index += 1) {
    out.push({ year: Math.floor(index / 12), month: index % 12 });
  }
  return out;
};

export interface MonthCell {
  day: number;
  iso: string;
  isClass: boolean;
}

/** Monday-first weeks of a month (month is 0-based); null pads the days outside the month. */
export const monthGrid = (year: number, month: number, classDays: Set<string>): Array<Array<MonthCell | null>> => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const offset = weekOrder(new Date(Date.UTC(year, month, 1)).getUTCDay());

  const cells: Array<MonthCell | null> = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
    cells.push({ day, iso, isClass: classDays.has(iso) });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: Array<Array<MonthCell | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
};

// ---------------------------------------------------------------------------
// Form validation
// ---------------------------------------------------------------------------

export interface GroupFormCore {
  name: string;
  start_date: string;
  end_date: string;
  /** Raw text of the capacity input. */
  capacity: string;
}

export type GroupFormErrors = Partial<Record<'name' | 'start_date' | 'end_date' | 'capacity', string>>;

export const validateGroupForm = (values: GroupFormCore): GroupFormErrors => {
  const errors: GroupFormErrors = {};
  if (!values.name.trim()) errors.name = 'Escribe el nombre del grupo.';
  if (!values.start_date) errors.start_date = 'Elige la fecha de inicio.';
  if (!values.end_date) errors.end_date = 'Elige la fecha de fin.';
  else if (values.start_date && values.end_date < values.start_date) {
    errors.end_date = 'La fecha de fin no puede ser anterior a la de inicio.';
  }
  const capacity = values.capacity.trim();
  if (capacity && (!/^\d+$/.test(capacity) || Number(capacity) < 1)) {
    errors.capacity = 'El cupo debe ser un número entero mayor que 0.';
  }
  return errors;
};
