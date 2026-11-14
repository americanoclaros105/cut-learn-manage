import { describe, expect, it } from 'vitest';
import {
  accountAccessSchema,
  createStudentSchema,
  dayToIso,
  isoToDay,
  personalDataSchema,
} from './studentSchemas';

const issuePaths = (result: { success: boolean; error?: { issues: Array<{ path: Array<string | number> }> } }) =>
  result.success ? [] : (result.error?.issues.map((i) => i.path.join('.')) ?? []);

describe('personalDataSchema', () => {
  it('accepts a trimmed name with optional phone and notes', () => {
    const parsed = personalDataSchema.parse({ name: '  Ana Ruiz ', phone: '', notes: '', avatar: '' });
    expect(parsed.name).toBe('Ana Ruiz');
  });

  it('rejects short names and malformed phones', () => {
    expect(issuePaths(personalDataSchema.safeParse({ name: 'A', phone: '', notes: '', avatar: '' }))).toContain('name');
    expect(issuePaths(personalDataSchema.safeParse({ name: 'Ana', phone: '12ab', notes: '', avatar: '' }))).toContain('phone');
  });

  it('accepts common phone formats', () => {
    for (const phone of ['3001234567', '+57 300 123 4567', '(300) 123-4567']) {
      expect(personalDataSchema.safeParse({ name: 'Ana', phone, notes: '', avatar: '' }).success).toBe(true);
    }
  });
});

describe('accountAccessSchema', () => {
  const base = { status: 'active' as const, enabled_from: '2026-01-01', expires_at: '2026-12-31' };

  it('accepts a valid range', () => {
    expect(accountAccessSchema.safeParse(base).success).toBe(true);
  });

  it('rejects an expiry before the start and missing dates', () => {
    expect(issuePaths(accountAccessSchema.safeParse({ ...base, expires_at: '2025-12-31' }))).toContain('expires_at');
    expect(issuePaths(accountAccessSchema.safeParse({ ...base, enabled_from: '' }))).toContain('enabled_from');
  });
});

describe('createStudentSchema', () => {
  const base = {
    name: 'Ana Ruiz',
    phone: '',
    notes: '',
    avatar: '',
    email: 'ana@example.com',
    password: 'secret1',
    status: 'active' as const,
    enabled_from: '2026-01-01',
    expires_at: '2026-12-31',
    enrollments: [{ course_id: 'c1', agreed_price: 100000, initial_payment: 0 }],
  };

  it('accepts a complete form', () => {
    expect(createStudentSchema.safeParse(base).success).toBe(true);
  });

  it('validates email and password length', () => {
    expect(issuePaths(createStudentSchema.safeParse({ ...base, email: 'nope' }))).toContain('email');
    expect(issuePaths(createStudentSchema.safeParse({ ...base, password: '123' }))).toContain('password');
  });

  it('rejects duplicate courses and an initial payment above the agreed price', () => {
    const dup = createStudentSchema.safeParse({
      ...base,
      enrollments: [
        { course_id: 'c1', agreed_price: 10, initial_payment: 0 },
        { course_id: 'c1', agreed_price: 10, initial_payment: 0 },
      ],
    });
    expect(issuePaths(dup)).toContain('enrollments.1.course_id');
    const over = createStudentSchema.safeParse({
      ...base,
      enrollments: [{ course_id: 'c1', agreed_price: 1000, initial_payment: 2000 }],
    });
    expect(issuePaths(over)).toContain('enrollments.0.initial_payment');
  });

  it('allows creating a student without enrollments', () => {
    expect(createStudentSchema.safeParse({ ...base, enrollments: [] }).success).toBe(true);
  });
});

describe('day conversion', () => {
  it('converts a calendar day to the local start or end of day and back', () => {
    expect(dayToIso('2026-11-13', 'start')).toBe(new Date('2026-11-13T00:00:00').toISOString());
    expect(dayToIso('2026-11-13', 'end')).toBe(new Date('2026-11-13T23:59:59').toISOString());
    expect(isoToDay(new Date('2026-11-13T10:00:00').toISOString())).toBe('2026-11-13');
    expect(isoToDay(null)).toBe('');
  });
});
