import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Banknote, Ban, CircleCheck, Edit, Eye, MessageCircle, MoreHorizontal, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCOP } from '@/lib/operations';
import type { RosterRow } from '@/lib/roster';
import { openWhatsAppMessage } from '@/lib/whatsapp';
import { EnrollmentStatusBadge } from './EnrollmentStatusBadge';

export type RosterAction = 'pay' | 'payments' | 'price' | 'authorize' | 'suspend' | 'reactivate' | 'cancel';

interface RosterTableProps {
  rows: RosterRow[];
  onAction: (action: RosterAction, row: RosterRow) => void;
}

const formatDay = (value: string | null): string =>
  value ? format(new Date(`${value.slice(0, 10)}T00:00:00`), 'dd MMM yyyy', { locale: es }) : 'Sin pagos';

const PhoneLink = ({ row }: { row: RosterRow }) =>
  row.student.phone ? (
    <button
      type="button"
      onClick={() => openWhatsAppMessage(row.student.phone as string, `Hola ${row.student.name}!`)}
      className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline"
      aria-label={`Escribir por WhatsApp a ${row.student.name}`}
    >
      <MessageCircle className="h-3 w-3" aria-hidden />
      {row.student.phone}
    </button>
  ) : (
    <span className="text-xs text-muted-foreground">Sin teléfono</span>
  );

const Balance = ({ row }: { row: RosterRow }) => {
  const pct = row.agreed > 0 ? Math.min(100, Math.round((row.paid / row.agreed) * 100)) : 100;
  return (
    <div className="min-w-[120px] space-y-1">
      <Progress value={pct} className="h-2" aria-label={`Pagado ${pct}%`} />
      <p className="text-xs tabular-nums text-muted-foreground">
        {row.balance > 0 ? `Debe ${formatCOP(row.balance)}` : 'Al día'} · {pct}%
      </p>
    </div>
  );
};

const attendanceLabel = (row: RosterRow): string =>
  row.attendance.present + row.attendance.late + row.attendance.absent === 0
    ? '—'
    : `${Math.round(row.attendance.rate * 100)}%`;

const RowActions = ({ row, onAction }: { row: RosterRow; onAction: RosterTableProps['onAction'] }) => {
  const status = row.enrollment.status;
  const cancelled = status === 'cancelled';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Acciones para ${row.student.name}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {!cancelled && (
          <DropdownMenuItem onSelect={() => onAction('pay', row)}>
            <Banknote className="mr-2 h-4 w-4" /> Registrar pago
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => onAction('payments', row)}>
          <Eye className="mr-2 h-4 w-4" /> Ver pagos
        </DropdownMenuItem>
        {!cancelled && (
          <DropdownMenuItem onSelect={() => onAction('price', row)}>
            <Edit className="mr-2 h-4 w-4" /> Editar valor acordado
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {(status === 'pending' || status === 'suspended') && (
          <DropdownMenuItem onSelect={() => onAction('authorize', row)}>
            <CircleCheck className="mr-2 h-4 w-4" /> Autorizar acceso manual
          </DropdownMenuItem>
        )}
        {(status === 'active' || status === 'pending') && (
          <DropdownMenuItem onSelect={() => onAction('suspend', row)}>
            <Pause className="mr-2 h-4 w-4" /> Suspender
          </DropdownMenuItem>
        )}
        {(status === 'suspended' || cancelled) && (
          <DropdownMenuItem onSelect={() => onAction('reactivate', row)}>
            <Play className="mr-2 h-4 w-4" /> Reactivar
          </DropdownMenuItem>
        )}
        {!cancelled && (
          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onAction('cancel', row)}>
            <Ban className="mr-2 h-4 w-4" /> Cancelar inscripción
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/** Desktop table plus mobile cards over the same rows. */
export const RosterTable = ({ rows, onAction }: RosterTableProps) => (
  <>
    <div className="hidden md:block rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Estudiante</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Valor acordado</TableHead>
            <TableHead className="text-right">Pagado</TableHead>
            <TableHead>Saldo</TableHead>
            <TableHead className="text-right">Asistencia</TableHead>
            <TableHead>Último pago</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.enrollment.id}>
              <TableCell>
                <p className="font-medium">{row.student.name}</p>
                <PhoneLink row={row} />
              </TableCell>
              <TableCell>
                <EnrollmentStatusBadge status={row.enrollment.status} />
                {row.enrollment.activated_by === 'manual' && (
                  <p className="mt-1 text-xs text-muted-foreground">Autorizado manualmente</p>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatCOP(row.agreed)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCOP(row.paid)}</TableCell>
              <TableCell>
                <Balance row={row} />
              </TableCell>
              <TableCell className="text-right tabular-nums">{attendanceLabel(row)}</TableCell>
              <TableCell className="whitespace-nowrap text-sm">{formatDay(row.lastPaymentAt)}</TableCell>
              <TableCell>
                <RowActions row={row} onAction={onAction} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    <div className="grid gap-3 md:hidden">
      {rows.map((row) => (
        <Card key={row.enrollment.id}>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{row.student.name}</p>
                <PhoneLink row={row} />
              </div>
              <div className="flex items-center gap-1">
                <EnrollmentStatusBadge status={row.enrollment.status} />
                <RowActions row={row} onAction={onAction} />
              </div>
            </div>
            <Balance row={row} />
            <dl className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <dt className="text-muted-foreground">Acordado</dt>
                <dd className="font-medium tabular-nums">{formatCOP(row.agreed)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pagado</dt>
                <dd className="font-medium tabular-nums">{formatCOP(row.paid)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Asistencia</dt>
                <dd className="font-medium tabular-nums">{attendanceLabel(row)}</dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">Último pago: {formatDay(row.lastPaymentAt)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </>
);
