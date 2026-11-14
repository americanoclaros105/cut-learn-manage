import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { TransferOption } from '@/lib/groupViews';
import { GroupDot } from './GroupDot';

interface TransferGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Students being moved (one or many). */
  studentNames: string[];
  /** Current group name, or null when they have none ("Sin grupo"). */
  fromGroupName: string | null;
  options: TransferOption[];
  submitting?: boolean;
  onConfirm: (groupId: string) => Promise<void> | void;
}

const optionHint = (option: TransferOption, count: number): string => {
  if (option.full) return 'Lleno';
  if (option.disabled) return `Solo ${option.seatsLeft} ${option.seatsLeft === 1 ? 'cupo' : 'cupos'}: no alcanza para ${count}`;
  return option.seatsLeft === null ? 'Sin límite de cupos' : `${option.seatsLeft} ${option.seatsLeft === 1 ? 'cupo libre' : 'cupos libres'}`;
};

/** Moves one or many enrollments to another group of the same course; payments are untouched. */
export const TransferGroupDialog = ({
  open,
  onOpenChange,
  studentNames,
  fromGroupName,
  options,
  submitting,
  onConfirm,
}: TransferGroupDialogProps) => {
  const [target, setTarget] = useState('');

  useEffect(() => {
    if (open) setTarget('');
  }, [open]);

  const count = studentNames.length;
  const who = count === 1 ? studentNames[0] : `${count} estudiantes`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fromGroupName ? 'Trasladar a otro grupo' : 'Asignar a un grupo'}</DialogTitle>
          <DialogDescription>
            {who} {fromGroupName ? `saldrá de ${fromGroupName}` : 'no tiene grupo todavía'}. Los pagos, el valor acordado y el
            historial de asistencia no cambian.
          </DialogDescription>
        </DialogHeader>

        {options.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No hay otros grupos activos en este curso. Crea uno primero.
          </p>
        ) : (
          <RadioGroup value={target} onValueChange={setTarget} className="gap-2" aria-label="Grupo de destino">
            {options.map((option) => (
              <Label
                key={option.id}
                htmlFor={`transfer-${option.id}`}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal ${
                  option.disabled ? 'cursor-not-allowed opacity-50' : target === option.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem id={`transfer-${option.id}`} value={option.id} disabled={option.disabled} />
                <GroupDot color={option.color} />
                <span className="flex-1 font-medium">{option.name}</span>
                <span className={`text-xs ${option.disabled ? 'text-amber-700' : 'text-muted-foreground'}`}>
                  {optionHint(option, count)}
                </span>
              </Label>
            ))}
          </RadioGroup>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={!target || submitting} onClick={() => void onConfirm(target)}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {count === 1 ? 'Trasladar' : `Trasladar ${count}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
