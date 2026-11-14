import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoneyInput } from '@/components/admin/operations/MoneyInput';
import { formatMoneyInput } from '@/lib/money';
import { formatCOP } from '@/lib/operations';
import { dayToIso } from '@/lib/studentSchemas';

export interface EnrollableCourse {
  id: string;
  title: string;
  price: number;
}

export interface AddEnrollmentValues {
  courseId: string;
  agreedPrice: number;
  enabledFrom: string | null;
  expiresAt: string | null;
}

interface AddEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  /** Published courses the student is not enrolled in yet. */
  courses: EnrollableCourse[];
  submitting?: boolean;
  onSubmit: (values: AddEnrollmentValues) => Promise<void> | void;
}

/** Enrolls the student in one more course; the agreed price starts at the course price. */
export const AddEnrollmentDialog = ({ open, onOpenChange, studentName, courses, submitting, onSubmit }: AddEnrollmentDialogProps) => {
  const [courseId, setCourseId] = useState('');
  const [priceText, setPriceText] = useState('');
  const [price, setPrice] = useState(0);
  const [from, setFrom] = useState('');
  const [until, setUntil] = useState('');

  useEffect(() => {
    if (!open) return;
    setCourseId('');
    setPriceText('');
    setPrice(0);
    setFrom('');
    setUntil('');
  }, [open]);

  const pickCourse = (id: string) => {
    setCourseId(id);
    const course = courses.find((c) => c.id === id);
    const suggested = course?.price ?? 0;
    setPrice(suggested);
    setPriceText(suggested ? formatMoneyInput(suggested) : '');
  };

  const invalid = !!from && !!until && until < from;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!courseId || invalid) return;
            void onSubmit({
              courseId,
              agreedPrice: price,
              enabledFrom: from ? dayToIso(from, 'start') : null,
              expiresAt: until ? dayToIso(until, 'end') : null,
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>Inscribir en un curso</DialogTitle>
            <DialogDescription>
              {studentName} quedará pendiente de pago y el acceso se activa solo al completar el valor acordado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="add-course">Curso</Label>
            <Select value={courseId} onValueChange={pickCourse}>
              <SelectTrigger id="add-course">
                <SelectValue placeholder={courses.length === 0 ? 'No hay cursos disponibles' : 'Elige un curso'} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title} · {formatCOP(c.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-price">Valor acordado (COP)</Label>
            <MoneyInput
              id="add-price"
              value={priceText}
              placeholder="0"
              onChange={(text, value) => {
                setPriceText(text);
                setPrice(value);
              }}
            />
            <p className="text-xs text-muted-foreground">Con valor $0 el acceso se habilita de inmediato.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="add-from">Acceso desde (opcional)</Label>
              <Input id="add-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-until">Acceso hasta (opcional)</Label>
              <Input id="add-until" type="date" value={until} min={from || undefined} aria-invalid={invalid} onChange={(e) => setUntil(e.target.value)} />
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
            <Button type="submit" disabled={!courseId || invalid || submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Inscribir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
