import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { enrollmentStatusLabels } from '@/lib/operations';
import type { RosterStatusFilter } from '@/lib/roster';

interface RosterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: RosterStatusFilter;
  onStatusChange: (value: RosterStatusFilter) => void;
  counts: Record<RosterStatusFilter, number>;
}

const filters: Array<{ value: RosterStatusFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: enrollmentStatusLabels.pending },
  { value: 'active', label: enrollmentStatusLabels.active },
  { value: 'suspended', label: enrollmentStatusLabels.suspended },
  { value: 'cancelled', label: enrollmentStatusLabels.cancelled },
];

export const RosterToolbar = ({ search, onSearchChange, status, onStatusChange, counts }: RosterToolbarProps) => (
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div className="relative md:w-72">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Buscar por nombre o teléfono"
        aria-label="Buscar estudiante"
        className="pl-9"
      />
    </div>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
      {filters.map((f) => (
        <button
          key={f.value}
          type="button"
          aria-pressed={status === f.value}
          onClick={() => onStatusChange(f.value)}
          className={cn(
            'rounded-full border px-3 py-1 text-sm transition-colors',
            status === f.value ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
          )}
        >
          {f.label} <span className="tabular-nums opacity-80">({counts[f.value]})</span>
        </button>
      ))}
    </div>
  </div>
);
