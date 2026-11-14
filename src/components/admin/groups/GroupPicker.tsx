import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatCOP } from '@/lib/operations';
import { NO_GROUP, type GroupPickerOption } from '@/lib/groupPicker';
import { cn } from '@/lib/utils';
import { GroupDot } from './GroupDot';
import { GroupPhaseBadge } from './GroupPhaseBadge';

interface GroupPickerProps {
  /** Prefix that keeps the radio ids unique when several pickers share a page. */
  idPrefix: string;
  options: GroupPickerOption[];
  /** A group id or NO_GROUP. */
  value: string;
  loading?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}

/** Rich single choice of a group: color, phase, dates, schedule, seats and price; plus "Sin grupo". */
export const GroupPicker = ({ idPrefix, options, value, loading, disabled, onChange }: GroupPickerProps) => {
  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Cargando grupos…
      </p>
    );
  }

  return (
    <RadioGroup value={value} onValueChange={onChange} disabled={disabled} className="gap-2" aria-label="Grupo del curso">
      <Label
        htmlFor={`${idPrefix}-none`}
        className={cn(
          'flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal',
          value === NO_GROUP ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
        )}
      >
        <RadioGroupItem id={`${idPrefix}-none`} value={NO_GROUP} />
        <span className="font-medium">Sin grupo por ahora</span>
        <span className="text-xs text-muted-foreground">Se puede asignar después.</span>
      </Label>

      {options.length === 0 && (
        <p className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
          Este curso todavía no tiene grupos activos.
        </p>
      )}

      {options.map((option) => (
        <Label
          key={option.id}
          htmlFor={`${idPrefix}-${option.id}`}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-3 font-normal',
            option.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            value === option.id ? 'border-primary bg-primary/5' : !option.disabled && 'hover:bg-muted/50',
          )}
        >
          <RadioGroupItem id={`${idPrefix}-${option.id}`} value={option.id} disabled={option.disabled} className="mt-1" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <GroupDot color={option.color} />
              <span className="font-medium">{option.name}</span>
              <GroupPhaseBadge phase={option.phase} />
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  option.full ? 'bg-red-100 text-red-800' : 'bg-muted text-muted-foreground',
                )}
              >
                {option.seatsLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {option.dates} · {option.schedule}
            </p>
            <p className="text-xs text-muted-foreground">
              Valor {formatCOP(option.price)} {option.priceSource === 'group' ? '(precio del grupo)' : '(precio del curso)'}
            </p>
          </div>
        </Label>
      ))}
    </RadioGroup>
  );
};
