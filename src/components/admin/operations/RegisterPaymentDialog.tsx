import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCOP, paymentMethodLabels } from '@/lib/operations';
import { formatMoneyInput } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { EnrollmentStatus, PaymentMethod } from '@/types';
import { MoneyInput } from './MoneyInput';

export interface PaymentTarget {
  enrollmentId: string;
  courseId: string;
  studentName: string;
  courseTitle: string;
  status: EnrollmentStatus;
  agreed: number;
  paid: number;
}

export interface PaymentFormValues {
  target: PaymentTarget;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  reference: string;
  notes: string;
}

interface RegisterPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Enrollments the payment can be assigned to. */
  targets: PaymentTarget[];
  /** Preselected enrollment. */
  initialEnrollmentId?: string | null;
  /** When true the enrollment cannot be changed (opened from a roster row). */
  lockTarget?: boolean;
  submitting?: boolean;
  onSubmit: (values: PaymentFormValues) => Promise<void> | void;
}

const today = () => format(new Date(), 'yyyy-MM-dd');
const methods = Object.keys(paymentMethodLabels) as PaymentMethod[];

/** Reused by the course roster and the accounting page. */
export const RegisterPaymentDialog = ({
  open,
  onOpenChange,
  targets,
  initialEnrollmentId,
  lockTarget,
  submitting,
  onSubmit,
}: RegisterPaymentDialogProps) => {
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [amountText, setAmountText] = useState('');
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [paidAt, setPaidAt] = useState(today());
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const target = useMemo(() => targets.find((t) => t.enrollmentId === enrollmentId) ?? null, [targets, enrollmentId]);
  const balance = target ? target.agreed - target.paid : 0;

  const selectTarget = (id: string | null) => {
    setEnrollmentId(id);
    const t = targets.find((x) => x.enrollmentId === id);
    const suggested = t ? Math.max(0, t.agreed - t.paid) : 0;
    setAmount(suggested);
    setAmountText(suggested ? formatMoneyInput(suggested) : '');
  };

  // Reset the form every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    selectTarget(initialEnrollmentId ?? null);
    setMethod('cash');
    setPaidAt(today());
    setReference('');
    setNotes('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialEnrollmentId]);

  const canSubmit = !!target && amount > 0 && !!paidAt && !submitting;
  const exceeds = !!target && amount > Math.max(0, balance);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target || amount <= 0) return;
    await onSubmit({ target, amount, method, paidAt, reference, notes });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>
              El pago se suma al saldo de la inscripción. Si se completa el valor acordado, el acceso se habilita solo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Estudiante y curso</Label>
            {lockTarget && target ? (
              <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span className="font-medium">{target.studentName}</span> · {target.courseTitle}
              </p>
            ) : (
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" role="combobox" aria-expanded={pickerOpen} className="w-full justify-between font-normal">
                    <span className="truncate">
                      {target ? `${target.studentName} · ${target.courseTitle}` : 'Buscar estudiante o curso'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Nombre del estudiante o curso" />
                    <CommandList>
                      <CommandEmpty>No hay inscripciones que coincidan.</CommandEmpty>
                      {targets.map((t) => (
                        <CommandItem
                          key={t.enrollmentId}
                          value={`${t.studentName} ${t.courseTitle} ${t.enrollmentId}`}
                          onSelect={() => {
                            selectTarget(t.enrollmentId);
                            setPickerOpen(false);
                          }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', t.enrollmentId === enrollmentId ? 'opacity-100' : 'opacity-0')} />
                          <div className="min-w-0">
                            <p className="truncate text-sm">{t.studentName}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {t.courseTitle} · saldo {formatCOP(Math.max(0, t.agreed - t.paid))}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
            {target && (
              <dl className="grid grid-cols-3 gap-2 rounded-md bg-muted/40 p-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Acordado</dt>
                  <dd className="font-medium tabular-nums">{formatCOP(target.agreed)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Pagado</dt>
                  <dd className="font-medium tabular-nums">{formatCOP(target.paid)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Saldo</dt>
                  <dd className="font-medium tabular-nums">{formatCOP(Math.max(0, balance))}</dd>
                </div>
              </dl>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Monto (COP)</Label>
              <MoneyInput
                id="payment-amount"
                value={amountText}
                onChange={(text, value) => {
                  setAmountText(text);
                  setAmount(value);
                }}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Medio de pago</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger id="payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m} value={m}>
                      {paymentMethodLabels[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {exceeds && (
            <p role="status" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              El monto supera el saldo ({formatCOP(Math.max(0, balance))}). Puedes registrarlo igualmente.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payment-date">Fecha del pago</Label>
              <Input id="payment-date" type="date" value={paidAt} max={today()} onChange={(e) => setPaidAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-reference">Referencia (opcional)</Label>
              <Input id="payment-reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="N.º de transferencia" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-notes">Notas (opcional)</Label>
            <Textarea id="payment-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar pago
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
