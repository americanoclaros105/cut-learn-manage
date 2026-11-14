import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCOP } from '@/lib/operations';

interface VoidPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Short description of the payment being voided. */
  summary: { amount: number; studentName?: string | null; courseTitle?: string | null } | null;
  submitting?: boolean;
  onConfirm: (reason: string) => Promise<void> | void;
}

/** Voiding requires a reason; the payment is kept in the ledger, never deleted. */
export const VoidPaymentDialog = ({ open, onOpenChange, summary, submitting, onConfirm }: VoidPaymentDialogProps) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const valid = reason.trim().length >= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) void onConfirm(reason.trim());
          }}
        >
          <DialogHeader>
            <DialogTitle>Anular pago</DialogTitle>
            <DialogDescription>
              {summary ? `${formatCOP(summary.amount)}${summary.studentName ? ` de ${summary.studentName}` : ''}. ` : ''}
              El pago queda en el historial como anulado y deja de contar en el saldo. Si la inscripción se había activado
              por este pago, volverá a pendiente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="void-reason">Motivo de la anulación</Label>
            <Textarea
              id="void-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Ej: se registró dos veces"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Volver
            </Button>
            <Button type="submit" variant="destructive" disabled={!valid || submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Anular pago
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
