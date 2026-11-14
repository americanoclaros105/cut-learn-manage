import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCOP, paymentMethodLabels } from '@/lib/operations';
import type { LedgerPayment } from '@/lib/accounting';

interface LedgerTableProps {
  payments: LedgerPayment[];
  staffNames: Record<string, string>;
  onVoid: (payment: LedgerPayment) => void;
  /** Hides the student column when the ledger already belongs to one student. */
  hideStudent?: boolean;
}

const formatDay = (value: string) => format(new Date(`${value.slice(0, 10)}T00:00:00`), 'dd MMM yyyy', { locale: es });

/** Wide table: scrolls horizontally on small screens. */
export const LedgerTable = ({ payments, staffNames, onVoid, hideStudent }: LedgerTableProps) => (
  <div className="overflow-x-auto rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          {!hideStudent && <TableHead>Estudiante</TableHead>}
          <TableHead>Curso</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead>Medio</TableHead>
          <TableHead>Referencia</TableHead>
          <TableHead>Registrado por</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="w-24">
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((p) => {
          const voided = !!p.voided_at;
          const strike = voided ? 'line-through text-muted-foreground' : '';
          return (
            <TableRow key={p.id}>
              <TableCell className={`whitespace-nowrap ${strike}`}>{formatDay(p.paid_at)}</TableCell>
              {!hideStudent && (
                <TableCell className={`font-medium ${strike}`}>{p.student_name ?? 'Estudiante eliminado'}</TableCell>
              )}
              <TableCell className={strike}>{p.course_title ?? 'Curso eliminado'}</TableCell>
              <TableCell className={`text-right tabular-nums ${strike}`}>{formatCOP(p.amount)}</TableCell>
              <TableCell className={strike}>{paymentMethodLabels[p.method]}</TableCell>
              <TableCell className={strike}>{p.reference ?? '—'}</TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {(p.created_by && staffNames[p.created_by]) || '—'}
                <br />
                {format(new Date(p.created_at), 'dd/MM/yyyy HH:mm')}
              </TableCell>
              <TableCell>
                {voided ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0} className="cursor-help rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        Anulado
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Motivo: {p.void_reason || 'Sin motivo'}</p>
                      {p.voided_by && staffNames[p.voided_by] && <p>Por {staffNames[p.voided_by]}</p>}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Vigente</span>
                )}
              </TableCell>
              <TableCell>
                {!voided && (
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onVoid(p)}>
                    <Ban className="mr-1 h-3 w-3" /> Anular
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);
