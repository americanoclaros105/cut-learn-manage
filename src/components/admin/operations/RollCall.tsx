import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, CheckCheck, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { attendanceStatusLabels, attendanceStats } from '@/lib/operations';
import type { RollCallDraft } from '@/lib/roster';
import type { RosterRow } from '@/lib/roster';
import type { ClassSession } from '@/hooks/useClassSessions';
import type { AttendanceStatus } from '@/types';
import { attendanceOrder, attendanceStyles } from './attendanceStyles';
import { EnrollmentStatusBadge } from './EnrollmentStatusBadge';

interface RollCallProps {
  session: ClassSession;
  rows: RosterRow[];
  draft: RollCallDraft;
  dirty: boolean;
  saving: boolean;
  onChange: (userId: string, patch: Partial<{ status: AttendanceStatus; notes: string }>) => void;
  onMarkAllPresent: () => void;
  onSave: () => void;
  onBack: () => void;
}

export const RollCall = ({ session, rows, draft, dirty, saving, onChange, onMarkAllPresent, onSave, onBack }: RollCallProps) => {
  const stats = attendanceStats(rows.map((r) => draft[r.student.id]).filter((e): e is NonNullable<typeof e> => !!e));
  const unmarked = rows.filter((r) => !draft[r.student.id]).length;

  return (
    <section aria-label="Toma de asistencia" className="space-y-4">
      <div className="sticky top-0 z-10 -mx-1 space-y-3 border-b bg-background/95 px-1 pb-3 pt-1 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Clases
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold capitalize">
              {format(new Date(session.starts_at), "EEEE d 'de' MMMM, h:mm a", { locale: es })}
            </h2>
            {session.topic && <p className="truncate text-sm text-muted-foreground">{session.topic}</p>}
          </div>
          {dirty && (
            <span role="status" className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Cambios sin guardar
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onMarkAllPresent} disabled={rows.length === 0}>
            <CheckCheck className="mr-2 h-4 w-4" /> Marcar todos presentes
          </Button>
          <Button onClick={onSave} disabled={!dirty || saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar lista
          </Button>
          <ul className="ml-auto flex flex-wrap gap-1" aria-label="Contadores">
            {attendanceOrder.map((status) => {
              const Icon = attendanceStyles[status].icon;
              return (
                <li key={status} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${attendanceStyles[status].tone}`}>
                  <Icon className="h-3 w-3" aria-hidden />
                  {attendanceStatusLabels[status]}: {stats[status]}
                </li>
              );
            })}
            <li className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              Sin marcar: {unmarked}
            </li>
          </ul>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No hay estudiantes inscritos en este curso.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const userId = row.student.id;
            const entry = draft[userId];
            const notPaid = row.enrollment.status !== 'active';
            return (
              <li key={row.enrollment.id} className="rounded-lg border bg-card p-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="min-w-0 md:w-64">
                    <p className="truncate text-base font-medium">{row.student.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <EnrollmentStatusBadge status={row.enrollment.status} />
                      {notPaid && row.enrollment.status === 'pending' && (
                        <span className="text-xs font-medium text-amber-700">Sin pago completo</span>
                      )}
                    </div>
                  </div>

                  <ToggleGroup
                    type="single"
                    value={entry?.status ?? ''}
                    onValueChange={(value) => value && onChange(userId, { status: value as AttendanceStatus })}
                    aria-label={`Asistencia de ${row.student.name}`}
                    className="grid flex-1 grid-cols-4 gap-1"
                  >
                    {attendanceOrder.map((status) => {
                      const Icon = attendanceStyles[status].icon;
                      return (
                        <ToggleGroupItem
                          key={status}
                          value={status}
                          aria-label={attendanceStatusLabels[status]}
                          className={`h-14 flex-col gap-0.5 border px-1 text-xs font-medium data-[state=on]:shadow-inner ${
                            entry?.status === status ? attendanceStyles[status].selected : 'bg-background'
                          }`}
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                          {attendanceStatusLabels[status]}
                        </ToggleGroupItem>
                      );
                    })}
                  </ToggleGroup>

                  <Input
                    value={entry?.notes ?? ''}
                    onChange={(e) => entry && onChange(userId, { notes: e.target.value })}
                    disabled={!entry}
                    placeholder={entry ? 'Nota (opcional)' : 'Marca primero'}
                    aria-label={`Nota para ${row.student.name}`}
                    className="md:w-48"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
