import { useMemo, useState } from 'react';
import { addMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { monthGrid } from '@/lib/groupForm';
import { localDay, sessionsByDay } from '@/lib/groupViews';
import { weekdayShortLabels } from '@/lib/groups';
import { cn } from '@/lib/utils';
import type { AttendanceRecord, ClassSession } from '@/hooks/useClassSessions';

interface SessionsCalendarProps {
  sessions: ClassSession[];
  records: AttendanceRecord[];
  /** Month shown first (defaults to the current one). */
  initialMonth?: Date;
  onOpen: (session: ClassSession) => void;
}

// Monday-first header; weekdayShortLabels is Sunday-first.
const header = [1, 2, 3, 4, 5, 6, 0].map((d) => weekdayShortLabels[d]);

/** Month grid of a group's classes: tap a class to take (or review) its roll call. */
export const SessionsCalendar = ({ sessions, records, initialMonth, onOpen }: SessionsCalendarProps) => {
  const [month, setMonth] = useState(() => {
    const base = initialMonth ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const byDay = useMemo(() => sessionsByDay(sessions), [sessions]);
  const withRecords = useMemo(() => new Set(records.map((r) => r.session_id)), [records]);
  const weeks = useMemo(() => monthGrid(month.getFullYear(), month.getMonth(), new Set()), [month]);
  const today = localDay(new Date());

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="Mes anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold capitalize" aria-live="polite">
          {format(month, 'MMMM yyyy', { locale: es })}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Mes siguiente">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {header.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {weeks.flat().map((cell, i) => {
          if (!cell) return <div key={`pad-${i}`} />;
          const daySessions = byDay.get(cell.iso) ?? [];
          return (
            <div
              key={cell.iso}
              className={cn(
                'flex min-h-16 flex-col gap-1 rounded-md border p-1 text-xs',
                cell.iso === today ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30',
              )}
            >
              <span className={cn('tabular-nums', cell.iso === today && 'font-semibold text-primary')}>{cell.day}</span>
              {daySessions.map((s) => {
                const cancelled = s.status === 'cancelled';
                const taken = withRecords.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={cancelled}
                    onClick={() => onOpen(s)}
                    title={cancelled ? 'Clase cancelada' : taken ? 'Lista tomada' : 'Lista sin tomar'}
                    aria-label={`Clase del ${cell.day}, ${format(new Date(s.starts_at), 'h:mm a', { locale: es })}${
                      cancelled ? ', cancelada' : taken ? ', lista tomada' : ', lista sin tomar'
                    }`}
                    className={cn(
                      'truncate rounded px-1 py-1 text-left text-[11px] font-medium leading-tight',
                      cancelled
                        ? 'cursor-not-allowed bg-gray-200 text-gray-500 line-through'
                        : taken
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-primary/15 text-primary hover:bg-primary/25',
                    )}
                  >
                    {format(new Date(s.starts_at), 'h:mm a', { locale: es })}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <ul className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground" aria-label="Leyenda">
        <li className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-primary/15" aria-hidden /> Lista sin tomar
        </li>
        <li className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-green-100" aria-hidden /> Lista tomada
        </li>
        <li className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-gray-200" aria-hidden /> Cancelada
        </li>
      </ul>
    </div>
  );
};
