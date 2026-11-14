import { Key, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AccountSecurityCardsProps {
  onChangePassword: () => void;
  onDelete: () => void;
}

/** Password reset and the danger zone, kept apart from the regular access settings. */
export const AccountSecurityCards = ({ onChangePassword, onDelete }: AccountSecurityCardsProps) => (
  <>
    <Card>
      <CardHeader>
        <CardTitle>Contraseña</CardTitle>
        <CardDescription>
          Define una contraseña nueva y compártesela al estudiante. No se puede consultar la actual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={onChangePassword}>
          <Key className="mr-2 h-4 w-4" aria-hidden /> Cambiar contraseña
        </Button>
      </CardContent>
    </Card>

    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Zona de peligro</CardTitle>
        <CardDescription>
          Eliminar al estudiante borra su cuenta, perfil e inscripciones. Sus pagos se conservan en contabilidad.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" aria-hidden /> Eliminar estudiante
        </Button>
      </CardContent>
    </Card>
  </>
);
