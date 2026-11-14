/** Helpers for COP amount text inputs (thousands separated with dots, no decimals). */

const digitsOnly = (value: string | number): string => String(value).replace(/\D/g, '');

export const parseMoneyInput = (value: string): number => {
  const digits = digitsOnly(value);
  return digits ? Number(digits) : 0;
};

export const formatMoneyInput = (value: string | number): string => {
  const digits = digitsOnly(value);
  if (!digits) return '';
  // Manual grouping: Intl's es locale skips the separator for 4-digit numbers.
  return String(Number(digits)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
