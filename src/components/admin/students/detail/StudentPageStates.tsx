import { UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export const StudentDetailSkeleton = () => (
  <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8" aria-busy="true" aria-label="Cargando estudiante">
    <div className="flex items-center gap-4">
      <Skeleton className="h-14 w-14 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
    <Skeleton className="h-10 w-full max-w-md" />
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
      <Skeleton className="h-72" />
    </div>
  </div>
);

interface StudentPageMessageProps {
  title: string;
  detail: string;
  onBack: () => void;
  onRetry?: () => void;
}

/** Not-found and load-error states share the same layout. */
export const StudentPageMessage = ({ title, detail, onBack, onRetry }: StudentPageMessageProps) => (
  <div className="mx-auto max-w-lg p-8 text-center">
    <UserX className="mx-auto mb-4 h-12 w-12 text-muted-foreground" aria-hidden />
    <h1 className="mb-2 text-xl font-semibold">{title}</h1>
    <p className="mb-6 text-sm text-muted-foreground">{detail}</p>
    <div className="flex justify-center gap-2">
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      )}
      <Button onClick={onBack}>Volver a estudiantes</Button>
    </div>
  </div>
);
