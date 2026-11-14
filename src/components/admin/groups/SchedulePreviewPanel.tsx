import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarCheck } from 'lucide-react';
import { monthGrid, monthsBetween, type SchedulePreview } from '@/lib/groupForm';
import { weekdayShortLabels } from '@/lib/groups';
import { cn } from '@/lib/utils';

interface SchedulePreviewPanelProps {
  startDate: string;
  endDate: string;
  preview: SchedulePreview;
}

const header = [1, 2, 3, 4, 5, 6, 0].map((d) => weekdayShortLabels[d][0]);

const MiniMonth = ({ year, month, dates }: { year: number; month: number; dates: Set<string> }) => {
  const weeks = useMemo(() => monthGrid(year, month, dates), [year, month, dates]);
  return (
    <div className="rounded-lg border bg-card p-2">
      <p className="mb-1 text-center text-xs font-semibold capitalize">{format(new Date(year, month, 1), 'MMMM yyyy', { locale: es })}</p>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-muted-foreground">
        {header.map((h, i) => (
          <span key={i}>{h}</span>
        ))}
      </div>
      <div className="mt-0.5 grid grid-cols-7 gap-0.5 text-center text-[11px]">
        {weeks.flat().map((cell, i) =>
          cell ? (
            <span
              key={cell.iso}
              title={cell.isClass ? 'Día de clase' : undefined}
              className={cn(
                'rounded py-0.5 tabular-nums',
                cell.isClass ? 'bg-primary font-semibold text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              {cell.day}
            </span>
          ) : (
            <span key={`pad-${i}`} />
          ),
        )}
      </div>
    </div>
  );
};

/** Live text plus a mini calendar per month showing the days the schedule produces. */
export const SchedulePreviewPanel = ({ startDate, endDate, preview }: SchedulePreviewPanelProps) => {
  const months = monthsBetween(startDate, endDate);
  return (
    <div className="space-y-3" aria-live="polite">
      <p className="flex items-start gap-2 text-sm">
        <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span>{preview.text}</span>
      </p>
      {preview.count > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {months.map((m) => (
            <MiniMonth key={`${m.year}-${m.month}`} year={m.year} month={m.month} dates={preview.dates} />
          ))}
        </div>
      )}
    </div>
  );
};
