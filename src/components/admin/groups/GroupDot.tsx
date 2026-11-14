import { cn } from '@/lib/utils';

interface GroupDotProps {
  color: string | null;
  className?: string;
}

/** Small color marker of a group; falls back to a neutral tone when it has none. */
export const GroupDot = ({ color, className }: GroupDotProps) => (
  <span
    aria-hidden
    className={cn('inline-block h-3 w-3 shrink-0 rounded-full border border-black/10 bg-muted-foreground/40', className)}
    style={color ? { backgroundColor: color } : undefined}
  />
);
