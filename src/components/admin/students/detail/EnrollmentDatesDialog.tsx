import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dayToIso, isoToDay } from '@/lib/studentSchemas';

interface EnrollmentDatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  enabledFrom: string | null;
  expiresAt: string | null;
  submitting?: boolean;
  onSubmit: (values: { enabled_from: string | null; expires_at: string | null }) => Promise<void> | void;
}

/** Edits the access window of one enrollment; both dates are optional. */
export const EnrollmentDatesDialog = ({
  open,
  onOpenChange,
  courseTitle,
  enabledFrom,
  expiresAt,
  submitting,
  onSubmit,
}: EnrollmentDatesDialogProps) => {
  const [from, setFrom] = useState('');
  const [until, setUntil] = useState('');

  useEffect(() => {
    if (!open) return;
    setFrom(isoToDay(enabledFrom));
    setUntil(isoToDay(expiresAt));
  }, [open, enabledFrom, expiresAt]);

  const invalid = !!from && !!until && until < from;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (invalid) return;
            void onSubmit({
              enabled_from: from ? dayToIso(from, 'start') : null,
              expires_at: until ? dayToIso(until, 'end') : null,
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>Fechas de acceso</DialogTitle>
            <DialogDescription>
              {courseTitle}. Fuera de este rango el estudiante no puede abrir el curso aunque esté pagado. Déjalas vacías
              para no limitar el acceso.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dates-from">Acceso desde</Label>
              <Input id="dates-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dates-until">Acceso hasta</Label>
              <Input
                id="dates-until"
                type="date"
                value={until}
                min={from || undefined}
                aria-invalid={invalid}
                onChange={(e) => setUntil(e.target.value)}
              />
            </div>
          </div>
          {invalid && (
            <p role="alert" className="text-sm text-destructive">
              La fecha final no puede ser anterior a la inicial.
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={invalid || submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
