import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatMoneyInput } from '@/lib/money';
import { cn } from '@/lib/utils';
import { MoneyInput } from './MoneyInput';

export interface EnrollableStudent {
  id: string;
  name: string;
  phone: string | null;
}

export interface EnrollFormValues {
  userId: string;
  agreedPrice: number;
  enabledFrom: string | null;
  expiresAt: string | null;
}

interface EnrollStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  coursePrice: number;
  /** Students that are not enrolled in this course yet. */
  students: EnrollableStudent[];
  loadingStudents?: boolean;
  submitting?: boolean;
  onSubmit: (values: EnrollFormValues) => Promise<void> | void;
}

export const EnrollStudentDialog = ({
  open,
  onOpenChange,
  courseTitle,
  coursePrice,
  students,
  loadingStudents,
  submitting,
  onSubmit,
}: EnrollStudentDialogProps) => {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [priceText, setPriceText] = useState('');
  const [price, setPrice] = useState(0);
  const [enabledFrom, setEnabledFrom] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    if (!open) return;
    setStudentId(null);
    setPriceText(formatMoneyInput(coursePrice));
    setPrice(coursePrice);
    setEnabledFrom('');
    setExpiresAt('');
  }, [open, coursePrice]);

  const selected = students.find((s) => s.id === studentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!studentId) return;
            void onSubmit({
              userId: studentId,
              agreedPrice: price,
              enabledFrom: enabledFrom ? new Date(`${enabledFrom}T00:00:00`).toISOString() : null,
              expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>Inscribir estudiante</DialogTitle>
            <DialogDescription>
              {courseTitle}. La inscripción queda pendiente de pago y se activa al completar el valor acordado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Estudiante</Label>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" role="combobox" aria-expanded={pickerOpen} className="w-full justify-between font-normal">
                  <span className="truncate">{selected ? selected.name : loadingStudents ? 'Cargando...' : 'Buscar estudiante'}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Nombre o teléfono" />
                  <CommandList>
                    <CommandEmpty>Todos los estudiantes ya están inscritos o no existe ese nombre.</CommandEmpty>
                    {students.map((s) => (
                      <CommandItem
                        key={s.id}
                        value={`${s.name} ${s.phone ?? ''} ${s.id}`}
                        onSelect={() => {
                          setStudentId(s.id);
                          setPickerOpen(false);
                        }}
                      >
                        <Check className={cn('mr-2 h-4 w-4', s.id === studentId ? 'opacity-100' : 'opacity-0')} />
                        <span className="truncate">{s.name}</span>
                        {s.phone && <span className="ml-2 text-xs text-muted-foreground">{s.phone}</span>}
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="enroll-price">Valor acordado (COP)</Label>
            <MoneyInput
              id="enroll-price"
              value={priceText}
              onChange={(t, v) => {
                setPriceText(t);
                setPrice(v);
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="enroll-from">Acceso desde (opcional)</Label>
              <Input id="enroll-from" type="date" value={enabledFrom} onChange={(e) => setEnabledFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enroll-until">Acceso hasta (opcional)</Label>
              <Input id="enroll-until" type="date" value={expiresAt} min={enabledFrom || undefined} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!studentId || submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Inscribir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
