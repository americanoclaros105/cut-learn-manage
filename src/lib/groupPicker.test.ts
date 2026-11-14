import { describe, expect, it } from 'vitest';
import type { CourseGroupWithStats } from '@/types';
import { enrollmentDefaults, groupPickerOptions, NO_GROUP } from './groupPicker';

const group = (over: Partial<CourseGroupWithStats> & { id: string }): CourseGroupWithStats => ({
  course_id: 'c1',
  name: over.id,
  start_date: '2026-12-01',
  end_date: '2027-02-01',
  location: null,
  instructor: null,
  capacity: null,
  price: null,
  color: '#ff0000',
  notes: null,
  archived_at: null,
  created_at: '',
  updated_at: '',
  schedules: [],
  enrolled: 0,
  seats_left: null,
  ...over,
});

const today = '2026-11-13';

describe('groupPickerOptions', () => {
  it('skips archived groups and sorts in-progress, then upcoming by date', () => {
    const options = groupPickerOptions(
      [
        group({ id: 'later', start_date: '2027-03-01', end_date: '2027-06-01' }),
        group({ id: 'old', archived_at: '2026-01-01T00:00:00Z' }),
        group({ id: 'now', start_date: '2026-10-01', end_date: '2026-12-31' }),
        group({ id: 'soon' }),
      ],
      500_000,
      today,
    );
    expect(options.map((o) => o.id)).toEqual(['now', 'soon', 'later']);
  });

  it('uses the group price and falls back to the course price', () => {
    const [a, b] = groupPickerOptions(
      [group({ id: 'a', price: 300_000 }), group({ id: 'b', start_date: '2027-01-01' })],
      500_000,
      today,
    );
    expect(a.price).toBe(300_000);
    expect(a.priceSource).toBe('group');
    expect(b.price).toBe(500_000);
    expect(b.priceSource).toBe('course');
  });

  it('disables full groups and reports seats', () => {
    const [open, full] = groupPickerOptions(
      [
        group({ id: 'open', capacity: 10, enrolled: 7, seats_left: 3 }),
        group({ id: 'full', capacity: 5, enrolled: 5, seats_left: 0, start_date: '2027-01-01' }),
      ],
      0,
      today,
    );
    expect(open.disabled).toBe(false);
    expect(open.seatsLabel).toBe('3 cupos libres');
    expect(full.disabled).toBe(true);
    expect(full.seatsLabel).toBe('Lleno');
  });

  it('keeps the current group selectable even when it is full', () => {
    const [current] = groupPickerOptions([group({ id: 'g', capacity: 5, enrolled: 5, seats_left: 0 })], 0, today, 'g');
    expect(current.disabled).toBe(false);
  });

  it('reports no limit, phase, dates and schedule text', () => {
    const [o] = groupPickerOptions(
      [group({ id: 'g', schedules: [{ id: 's', group_id: 'g', weekday: 1, start_time: '18:00', end_time: '20:00' }] })],
      0,
      today,
    );
    expect(o.seatsLabel).toBe('Sin límite de cupos');
    expect(o.phase).toBe('upcoming');
    expect(o.schedule).toBe('Lun · 6:00 p. m. – 8:00 p. m.');
    expect(o.dates).toBe('01/12/2026 → 01/02/2027');
  });

  it('exposes the "no group" sentinel', () => {
    expect(NO_GROUP).toBe('none');
  });
});

describe('enrollmentDefaults', () => {
  it('prefills price and access window from the group', () => {
    expect(enrollmentDefaults(group({ id: 'g', price: 250_000 }), 400_000)).toEqual({
      agreedPrice: 250_000,
      enabledFrom: '2026-12-01',
      expiresAt: '2027-03-03',
    });
  });

  it('uses the course price when the group has none', () => {
    expect(enrollmentDefaults(group({ id: 'g' }), 400_000).agreedPrice).toBe(400_000);
  });

  it('returns null dates without a group so the caller keeps its own values', () => {
    expect(enrollmentDefaults(null, 400_000)).toEqual({ agreedPrice: 400_000, enabledFrom: null, expiresAt: null });
  });
});
