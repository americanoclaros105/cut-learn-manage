import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatCOP } from '@/lib/operations';
import { formatMoneyInput } from '@/lib/money';
import { MoneyInput } from './MoneyInput';

interface EditPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  currentPrice: number;
  paid: number;
  submitting?: boolean;
  onSubmit: (price: number) => Promise<void> | void;
}

export const EditPriceDialog = ({
  open,
  onOpenChange,
  studentName,
  currentPrice,
  paid,
  submitting,
  onSubmit,
}: EditPriceDialogProps) => {
  const [text, setText] = useState('');
  const [price, setPrice] = useState(0);

  useEffect(() => {
    if (open) {
      setText(formatMoneyInput(currentPrice));
      setPrice(currentPrice);
    }
  }, [open, currentPrice]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit(price);
          }}
        >
          <DialogHeader>
            <DialogTitle>Valor acordado</DialogTitle>
            <DialogDescription>
              {studentName} lleva pagados {formatCOP(paid)}. Si el nuevo valor queda cubierto, el acceso se habilita solo;
              si queda por encima de lo pagado, una inscripción activada por pago vuelve a pendiente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="agreed-price">Nuevo valor (COP)</Label>
            <MoneyInput
              id="agreed-price"
              value={text}
              onChange={(t, v) => {
                setText(t);
                setPrice(v);
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || text === ''}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
