import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface CancelSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** ISO start of the class being cancelled. */
  startsAt: string | null;
  submitting?: boolean;
  onConfirm: (reason: string) => Promise<void> | void;
}

/** Cancelling keeps the class (and any attendance already taken); it can be restored later. */
export const CancelSessionDialog = ({ open, onOpenChange, startsAt, submitting, onConfirm }: CancelSessionDialogProps) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void onConfirm(reason);
          }}
        >
          <DialogHeader>
            <DialogTitle>Cancelar clase</DialogTitle>
            <DialogDescription>
              {startsAt && (
                <span className="capitalize">{format(new Date(startsAt), "EEEE d 'de' MMMM, h:mm a", { locale: es })}. </span>
              )}
              La clase queda marcada como cancelada y no cuenta en la asistencia. Puedes restaurarla después.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Motivo (opcional)</Label>
            <Input
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Festivo, instructor enfermo"
              maxLength={200}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Volver
            </Button>
            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancelar clase
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
