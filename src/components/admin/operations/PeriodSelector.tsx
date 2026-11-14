import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarRange } from 'lucide-react';
import type { DateRange as DayRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DateRange, PeriodKind } from '@/lib/accounting';

interface PeriodSelectorProps {
  kind: PeriodKind;
  range: DateRange;
  onKindChange: (kind: PeriodKind) => void;
  onCustomRange: (range: DateRange) => void;
}

const options: Array<{ value: PeriodKind; label: string }> = [
  { value: 'this-month', label: 'Este mes' },
  { value: 'last-month', label: 'Mes anterior' },
  { value: 'this-year', label: 'Este año' },
];

const toDate = (value: string) => new Date(`${value}T00:00:00`);
const label = (value: string) => format(toDate(value), 'd MMM yyyy', { locale: es });

export const PeriodSelector = ({ kind, range, onKindChange, onCustomRange }: PeriodSelectorProps) => (
  <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Período">
    {options.map((o) => (
      <Button key={o.value} size="sm" variant={kind === o.value ? 'default' : 'outline'} aria-pressed={kind === o.value} onClick={() => onKindChange(o.value)}>
        {o.label}
      </Button>
    ))}
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant={kind === 'custom' ? 'default' : 'outline'} aria-pressed={kind === 'custom'}>
          <CalendarRange className="mr-1 h-4 w-4" /> Rango personalizado
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          locale={es}
          numberOfMonths={1}
          selected={{ from: toDate(range.from), to: toDate(range.to) }}
          onSelect={(selected: DayRange | undefined) => {
            if (selected?.from) {
              onCustomRange({
                from: format(selected.from, 'yyyy-MM-dd'),
                to: format(selected.to ?? selected.from, 'yyyy-MM-dd'),
              });
            }
          }}
        />
      </PopoverContent>
    </Popover>
    <span className="text-sm text-muted-foreground">
      {label(range.from)} – {label(range.to)}
    </span>
  </div>
);
