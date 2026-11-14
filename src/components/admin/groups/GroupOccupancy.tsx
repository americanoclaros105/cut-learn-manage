import { Progress } from '@/components/ui/progress';
import { occupancyInfo } from '@/lib/groupViews';
import { cn } from '@/lib/utils';

interface GroupOccupancyProps {
  capacity: number | null;
  enrolled: number;
  className?: string;
}

/** "12/15 cupos" with a bar; turns amber with a "Lleno" mark when there are no seats left. */
export const GroupOccupancy = ({ capacity, enrolled, className }: GroupOccupancyProps) => {
  const info = occupancyInfo(capacity, enrolled);
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className={cn('tabular-nums', info.full && 'font-medium text-amber-700')}>{info.label}</span>
        {info.full && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Lleno</span>}
      </div>
      {info.percent !== null && (
        <Progress
          value={info.percent}
          aria-label={`Ocupación ${info.percent}%`}
          className={cn('h-2', info.full && '[&>div]:bg-amber-500')}
        />
      )}
    </div>
  );
};
