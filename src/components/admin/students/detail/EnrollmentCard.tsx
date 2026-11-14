import { Link } from 'react-router-dom';
import { BookOpen, CreditCard, MoreVertical, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { EnrollmentStatusBadge } from '@/components/admin/operations/EnrollmentStatusBadge';
import { effectiveAccess, formatCOP } from '@/lib/operations';
import type { StudentEnrollmentRow } from '@/lib/studentDetail';
import { formatDate, formatPercent } from './format';

export type EnrollmentAction = 'pay' | 'price' | 'dates' | 'authorize' | 'suspend' | 'reactivate' | 'cancel';

interface EnrollmentCardProps {
  row: StudentEnrollmentRow;
  onAction: (action: EnrollmentAction, row: StudentEnrollmentRow) => void;
}

const timeBadge = { not_started: 'Aún no inicia', expired: 'Acceso vencido' } as const;

const Stat = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
  <div>
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className={`font-semibold tabular-nums ${tone ?? ''}`}>{value}</dd>
  </div>
);

/** One enrollment: money, access window, lesson progress, attendance and its actions. */
export const EnrollmentCard = ({ row, onAction }: EnrollmentCardProps) => {
  const { enrollment, course } = row;
  const cancelled = enrollment.status === 'cancelled';
  const access = effectiveAccess(enrollment);
  const timeNote = access === 'not_started' || access === 'expired' ? timeBadge[access] : null;
  const owed = Math.max(0, row.balance);
  const paidPct = row.agreed > 0 ? Math.min(100, Math.round((row.paid / row.agreed) * 100)) : 100;

  return (
    <Card className={cancelled ? 'opacity-75' : undefined}>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
            {course?.cover_image ? (
              <img src={course.cover_image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary/40" aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{course?.title ?? 'Curso no disponible'}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <EnrollmentStatusBadge status={enrollment.status} />
              {timeNote && (
                <Badge variant="outline" className="border-orange-300 text-orange-700">
                  {timeNote}
                </Badge>
              )}
              {enrollment.activated_by === 'manual' && enrollment.status === 'active' && (
                <Badge variant="outline">Autorizado manualmente</Badge>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!cancelled && owed > 0 && (
              <Button size="sm" onClick={() => onAction('pay', row)}>
                <CreditCard className="mr-1 h-4 w-4" aria-hidden /> Registrar pago
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Más acciones de ${course?.title ?? 'la inscripción'}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!cancelled && (
                  <>
                    <DropdownMenuItem onClick={() => onAction('pay', row)}>Registrar pago</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('price', row)}>Editar valor acordado</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('dates', row)}>Editar fechas de acceso</DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {enrollment.status === 'pending' && (
                  <DropdownMenuItem onClick={() => onAction('authorize', row)}>Autorizar acceso manual</DropdownMenuItem>
                )}
                {(enrollment.status === 'pending' || enrollment.status === 'active') && (
                  <DropdownMenuItem onClick={() => onAction('suspend', row)}>Suspender</DropdownMenuItem>
                )}
                {(enrollment.status === 'suspended' || cancelled) && (
                  <DropdownMenuItem onClick={() => onAction('reactivate', row)}>Reactivar</DropdownMenuItem>
                )}
                {!cancelled && (
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onAction('cancel', row)}>
                    Cancelar inscripción
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={`/admin/cursos/${enrollment.course_id}/grupos`}>
                    <Users className="mr-2 h-4 w-4" aria-hidden /> Ver grupos del curso
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-3 text-sm">
          <Stat label="Acordado" value={formatCOP(row.agreed)} />
          <Stat label="Pagado" value={formatCOP(row.paid)} tone="text-green-700" />
          <Stat label="Saldo" value={formatCOP(owed)} tone={owed > 0 ? 'text-destructive' : undefined} />
        </dl>

        <div>
          <Progress value={paidPct} className="h-2" aria-label={`Pagado ${paidPct}% del valor acordado`} />
          <p className="mt-1 text-xs text-muted-foreground">
            {paidPct}% pagado · {row.paymentCount === 0 ? 'sin pagos' : `último pago ${formatDate(row.lastPaymentAt)}`}
          </p>
        </div>

        <dl className="grid gap-3 border-t pt-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Acceso</dt>
            <dd>
              {formatDate(enrollment.enabled_from, 'Desde ya')} → {formatDate(enrollment.expires_at, 'sin vencimiento')}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Progreso de lecciones</dt>
            <dd className="flex items-center gap-2">
              <Progress value={row.lessonPct} className="h-2 w-20" aria-label={`Progreso de lecciones ${row.lessonPct}%`} />
              <span className="tabular-nums">{row.course ? `${row.lessonPct}%` : '—'}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Asistencia</dt>
            <dd>{row.attendance.total === 0 ? 'Sin registros' : formatPercent(row.attendance.rate)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
};
