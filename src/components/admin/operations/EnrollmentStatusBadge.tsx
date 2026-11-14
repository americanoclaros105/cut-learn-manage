import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { enrollmentStatusLabels } from '@/lib/operations';
import type { EnrollmentStatus } from '@/types';

const enrollmentStatusClass: Record<EnrollmentStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100',
  active: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
  suspended: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100',
};

interface EnrollmentStatusBadgeProps {
  status: EnrollmentStatus;
  className?: string;
}

/** Status is always spelled out, so it never relies on color alone. */
export const EnrollmentStatusBadge = ({ status, className }: EnrollmentStatusBadgeProps) => (
  <Badge variant="outline" className={cn('font-medium', enrollmentStatusClass[status], className)}>
    {enrollmentStatusLabels[status]}
  </Badge>
);
