import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CalendarDays, CalendarPlus, LayoutGrid, List, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CancelSessionDialog } from '@/components/admin/groups/CancelSessionDialog';
import { GenerateCalendarDialog } from '@/components/admin/groups/GenerateCalendarDialog';
import { SessionsCalendar } from '@/components/admin/groups/SessionsCalendar';
import { AttendanceMatrix } from '@/components/admin/operations/AttendanceMatrix';
import { NewSessionDialog } from '@/components/admin/operations/NewSessionDialog';
import { RollCall } from '@/components/admin/operations/RollCall';
import { SessionsList } from '@/components/admin/operations/SessionsList';
import { useGenerateGroupSessions } from '@/hooks/useCourseGroups';
import {
  useCreateSession,
  useSaveAttendance,
  useSetSessionCancelled,
  type AttendanceRecord,
  type ClassSession,
} from '@/hooks/useClassSessions';
import { schedulePreview } from '@/lib/groupForm';
import { nextSession } from '@/lib/groupViews';
import { groupErrorMessage } from '@/lib/groups';
import { isRollCallDirty, markAll, rollCallToRows, type RollCallDraft, type RosterRow } from '@/lib/roster';
import type { AttendanceStatus, CourseGroupWithStats } from '@/types';

interface AttendanceTabProps {
  courseId: string;
  /** Roster rows without cancelled enrollments. */
  rows: RosterRow[];
  sessions: ClassSession[];
  records: AttendanceRecord[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  /** Group whose calendar this is; enables generate, extra class and cancel. Absent = classes without group. */
  group?: CourseGroupWithStats | null;
  /** Controlled so a "Tomar lista de hoy" shortcut outside the tab can open a class. */
  openSessionId: string | null;
  onOpenSession: (sessionId: string | null) => void;
}

type View = 'calendar' | 'list' | 'matrix';

const draftFromRecords = (sessionId: string, records: AttendanceRecord[]): RollCallDraft => {
  const draft: RollCallDraft = {};
  for (const r of records) if (r.session_id === sessionId) draft[r.user_id] = { status: r.status, notes: r.notes ?? '' };
  return draft;
};

interface RollCallPanelProps {
  courseId: string;
  session: ClassSession;
  rows: RosterRow[];
  records: AttendanceRecord[];
  onBack: () => void;
}

/** Keyed by session id from the parent, so the draft resets when another session opens. */
const RollCallPanel = ({ courseId, session, rows, records, onBack }: RollCallPanelProps) => {
  const saved = useMemo(() => draftFromRecords(session.id, records), [session.id, records]);
  const [draft, setDraft] = useState<RollCallDraft>(saved);
  const saveAttendance = useSaveAttendance();
  const dirty = isRollCallDirty(saved, draft);

  const handleChange = (userId: string, patch: Partial<{ status: AttendanceStatus; notes: string }>) =>
    setDraft((d) => ({
      ...d,
      [userId]: { status: patch.status ?? d[userId]?.status ?? 'present', notes: patch.notes ?? d[userId]?.notes ?? '' },
    }));

  const handleSave = async () => {
    try {
      await saveAttendance.mutateAsync({ courseId, rows: rollCallToRows(session.id, draft) });
      toast.success('Lista guardada');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo guardar la lista. Tus cambios siguen aquí, inténtalo de nuevo.');
    }
  };

  const handleBack = () => {
    if (dirty && !window.confirm('Hay cambios sin guardar. ¿Salir sin guardar la lista?')) return;
    onBack();
  };

  return (
    <RollCall
      session={session}
      rows={rows}
      draft={draft}
      dirty={dirty}
      saving={saveAttendance.isPending}
      onChange={handleChange}
      onMarkAllPresent={() => setDraft((d) => markAll(rows.map((r) => r.student.id), 'present', d))}
      onSave={handleSave}
      onBack={handleBack}
    />
  );
};

export const AttendanceTab = ({
  courseId,
  rows,
  sessions,
  records,
  loading,
  error,
  onRetry,
  group = null,
  openSessionId,
  onOpenSession,
}: AttendanceTabProps) => {
  const [view, setView] = useState<View>(group ? 'calendar' : 'list');
  const [newOpen, setNewOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<ClassSession | null>(null);
  const createSession = useCreateSession();
  const generateSessions = useGenerateGroupSessions();
  const setCancelled = useSetSessionCancelled();

  const openSession = sessions.find((s) => s.id === openSessionId) ?? null;
  const live = useMemo(() => sessions.filter((s) => s.status === 'scheduled'), [sessions]);
  // Open the calendar on the month of the next class, or of the latest one when the group is over.
  const focus = nextSession(live, new Date())?.starts_at ?? sessions[0]?.starts_at;
  const expected = group ? schedulePreview(group.start_date, group.end_date, group.schedules).count : 0;

  const restore = async (session: ClassSession) => {
    try {
      await setCancelled.mutateAsync({ sessionId: session.id, courseId, cancelled: false });
      toast.success('Clase restaurada');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo restaurar la clase', { description: groupErrorMessage(e) });
    }
  };

  if (openSession) {
    return (
      <RollCallPanel
        key={openSession.id}
        courseId={courseId}
        session={openSession}
        rows={rows}
        records={records}
        onBack={() => onOpenSession(null)}
      />
    );
  }

  const openRollCall = (s: ClassSession) => onOpenSession(s.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border p-0.5" role="group" aria-label="Vista de asistencia">
          {group && (
            <Button variant={view === 'calendar' ? 'secondary' : 'ghost'} size="sm" aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}>
              <CalendarDays className="mr-1 h-4 w-4" /> Calendario
            </Button>
          )}
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="sm" aria-pressed={view === 'list'} onClick={() => setView('list')}>
            <List className="mr-1 h-4 w-4" /> Clases
          </Button>
          <Button variant={view === 'matrix' ? 'secondary' : 'ghost'} size="sm" aria-pressed={view === 'matrix'} onClick={() => setView('matrix')}>
            <LayoutGrid className="mr-1 h-4 w-4" /> Matriz
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {group && (
            <Button variant="outline" onClick={() => setGenerateOpen(true)}>
              <Wand2 className="mr-2 h-4 w-4" /> Generar calendario
            </Button>
          )}
          <Button onClick={() => setNewOpen(true)}>
            <CalendarPlus className="mr-2 h-4 w-4" /> {group ? 'Agregar clase extra' : 'Nueva clase'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="mb-3 text-sm text-destructive">No se pudieron cargar las clases.</p>
          <Button variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-medium">Aún no hay clases programadas</p>
          <p className="mb-4 text-sm text-muted-foreground">
            {group
              ? 'Genera el calendario a partir del horario semanal del grupo, o agrega una clase suelta.'
              : 'Crea la primera clase presencial para tomar asistencia.'}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {group && (
              <Button onClick={() => setGenerateOpen(true)}>
                <Wand2 className="mr-2 h-4 w-4" /> Generar calendario
              </Button>
            )}
            <Button variant={group ? 'outline' : 'default'} onClick={() => setNewOpen(true)}>
              <CalendarPlus className="mr-2 h-4 w-4" /> {group ? 'Agregar clase extra' : 'Nueva clase'}
            </Button>
          </div>
        </div>
      ) : view === 'calendar' && group ? (
        <SessionsCalendar sessions={sessions} records={records} initialMonth={focus ? new Date(focus) : undefined} onOpen={openRollCall} />
      ) : view === 'matrix' ? (
        rows.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No hay estudiantes inscritos.</p>
        ) : (
          <AttendanceMatrix rows={rows} sessions={live} records={records} />
        )
      ) : (
        <SessionsList
          sessions={sessions}
          records={records}
          onOpen={openRollCall}
          onCancel={group ? setCancelTarget : undefined}
          onRestore={group ? restore : undefined}
        />
      )}

