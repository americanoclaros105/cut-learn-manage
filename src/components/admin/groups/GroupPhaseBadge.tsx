import { groupPhaseLabels } from '@/lib/groups';
import { cn } from '@/lib/utils';
import type { GroupPhase } from '@/types';

const tones: Record<GroupPhase, string> = {
  upcoming: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-green-100 text-green-800',
  finished: 'bg-gray-100 text-gray-700',
  archived: 'bg-amber-100 text-amber-800',
};

export const GroupPhaseBadge = ({ phase, className }: { phase: GroupPhase; className?: string }) => (
  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', tones[phase], className)}>
    {groupPhaseLabels[phase]}
  </span>
);
