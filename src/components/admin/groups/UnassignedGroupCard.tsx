import { UserRoundX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface UnassignedGroupCardProps {
  count: number;
  onAssign: () => void;
}

/** Shown while enrollments created before the groups feature still have no group. */
export const UnassignedGroupCard = ({ count, onAssign }: UnassignedGroupCardProps) => (
  <Card className="border-dashed border-amber-300 bg-amber-50/50">
    <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
      <div className="flex items-start gap-3">
        <UserRoundX className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
        <div>
          <h3 className="text-lg font-semibold">Sin grupo</h3>
          <p className="text-sm text-muted-foreground">
            {count === 1 ? '1 estudiante inscrito' : `${count} estudiantes inscritos`} en este curso no pertenece a ningún
            grupo. Asígnalos para controlar cupos, calendario y asistencia por grupo.
          </p>
        </div>
      </div>
      <Button variant="outline" onClick={onAssign}>
        Asignar a un grupo
      </Button>
    </CardContent>
  </Card>
);
