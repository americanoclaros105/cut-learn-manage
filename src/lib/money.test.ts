import { describe, expect, it } from 'vitest';
import { formatMoneyInput, parseMoneyInput } from './money';

describe('parseMoneyInput', () => {
  it('parses plain and thousands-separated pesos', () => {
    expect(parseMoneyInput('150000')).toBe(150000);
    expect(parseMoneyInput('1.250.000')).toBe(1250000);
    expect(parseMoneyInput('$ 1.250.000')).toBe(1250000);
  });

  it('returns 0 for empty or non numeric input', () => {
    expect(parseMoneyInput('')).toBe(0);
    expect(parseMoneyInput('abc')).toBe(0);
  });
});

describe('formatMoneyInput', () => {
  it('adds es-CO thousands separators while typing', () => {
    expect(formatMoneyInput('1250000')).toBe('1.250.000');
    expect(formatMoneyInput('1.2500')).toBe('12.500');
    expect(formatMoneyInput(80000)).toBe('80.000');
  });

  it('returns an empty string for empty input and 0 stays 0', () => {
    expect(formatMoneyInput('')).toBe('');
    expect(formatMoneyInput('0')).toBe('0');
  });
});
