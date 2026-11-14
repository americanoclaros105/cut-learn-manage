import type { CourseGroup, GroupPhase, GroupScheduleSlot } from '@/types';

/**
 * Pure domain logic for course groups (cohorts). No Supabase or React imports.
 * Dates are plain 'YYYY-MM-DD' calendar days, handled timezone-agnostically
 * (all arithmetic happens in UTC on the date parts, never on local time).
 */

export const ACCESS_GRACE_DAYS = 30;

export const groupPhaseLabels: Record<GroupPhase, string> = {
  upcoming: 'Próximo',
  in_progress: 'En curso',
  finished: 'Finalizado',
  archived: 'Archivado',
};

/** Index = weekday, 0 = Sunday (same as Date.getDay and the database). */
export const weekdayLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
export const weekdayShortLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

/** Display order of the week: Monday first, Sunday last. */
const weekOrder = (weekday: number): number => (weekday + 6) % 7;

const DAY_MS = 24 * 60 * 60 * 1000;

const parseDay = (iso: string): number => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

const formatDay = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

const hhmm = (time: string): string => time.slice(0, 5);

export interface ScheduledOccurrence {
  /** 'YYYY-MM-DD' */
  date: string;
  /** 'HH:MM' */
  start: string;
  end: string;
}

/** Every class date between the two days (inclusive) that matches a weekly slot. */
export const expandSchedule = (
  startDate: string,
  endDate: string,
  schedules: GroupScheduleSlot[],
): ScheduledOccurrence[] => {
  const from = parseDay(startDate);
  const to = parseDay(endDate);
  if (schedules.length === 0 || to < from) return [];

  const slots = [...schedules].sort((a, b) => hhmm(a.start_time).localeCompare(hhmm(b.start_time)));
  const out: ScheduledOccurrence[] = [];
  for (let day = from; day <= to; day += DAY_MS) {
    const weekday = new Date(day).getUTCDay();
    for (const slot of slots) {
      if (slot.weekday === weekday) {
        out.push({ date: formatDay(day), start: hhmm(slot.start_time), end: hhmm(slot.end_time) });
      }
    }
  }
  return out;
};

const toDayString = (today: string | Date): string => {
  if (typeof today === 'string') return today.slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
};

export const groupPhase = (
  group: Pick<CourseGroup, 'start_date' | 'end_date' | 'archived_at'>,
  today: string | Date,
): GroupPhase => {
  if (group.archived_at) return 'archived';
  const day = toDayString(today);
  if (day < group.start_date.slice(0, 10)) return 'upcoming';
  if (day > group.end_date.slice(0, 10)) return 'finished';
  return 'in_progress';
};

const formatTime = (time: string): string => {
  const [h, m] = hhmm(time).split(':').map(Number);
  const suffix = h >= 12 ? 'p. m.' : 'a. m.';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
};

const joinDays = (labels: string[]): string =>
  labels.length <= 1 ? labels.join('') : `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`;

/** e.g. "Lun y Mié · 6:00 p. m. – 8:00 p. m.; Sáb · 9:00 a. m. – 12:00 p. m." */
export const formatSchedule = (schedules: GroupScheduleSlot[]): string => {
  if (schedules.length === 0) return 'Sin horario';

  const buckets = new Map<string, { start: string; end: string; weekdays: number[] }>();
  for (const slot of schedules) {
    const key = `${hhmm(slot.start_time)}-${hhmm(slot.end_time)}`;
    const bucket = buckets.get(key) ?? { start: slot.start_time, end: slot.end_time, weekdays: [] };
    bucket.weekdays.push(slot.weekday);
    buckets.set(key, bucket);
  }

  const segments: { first: number; start: string; end: string; weekdays: number[] }[] = [];
  for (const bucket of buckets.values()) {
    const days = [...new Set(bucket.weekdays)].sort((a, b) => weekOrder(a) - weekOrder(b));
    segments.push({ first: weekOrder(days[0]), start: bucket.start, end: bucket.end, weekdays: days });
  }

  // Slots with different hours on the same weekday land in different buckets;
  // order segments by first weekday, then start time.
  segments.sort((a, b) => a.first - b.first || hhmm(a.start).localeCompare(hhmm(b.start)));

  return segments
    .map((s) => `${joinDays(s.weekdays.map((d) => weekdayShortLabels[d]))} · ${formatTime(s.start)} – ${formatTime(s.end)}`)
    .join('; ');
};

/** Seats left, or null when the group has no capacity limit. Never negative. */
export const seatsLeft = (capacity: number | null, enrolled: number): number | null =>
  capacity === null ? null : Math.max(0, capacity - enrolled);

export const isGroupFull = (capacity: number | null, enrolled: number): boolean =>
  capacity !== null && enrolled >= capacity;

/** Suggested enrollment access window: from the group start to its end plus a grace period. */
export const defaultAccessDates = (
  group: Pick<CourseGroup, 'start_date' | 'end_date'>,
): { enabledFrom: string; expiresAt: string } => ({
  enabledFrom: group.start_date.slice(0, 10),
  expiresAt: formatDay(parseDay(group.end_date) + ACCESS_GRACE_DAYS * DAY_MS),
});

/** Friendly Spanish message for the errors the group tables, triggers and RPCs can raise. */
export const groupErrorMessage = (error: unknown): string => {
  const raw =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : '';
  if (raw.includes('El grupo está lleno')) return 'El grupo está lleno: no quedan cupos disponibles.';
  if (raw.includes('course_groups_course_name_key')) return 'Ya existe un grupo con ese nombre en este curso.';
  if (raw.includes('superponerse')) return 'Los horarios del mismo día no pueden superponerse.';
  if (raw.includes('no pertenece al curso')) return 'El grupo no pertenece al curso de la inscripción.';
  return raw || 'No se pudo completar la operación.';
};
