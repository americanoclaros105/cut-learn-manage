import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CalendarPlus, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AttendanceMatrix } from '@/components/admin/operations/AttendanceMatrix';
import { NewSessionDialog } from '@/components/admin/operations/NewSessionDialog';
import { RollCall } from '@/components/admin/operations/RollCall';
import { SessionsList } from '@/components/admin/operations/SessionsList';
import {
  useCreateSession,
  useSaveAttendance,
  type AttendanceRecord,
  type ClassSession,
} from '@/hooks/useClassSessions';
import { isRollCallDirty, markAll, rollCallToRows, type RollCallDraft, type RosterRow } from '@/lib/roster';
import type { AttendanceStatus } from '@/types';

interface AttendanceTabProps {
  courseId: string;
  /** Roster rows without cancelled enrollments. */
  rows: RosterRow[];
  sessions: ClassSession[];
  records: AttendanceRecord[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

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

export const AttendanceTab = ({ courseId, rows, sessions, records, loading, error, onRetry }: AttendanceTabProps) => {
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'matrix'>('list');
  const [newOpen, setNewOpen] = useState(false);
  const createSession = useCreateSession();

  const openSession = sessions.find((s) => s.id === openSessionId) ?? null;

  if (openSession) {
    return (
      <RollCallPanel
        key={openSession.id}
        courseId={courseId}
        session={openSession}
        rows={rows}
        records={records}
        onBack={() => setOpenSessionId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border p-0.5" role="group" aria-label="Vista de asistencia">
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="sm" aria-pressed={view === 'list'} onClick={() => setView('list')}>
            <List className="mr-1 h-4 w-4" /> Clases
          </Button>
          <Button variant={view === 'matrix' ? 'secondary' : 'ghost'} size="sm" aria-pressed={view === 'matrix'} onClick={() => setView('matrix')}>
            <LayoutGrid className="mr-1 h-4 w-4" /> Matriz
          </Button>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <CalendarPlus className="mr-2 h-4 w-4" /> Nueva clase
        </Button>
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
          <p className="mb-4 text-sm text-muted-foreground">Crea la primera clase presencial para tomar asistencia.</p>
          <Button onClick={() => setNewOpen(true)}>
            <CalendarPlus className="mr-2 h-4 w-4" /> Nueva clase
          </Button>
        </div>
      ) : view === 'list' ? (
        <SessionsList sessions={sessions} records={records} onOpen={(s) => setOpenSessionId(s.id)} />
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No hay estudiantes inscritos.</p>
      ) : (
        <AttendanceMatrix rows={rows} sessions={sessions} records={records} />
      )}

      <NewSessionDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        submitting={createSession.isPending}
        onSubmit={async (values) => {
          try {
            await createSession.mutateAsync({ courseId, ...values });
            toast.success('Clase creada');
            setNewOpen(false);
          } catch (e) {
            console.error(e);
            toast.error('No se pudo crear la clase');
          }
        }}
      />
    </div>
  );
};
