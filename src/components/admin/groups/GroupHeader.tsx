import { Link } from 'react-router-dom';
import { Archive, ArchiveRestore, CalendarClock, CalendarDays, MapPin, MoreHorizontal, Pencil, Trash2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDayLabel } from '@/lib/groupForm';
import { formatSchedule } from '@/lib/groups';
import type { CourseGroupWithStats, GroupPhase } from '@/types';
import { GroupDot } from './GroupDot';
import { GroupOccupancy } from './GroupOccupancy';
import { GroupPhaseBadge } from './GroupPhaseBadge';

interface GroupHeaderProps {
  group: CourseGroupWithStats;
  phase: GroupPhase;
  editHref: string;
  onToggleArchive: () => void;
  onDelete: () => void;
}

/** Sticky summary of the group with its main actions. */
export const GroupHeader = ({ group, phase, editHref, onToggleArchive, onDelete }: GroupHeaderProps) => {
  const archived = phase === 'archived';
  return (
    <header className="sticky top-0 z-20 -mx-4 space-y-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <GroupDot color={group.color} className="h-5 w-5" />
          <h1 className="truncate text-2xl font-bold">{group.name}</h1>
          <GroupPhaseBadge phase={phase} />
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to={editHref}>
              <Pencil className="mr-2 h-4 w-4" aria-hidden /> Editar
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Más acciones del grupo">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={onToggleArchive}>
                {archived ? (
                  <>
                    <ArchiveRestore className="mr-2 h-4 w-4" /> Restaurar grupo
                  </>
                ) : (
                  <>
                    <Archive className="mr-2 h-4 w-4" /> Archivar grupo
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar grupo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_16rem] md:items-center">
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" aria-hidden /> {formatDayLabel(group.start_date)} – {formatDayLabel(group.end_date)}
          </li>
          <li className="flex items-center gap-1.5">
            <CalendarClock className="h-4 w-4" aria-hidden /> {formatSchedule(group.schedules)}
          </li>
          {group.location && (
            <li className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" aria-hidden /> {group.location}
            </li>
          )}
          {group.instructor && (
            <li className="flex items-center gap-1.5">
              <UserRound className="h-4 w-4" aria-hidden /> {group.instructor}
            </li>
          )}
        </ul>
        <GroupOccupancy capacity={group.capacity} enrolled={group.enrolled} />
      </div>
    </header>
  );
};
