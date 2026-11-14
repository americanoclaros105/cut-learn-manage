import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { weekdayLabels, weekdayShortLabels } from '@/lib/groups';
import type { ScheduleIssue, ScheduleRow } from '@/lib/groupForm';
import { cn } from '@/lib/utils';

interface ScheduleBuilderProps {
  rows: ScheduleRow[];
  issues: ScheduleIssue[];
  onChangeRow: (id: string, patch: Partial<Omit<ScheduleRow, 'id'>>) => void;
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
}

// Monday first, Sunday last.
const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];

/** One row = several weekday chips sharing the same start and end time. */
export const ScheduleBuilder = ({ rows, issues, onChangeRow, onAddRow, onRemoveRow }: ScheduleBuilderProps) => (
  <div className="space-y-3">
    {rows.length === 0 && (
      <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        Aún no hay horario. Agrega los días y las horas en que se reúne el grupo cada semana.
      </p>
    )}

    {rows.map((row, index) => {
      const issue = issues.find((i) => i.rowId === row.id);
      return (
        <div key={row.id} className={cn('space-y-3 rounded-lg border p-3', issue && 'border-destructive/60')}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Horario {index + 1}</span>
            <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveRow(row.id)} aria-label={`Quitar horario ${index + 1}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label={`Días del horario ${index + 1}`}>
            {weekdayOrder.map((day) => {
              const on = row.weekdays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={on}
                  aria-label={weekdayLabels[day]}
                  onClick={() =>
                    onChangeRow(row.id, { weekdays: on ? row.weekdays.filter((d) => d !== day) : [...row.weekdays, day] })
                  }
                  className={cn(
                    'h-10 min-w-12 rounded-full border px-3 text-sm font-medium transition-colors',
                    on ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
                  )}
                >
                  {weekdayShortLabels[day]}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
            <div className="space-y-1">
              <label htmlFor={`start-${row.id}`} className="text-xs text-muted-foreground">
                Inicio
              </label>
              <Input id={`start-${row.id}`} type="time" value={row.start} onChange={(e) => onChangeRow(row.id, { start: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label htmlFor={`end-${row.id}`} className="text-xs text-muted-foreground">
                Fin
              </label>
              <Input id={`end-${row.id}`} type="time" value={row.end} onChange={(e) => onChangeRow(row.id, { end: e.target.value })} />
            </div>
          </div>

          {issue && (
            <p role="alert" className="text-sm text-destructive">
              {issue.message}
            </p>
          )}
        </div>
      );
    })}

    <Button type="button" variant="outline" onClick={onAddRow}>
      <Plus className="mr-2 h-4 w-4" /> Agregar horario
    </Button>
  </div>
);
