import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCOP } from '@/lib/operations';
import { isDeleteConfirmed, type DeleteImpact } from '@/lib/studentDetail';

interface DeleteStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  impact: DeleteImpact;
  deleting: boolean;
  onConfirm: () => void;
}

/** Destructive action gated by typing the student's name, with the consequences spelled out. */
export const DeleteStudentDialog = ({ open, onOpenChange, studentName, impact, deleting, onConfirm }: DeleteStudentDialogProps) => {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (open) setTyped('');
  }, [open]);

  const confirmed = isDeleteConfirmed(studentName, typed);

  return (
    <Dialog open={open} onOpenChange={(next) => !deleting && onOpenChange(next)}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (confirmed && !deleting) onConfirm();
          }}
        >
          <DialogHeader>
            <DialogTitle>Eliminar a {studentName}</DialogTitle>
            <DialogDescription>Esta acción es permanente y no se puede deshacer.</DialogDescription>
          </DialogHeader>

          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>
              Se elimina la cuenta, el perfil y su progreso en los cursos.
            </li>
            <li>
              {impact.enrollments === 0
                ? 'No tiene inscripciones.'
                : `Se eliminan ${impact.enrollments} inscripción(es), ${impact.activeEnrollments} con acceso activo.`}
            </li>
            <li>
              {impact.payments === 0
                ? 'No tiene pagos registrados.'
                : `Sus ${impact.payments} pago(s) (${formatCOP(impact.paidTotal)} vigentes) se conservan en contabilidad con el nombre y el curso como estaban.`}
            </li>
          </ul>

          <div className="space-y-2">
            <Label htmlFor="delete-confirm">
              Para confirmar, escribe <strong>{studentName}</strong>
            </Label>
            <Input id="delete-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoFocus />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={!confirmed || deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar estudiante
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
