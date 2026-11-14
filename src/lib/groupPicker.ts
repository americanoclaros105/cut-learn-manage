import { defaultAccessDates, groupPhase, isGroupFull, formatSchedule } from '@/lib/groups';
import { sortGroups } from '@/lib/groupViews';
import type { CourseGroupWithStats, GroupPhase } from '@/types';

/**
 * Pure logic of the group picker used in the enrollment flows.
 * No Supabase or React imports.
 */

/** Value of the picker for "Sin grupo por ahora". */
export const NO_GROUP = 'none';

export interface GroupPickerOption {
  id: string;
  name: string;
  color: string | null;
  phase: GroupPhase;
  /** 'dd/MM/yyyy → dd/MM/yyyy' */
  dates: string;
  schedule: string;
  seatsLabel: string;
  full: boolean;
  /** Full groups cannot be chosen, unless it is the group the enrollment is already in. */
  disabled: boolean;
  /** Default agreed price: the group price, or the course price. */
  price: number;
  priceSource: 'group' | 'course';
}

const dmy = (day: string): string => {
  const [y, m, d] = day.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

const seatsLabel = (group: CourseGroupWithStats): string => {
  if (group.capacity === null) return 'Sin límite de cupos';
  if (isGroupFull(group.capacity, group.enrolled)) return 'Lleno';
  const left = group.seats_left ?? Math.max(0, group.capacity - group.enrolled);
  return `${left} ${left === 1 ? 'cupo libre' : 'cupos libres'}`;
};

/** Selectable groups of a course (archived hidden), in progress first and then by start date. */
export const groupPickerOptions = (
  groups: CourseGroupWithStats[],
  coursePrice: number,
  today: string | Date,
  currentGroupId: string | null = null,
): GroupPickerOption[] =>
  sortGroups(
    groups.filter((g) => !g.archived_at),
    today,
  ).map((g) => {
    const full = isGroupFull(g.capacity, g.enrolled);
    return {
      id: g.id,
      name: g.name,
      color: g.color,
      phase: groupPhase(g, today),
      dates: `${dmy(g.start_date)} → ${dmy(g.end_date)}`,
      schedule: formatSchedule(g.schedules),
      seatsLabel: seatsLabel(g),
      full,
      disabled: full && g.id !== currentGroupId,
      price: g.price ?? coursePrice,
      priceSource: g.price === null ? 'course' : 'group',
    };
  });

export interface EnrollmentDefaults {
  agreedPrice: number;
  /** 'YYYY-MM-DD', null when there is no group to derive it from. */
  enabledFrom: string | null;
  expiresAt: string | null;
}

/** What picking a group prefills in the enrollment form (all still editable). */
export const enrollmentDefaults = (group: CourseGroupWithStats | null, coursePrice: number): EnrollmentDefaults => {
  if (!group) return { agreedPrice: coursePrice, enabledFrom: null, expiresAt: null };
  const { enabledFrom, expiresAt } = defaultAccessDates(group);
  return { agreedPrice: group.price ?? coursePrice, enabledFrom, expiresAt };
};
