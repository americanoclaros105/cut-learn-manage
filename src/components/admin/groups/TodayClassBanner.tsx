import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TodayClassBannerProps {
  startsAt: string;
  /** True when the roll call of that class already has records. */
  taken: boolean;
  onOpen: () => void;
}

/** Prominent shortcut to today's roll call, sized for a thumb on mobile. */
export const TodayClassBanner = ({ startsAt, taken, onOpen }: TodayClassBannerProps) => (
  <section
    aria-label="Clase de hoy"
    className="flex flex-col gap-3 rounded-lg border border-primary/40 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <div>
      <p className="text-sm font-medium text-primary">Hoy hay clase</p>
      <p className="text-lg font-semibold">{format(new Date(startsAt), 'h:mm a', { locale: es })}</p>
      <p className="text-xs text-muted-foreground">
        {taken ? 'La lista ya tiene registros; puedes revisarla o corregirla.' : 'La lista aún no se ha tomado.'}
      </p>
    </div>
    <Button size="lg" className="h-14 w-full text-base sm:w-auto" onClick={onOpen}>
      <ClipboardCheck className="mr-2 h-5 w-5" aria-hidden /> {taken ? 'Revisar lista de hoy' : 'Tomar lista de hoy'}
    </Button>
  </section>
);