      <NewSessionDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        submitting={createSession.isPending}
        defaultLocation={group?.location ?? ''}
        onSubmit={async (values) => {
          try {
            await createSession.mutateAsync({ courseId, ...values, groupId: group?.id ?? null });
            toast.success('Clase creada');
            setNewOpen(false);
          } catch (e) {
            console.error(e);
            toast.error('No se pudo crear la clase', { description: groupErrorMessage(e) });
          }
        }}
      />

      {group && (
        <GenerateCalendarDialog
          open={generateOpen}
          onOpenChange={setGenerateOpen}
          expectedClasses={expected}
          hasSchedule={group.schedules.length > 0}
          submitting={generateSessions.isPending}
          onConfirm={async (replaceFuture) => {
            try {
              const created = await generateSessions.mutateAsync({ groupId: group.id, courseId, replaceFuture });
              toast.success(
                created === 0
                  ? 'El calendario ya estaba completo: no faltaba ninguna clase.'
                  : created === 1
                    ? 'Se creó 1 clase.'
                    : `Se crearon ${created} clases.`,
              );
              setGenerateOpen(false);
            } catch (e) {
              console.error(e);
              toast.error('No se pudo generar el calendario', { description: groupErrorMessage(e) });
            }
          }}
        />
      )}

      <CancelSessionDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        startsAt={cancelTarget?.starts_at ?? null}
        submitting={setCancelled.isPending}
        onConfirm={async (reason) => {
          if (!cancelTarget) return;
          try {
            await setCancelled.mutateAsync({ sessionId: cancelTarget.id, courseId, cancelled: true, reason });
            toast.success('Clase cancelada');
            setCancelTarget(null);
          } catch (e) {
            console.error(e);
            toast.error('No se pudo cancelar la clase', { description: groupErrorMessage(e) });
          }
        }}
      />
    </div>
  );
};
