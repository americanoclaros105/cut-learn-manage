import { CalendarClock, CreditCard, Mail, StickyNote, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from './format';

interface StudentSidePanelProps {
  enabledFrom: string;
  expiresAt: string;
  notes: string | null;
  canRegisterPayment: boolean;
  onRegisterPayment: () => void;
  onEnroll: () => void;
  onOpenAccess: () => void;
}

/** Right column on desktop: account window, notes and the two most common actions. */
export const StudentSidePanel = ({
  enabledFrom,
  expiresAt,
  notes,
  canRegisterPayment,
  onRegisterPayment,
  onEnroll,
  onOpenAccess,
}: StudentSidePanelProps) => {
  const expired = new Date(expiresAt).getTime() <= Date.now();
  return (
    <aside className="space-y-4" aria-label="Datos rápidos del estudiante">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Acciones rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Button onClick={onRegisterPayment} disabled={!canRegisterPayment}>
            <CreditCard className="mr-2 h-4 w-4" aria-hidden /> Registrar pago
          </Button>
          <Button variant="outline" onClick={onEnroll}>
            <UserPlus className="mr-2 h-4 w-4" aria-hidden /> Inscribir en curso
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4" aria-hidden /> Vigencia de la cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Desde:</span> {formatDate(enabledFrom)}
          </p>
          <p className={expired ? 'font-medium text-destructive' : undefined}>
            <span className={expired ? undefined : 'text-muted-foreground'}>{expired ? 'Expiró:' : 'Expira:'}</span>{' '}
            {formatDate(expiresAt)}
          </p>
          <Button variant="link" className="h-auto p-0" onClick={onOpenAccess}>
            Cambiar acceso
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <StickyNote className="h-4 w-4" aria-hidden /> Notas
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {notes ? <p className="whitespace-pre-wrap">{notes}</p> : <p className="text-muted-foreground">Sin notas.</p>}
        </CardContent>
      </Card>

      <p className="flex items-start gap-2 px-1 text-xs text-muted-foreground">
        <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        El correo de acceso se define al crear la cuenta; no se puede consultar ni cambiar desde el panel.
      </p>
    </aside>
  );
};
