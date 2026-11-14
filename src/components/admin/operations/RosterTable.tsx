import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRightLeft, Banknote, Ban, CircleCheck, Edit, Eye, MessageCircle, MoreHorizontal, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { GroupDot } from '../groups/GroupDot';
import { EnrollmentStatusBadge } from './EnrollmentStatusBadge';

export type RosterAction = 'pay' | 'payments' | 'price' | 'transfer' | 'authorize' | 'suspend' | 'reactivate' | 'cancel';

export interface RosterSelection {
  selected: Set<string>;
  onToggle: (enrollmentId: string) => void;
  onToggleAll: (enrollmentIds: string[], checked: boolean) => void;
}

interface RosterTableProps {
  rows: RosterRow[];
  onAction: (action: RosterAction, row: RosterRow) => void;
  /** Group names by id. When given, a Grupo column and the transfer action appear. */
  groups?: Record<string, { name: string; color: string | null }>;
  /** Row checkboxes for bulk actions. */
  selection?: RosterSelection;
}

const GroupLabel = ({ row, groups }: { row: RosterRow; groups: NonNullable<RosterTableProps['groups']> }) => {
  const group = row.enrollment.group_id ? groups[row.enrollment.group_id] : undefined;
  return group ? (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <GroupDot color={group.color} /> {group.name}
    </span>
  ) : (
    <span className="text-sm text-muted-foreground">Sin grupo</span>
  );
};

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

const RowActions = ({ row, onAction, canTransfer }: { row: RosterRow; onAction: RosterTableProps['onAction']; canTransfer: boolean }) => {
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
        {!cancelled && canTransfer && (
          <DropdownMenuItem onSelect={() => onAction('transfer', row)}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            {row.enrollment.group_id ? 'Trasladar a otro grupo' : 'Asignar a un grupo'}
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
export const RosterTable = ({ rows, onAction, groups, selection }: RosterTableProps) => {
  const allSelected = !!selection && rows.length > 0 && rows.every((r) => selection.selected.has(r.enrollment.id));
  const canTransfer = !!groups;
  const rowCheckbox = (row: RosterRow) =>
    selection && (
      <Checkbox
        checked={selection.selected.has(row.enrollment.id)}
        onCheckedChange={() => selection.onToggle(row.enrollment.id)}
        aria-label={`Seleccionar a ${row.student.name}`}
      />
    );
  return (
    <>
      <div className="hidden md:block rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {selection && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => selection.onToggleAll(rows.map((r) => r.enrollment.id), checked === true)}
                    aria-label="Seleccionar todos los estudiantes visibles"
                  />
                </TableHead>
              )}
              <TableHead>Estudiante</TableHead>
              {groups && <TableHead>Grupo</TableHead>}
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
              <TableRow key={row.enrollment.id} data-state={selection?.selected.has(row.enrollment.id) ? 'selected' : undefined}>
                {selection && <TableCell>{rowCheckbox(row)}</TableCell>}
                <TableCell>
                  <p className="font-medium">{row.student.name}</p>
                  <PhoneLink row={row} />
                </TableCell>
                {groups && (
                  <TableCell>
                    <GroupLabel row={row} groups={groups} />
                  </TableCell>
                )}
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
                  <RowActions row={row} onAction={onAction} canTransfer={canTransfer} />
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
                <div className="flex items-start gap-3">
                  {rowCheckbox(row)}
                  <div>
                    <p className="font-medium">{row.student.name}</p>
                    <PhoneLink row={row} />
                    {groups && <GroupLabel row={row} groups={groups} />}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <EnrollmentStatusBadge status={row.enrollment.status} />
                  <RowActions row={row} onAction={onAction} canTransfer={canTransfer} />
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
};
