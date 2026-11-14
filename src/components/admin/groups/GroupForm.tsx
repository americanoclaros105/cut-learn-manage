import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MoneyInput } from '@/components/admin/operations/MoneyInput';
import { GROUP_COLORS, type GroupFormErrors, type ScheduleIssue, type ScheduleRow, type SchedulePreview } from '@/lib/groupForm';
import { formatCOP } from '@/lib/operations';
import { cn } from '@/lib/utils';
import { ScheduleBuilder } from './ScheduleBuilder';
import { SchedulePreviewPanel } from './SchedulePreviewPanel';

export interface GroupFormState {
  name: string;
  color: string;
  start_date: string;
  end_date: string;
  location: string;
  instructor: string;
  /** Raw text, validated by `validateGroupForm`. */
  capacity: string;
  priceText: string;
  price: number;
  notes: string;
}

interface GroupFormProps {
  state: GroupFormState;
  onChange: (patch: Partial<GroupFormState>) => void;
  errors: GroupFormErrors;
  rows: ScheduleRow[];
  scheduleIssues: ScheduleIssue[];
  onChangeRow: (id: string, patch: Partial<Omit<ScheduleRow, 'id'>>) => void;
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  preview: SchedulePreview;
  coursePrice: number;
  /** Creating: offers to generate the class calendar right after saving. */
  isCreate: boolean;
  generateNow: boolean;
  onGenerateNowChange: (value: boolean) => void;
  submitting: boolean;
  submitLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
}

const Field = ({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    {children}
    {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    {error && (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    )}
  </div>
);

export const GroupForm = ({
  state,
  onChange,
  errors,
  rows,
  scheduleIssues,
  onChangeRow,
  onAddRow,
  onRemoveRow,
  preview,
  coursePrice,
  isCreate,
  generateNow,
  onGenerateNowChange,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: GroupFormProps) => (
  <form
    className="space-y-6"
    noValidate
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
  >
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Identificación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field id="group-name" label="Nombre del grupo" error={errors.name}>
          <Input
            id="group-name"
            value={state.name}
            onChange={(e) => onChange({ name: e.target.value })}
            aria-invalid={!!errors.name}
            maxLength={80}
          />
        </Field>
        <div className="space-y-2">
          <Label id="group-color-label">Color</Label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="group-color-label">
            {GROUP_COLORS.map((color) => {
              const on = state.color.toLowerCase() === color;
              return (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={`Color ${color}`}
                  onClick={() => onChange({ color })}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform hover:scale-105',
                    on ? 'border-foreground' : 'border-transparent',
                  )}
                  style={{ backgroundColor: color }}
                >
                  {on && <Check className="h-4 w-4 text-white" aria-hidden />}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fechas</CardTitle>
        <CardDescription>El primer y el último día en que el grupo puede tener clases.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field id="group-start" label="Inicio" error={errors.start_date}>
          <Input id="group-start" type="date" value={state.start_date} onChange={(e) => onChange({ start_date: e.target.value })} aria-invalid={!!errors.start_date} />
        </Field>
        <Field id="group-end" label="Fin" error={errors.end_date}>
          <Input
            id="group-end"
            type="date"
            value={state.end_date}
            min={state.start_date || undefined}
            onChange={(e) => onChange({ end_date: e.target.value })}
            aria-invalid={!!errors.end_date}
          />
        </Field>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Horario semanal</CardTitle>
        <CardDescription>Puedes combinar varios días y horas distintas, por ejemplo lunes y miércoles por la noche y sábados en la mañana.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ScheduleBuilder rows={rows} issues={scheduleIssues} onChangeRow={onChangeRow} onAddRow={onAddRow} onRemoveRow={onRemoveRow} />
        <SchedulePreviewPanel startDate={state.start_date} endDate={state.end_date} preview={preview} />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lugar, cupos y precio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="group-location" label="Lugar (opcional)">
            <Input id="group-location" value={state.location} onChange={(e) => onChange({ location: e.target.value })} placeholder="Ej: Sede principal" />
          </Field>
          <Field id="group-instructor" label="Instructor (opcional)">
            <Input id="group-instructor" value={state.instructor} onChange={(e) => onChange({ instructor: e.target.value })} />
          </Field>
          <Field id="group-capacity" label="Cupo máximo (opcional)" error={errors.capacity} hint="Déjalo vacío si no hay límite.">
            <Input
              id="group-capacity"
              inputMode="numeric"
              value={state.capacity}
              onChange={(e) => onChange({ capacity: e.target.value.replace(/[^\d.]/g, '') })}
              placeholder="Ej: 15"
              aria-invalid={!!errors.capacity}
            />
          </Field>
          <Field id="group-price" label="Precio del grupo (opcional)" hint={`Si lo dejas vacío se usa el del curso: ${formatCOP(coursePrice)}.`}>
            <MoneyInput
              id="group-price"
              value={state.priceText}
              placeholder={String(coursePrice).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              onChange={(text, value) => onChange({ priceText: text, price: value })}
            />
          </Field>
        </div>
        <Field id="group-notes" label="Notas (opcional)">
          <Textarea id="group-notes" value={state.notes} onChange={(e) => onChange({ notes: e.target.value })} rows={3} />
        </Field>
      </CardContent>
    </Card>

    {isCreate && (
      <div className="flex items-start gap-3 rounded-lg border p-4">
        <Checkbox id="generate-now" checked={generateNow} onCheckedChange={(v) => onGenerateNowChange(v === true)} className="mt-0.5" />
        <Label htmlFor="generate-now" className="space-y-1 font-normal">
          <span className="block font-medium">Generar el calendario de clases ahora</span>
          <span className="block text-sm text-muted-foreground">
            Crea una clase por cada día del horario entre las fechas del grupo. Puedes volver a generarlo cuando quieras.
          </span>
        </Label>
      </div>
    )}

    <div className="flex flex-wrap justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" disabled={submitting}>
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  </form>
);
