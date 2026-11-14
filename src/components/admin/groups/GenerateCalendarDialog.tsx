import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface GenerateCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Classes the schedule would produce in total, from the live preview. */
  expectedClasses: number;
  /** Whether the group has a weekly schedule at all. */
  hasSchedule: boolean;
  submitting?: boolean;
  onConfirm: (replaceFuture: boolean) => Promise<void> | void;
}

/** Explains that generating only adds missing classes; offers the destructive rebuild with its own confirmation. */
export const GenerateCalendarDialog = ({
  open,
  onOpenChange,
  expectedClasses,
  hasSchedule,
  submitting,
  onConfirm,
}: GenerateCalendarDialogProps) => {
  const [replace, setReplace] = useState(false);

  useEffect(() => {
    if (open) setReplace(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar calendario de clases</DialogTitle>
          <DialogDescription>
            {hasSchedule
              ? `El horario semanal produce ${expectedClasses} ${expectedClasses === 1 ? 'clase' : 'clases'} entre las fechas del grupo. Solo se agregan las que faltan: las clases que ya existen (incluidas las canceladas y las que tienen asistencia) no se tocan.`
              : 'Este grupo todavía no tiene horario semanal. Edita el grupo y agrega al menos un horario.'}
          </DialogDescription>
        </DialogHeader>

        {hasSchedule && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Checkbox id="replace-future" checked={replace} onCheckedChange={(v) => setReplace(v === true)} className="mt-0.5" />
              <Label htmlFor="replace-future" className="space-y-1 font-normal">
                <span className="block font-medium">Regenerar clases futuras sin asistencia</span>
                <span className="block text-sm text-muted-foreground">
                  Útil después de cambiar el horario: borra las clases futuras generadas que no tienen lista ni están
                  canceladas, y las vuelve a crear.
                </span>
              </Label>
            </div>
            {replace && (
              <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                Se eliminarán las clases futuras generadas sin asistencia, con su tema o notas si las tenían. Las clases
                agregadas a mano no se eliminan.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant={replace ? 'destructive' : 'default'}
            disabled={!hasSchedule || submitting}
            onClick={() => void onConfirm(replace)}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {replace ? 'Regenerar clases' : 'Generar clases'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
