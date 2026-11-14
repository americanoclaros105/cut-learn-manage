import { useMemo } from 'react';
import { useCourseGroups } from '@/hooks/useCourseGroups';
import { groupPickerOptions, NO_GROUP } from '@/lib/groupPicker';
import { localDay } from '@/lib/groupViews';
import type { CourseGroupWithStats } from '@/types';
import { GroupPicker } from './GroupPicker';

interface CourseGroupPickerProps {
  idPrefix: string;
  courseId: string;
  coursePrice: number;
  /** Selected group id, or '' / NO_GROUP for none. */
  value: string;
  disabled?: boolean;
  /** Receives the chosen group (null = Sin grupo) so the form can prefill price and dates. */
  onChange: (group: CourseGroupWithStats | null) => void;
}

/** Loads the groups of a course and lets the admin pick one while enrolling a student. */
export const CourseGroupPicker = ({ idPrefix, courseId, coursePrice, value, disabled, onChange }: CourseGroupPickerProps) => {
  const groups = useCourseGroups(courseId);
  const options = useMemo(
    () => groupPickerOptions(groups.data ?? [], coursePrice, localDay(new Date())),
    [groups.data, coursePrice],
  );

  if (groups.isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        No se pudieron cargar los grupos del curso. Puedes inscribir sin grupo y asignarlo después.
      </p>
    );
  }

  return (
    <GroupPicker
      idPrefix={idPrefix}
      options={options}
      value={value || NO_GROUP}
      loading={groups.isLoading}
      disabled={disabled}
      onChange={(next) => onChange(next === NO_GROUP ? null : (groups.data ?? []).find((g) => g.id === next) ?? null)}
    />
  );
};
