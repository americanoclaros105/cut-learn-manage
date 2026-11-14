import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { AgendaView } from '@/lib/agenda';

export interface FilterOption {
  id: string;
  label: string;
}

interface AgendaToolbarProps {
  title: string;
  view: AgendaView;
  courseId: string;
  groupId: string;
  showCancelled: boolean;
  courses: FilterOption[];
  groups: FilterOption[];
  onView: (view: AgendaView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCourse: (id: string) => void;
  onGroup: (id: string) => void;
  onShowCancelled: (value: boolean) => void;
}

const viewLabels: Record<AgendaView, string> = { week: 'Semana', day: 'Día', list: 'Lista' };

/** Navigation (prev / today / next), view switch, course and group filters and the cancelled toggle. */
export const AgendaToolbar = (props: AgendaToolbarProps) => (
  <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" onClick={props.onPrev} aria-label="Periodo anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={props.onToday}>
          Hoy
        </Button>
        <Button variant="outline" size="icon" onClick={props.onNext} aria-label="Periodo siguiente">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <h2 className="flex-1 text-lg font-semibold capitalize" aria-live="polite">
        {props.title}
      </h2>
      <ToggleGroup
        type="single"
        variant="outline"
        value={props.view}
        onValueChange={(value) => value && props.onView(value as AgendaView)}
        aria-label="Vista de la agenda"
      >
        {(Object.keys(viewLabels) as AgendaView[]).map((view) => (
          <ToggleGroupItem key={view} value={view} aria-label={`Vista ${viewLabels[view].toLowerCase()}`}>
            {viewLabels[view]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <Select value={props.courseId} onValueChange={props.onCourse}>
        <SelectTrigger className="w-full sm:w-56" aria-label="Filtrar por curso">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los cursos</SelectItem>
          {props.courses.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={props.groupId} onValueChange={props.onGroup}>
        <SelectTrigger className="w-full sm:w-56" aria-label="Filtrar por grupo">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los grupos</SelectItem>
          <SelectItem value="none">Sin grupo</SelectItem>
          {props.groups.map((g) => (
            <SelectItem key={g.id} value={g.id}>
              {g.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2">
        <Switch id="agenda-cancelled" checked={props.showCancelled} onCheckedChange={props.onShowCancelled} />
        <Label htmlFor="agenda-cancelled" className="font-normal">
          Mostrar canceladas
        </Label>
      </div>
    </div>
  </div>
);
