import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCOP } from '@/lib/operations';
import type { ReminderTarget } from '@/lib/groupViews';
import { openWhatsAppMessage } from '@/lib/whatsapp';

interface BulkReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: ReminderTarget[];
  /** Selected students that were left out (no balance or no phone). */
  skipped: number;
}

/** One WhatsApp link per debtor: opened one by one so the browser never blocks a burst of tabs. */
export const BulkReminderDialog = ({ open, onOpenChange, targets, skipped }: BulkReminderDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Recordatorio de pago por WhatsApp</DialogTitle>
        <DialogDescription>
          Abre cada conversación con el mensaje ya escrito y envíalo desde WhatsApp.
          {skipped > 0 &&
            ` ${skipped} ${skipped === 1 ? 'seleccionado no aparece' : 'seleccionados no aparecen'} porque no tiene saldo pendiente o no tiene teléfono.`}
        </DialogDescription>
      </DialogHeader>

      {targets.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Ninguno de los seleccionados tiene saldo pendiente y teléfono registrado.
        </p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {targets.map((t) => (
            <li key={t.enrollmentId} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  Debe {formatCOP(t.balance)} · {t.phone}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => openWhatsAppMessage(t.phone, t.message)}>
                <MessageCircle className="mr-1 h-4 w-4" aria-hidden /> Abrir
              </Button>
            </li>
          ))}
        </ul>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cerrar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
