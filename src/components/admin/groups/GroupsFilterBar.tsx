import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { groupPhaseLabels } from '@/lib/groups';
import type { GroupPhaseFilter } from '@/lib/groupViews';
import { cn } from '@/lib/utils';

interface GroupsFilterBarProps {
  phase: GroupPhaseFilter;
  onPhaseChange: (phase: GroupPhaseFilter) => void;
  counts: Record<GroupPhaseFilter, number>;
  showArchived: boolean;
  onShowArchivedChange: (value: boolean) => void;
}

const chips: Array<{ value: GroupPhaseFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'in_progress', label: groupPhaseLabels.in_progress },
  { value: 'upcoming', label: groupPhaseLabels.upcoming },
  { value: 'finished', label: groupPhaseLabels.finished },
];

export const GroupsFilterBar = ({ phase, onPhaseChange, counts, showArchived, onShowArchivedChange }: GroupsFilterBarProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por fase">
      {chips.map((chip) => (
        <button
          key={chip.value}
          type="button"
          aria-pressed={phase === chip.value}
          onClick={() => onPhaseChange(chip.value)}
          className={cn(
            'rounded-full border px-3 py-1 text-sm transition-colors',
            phase === chip.value ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
          )}
        >
          {chip.label} <span className="tabular-nums opacity-80">({counts[chip.value]})</span>
        </button>
      ))}
    </div>
    <div className="flex items-center gap-2">
      <Switch id="show-archived" checked={showArchived} onCheckedChange={onShowArchivedChange} />
      <Label htmlFor="show-archived" className="text-sm">
        Mostrar archivados ({counts.archived})
      </Label>
    </div>
  </div>
);
