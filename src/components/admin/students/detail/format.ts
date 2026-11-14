import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/** dd/MM/yyyy for timestamps and calendar days alike; empty input renders the fallback. */
export const formatDate = (value: string | null | undefined, fallback = '—'): string => {
  if (!value) return fallback;
  const date = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return format(date, 'dd/MM/yyyy', { locale: es });
};

export const formatDateTime = (value: string): string => format(new Date(value), "dd MMM yyyy, HH:mm", { locale: es });

export const formatPercent = (ratio: number | null): string => (ratio === null ? 'Sin registros' : `${Math.round(ratio * 100)}%`);
