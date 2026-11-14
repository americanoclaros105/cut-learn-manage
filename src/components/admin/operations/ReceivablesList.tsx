import { Banknote, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCOP } from '@/lib/operations';
import { receivableMessage, type Receivable } from '@/lib/accounting';
import { openWhatsAppMessage } from '@/lib/whatsapp';
import { EnrollmentStatusBadge } from './EnrollmentStatusBadge';

interface ReceivablesListProps {
  items: Receivable[];
  onRegisterPayment: (item: Receivable) => void;
}

export const ReceivablesList = ({ items, onRegisterPayment }: ReceivablesListProps) => (
  <ul className="grid gap-3">
    {items.map((item) => (
      <li key={item.enrollmentId}>
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{item.studentName}</p>
              <p className="truncate text-sm text-muted-foreground">{item.courseTitle}</p>
              <div className="mt-1">
                <EnrollmentStatusBadge status={item.status} />
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-4 text-right text-xs">
              <div>
                <dt className="text-muted-foreground">Acordado</dt>
                <dd className="tabular-nums">{formatCOP(item.agreed)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pagado</dt>
                <dd className="tabular-nums">{formatCOP(item.paid)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Saldo</dt>
                <dd className="text-sm font-semibold tabular-nums text-amber-700">{formatCOP(item.balance)}</dd>
              </div>
            </dl>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onRegisterPayment(item)}>
                <Banknote className="mr-1 h-4 w-4" /> Registrar pago
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!item.phone}
                title={item.phone ? undefined : 'El estudiante no tiene teléfono'}
                onClick={() => item.phone && openWhatsAppMessage(item.phone, receivableMessage(item.studentName, item.courseTitle, item.balance))}
              >
                <MessageCircle className="mr-1 h-4 w-4" /> Recordar
              </Button>
            </div>
          </CardContent>
        </Card>
      </li>
    ))}
  </ul>
);
