import { ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AgendaSession } from '@/hooks/useAgenda';
import { formatClock } from '@/lib/agenda';
import { GroupDot } from '@/components/admin/groups/GroupDot';

interface TodayStripProps {
  /** Scheduled (not cancelled) classes of today, in time order. */
  sessions: AgendaSession[];
  loading?: boolean;
  onOpen: (session: AgendaSession) => void;
}

/** "Clases de hoy": every class of the day with a one-tap shortcut to its roll call. */
export const TodayStrip = ({ sessions, loading, onOpen }: TodayStripProps) => (
  <section aria-label="Clases de hoy" className="rounded-lg border border-primary/30 bg-primary/5 p-3 md:p-4">
    <h2 className="mb-2 text-sm font-semibold text-primary">Clases de hoy</h2>
    {loading ? (
      <p className="text-sm text-muted-foreground">Cargando…</p>
    ) : sessions.length === 0 ? (
      <p className="text-sm text-muted-foreground">Hoy no hay clases programadas.</p>
    ) : (
      <ul className="flex gap-3 overflow-x-auto pb-1">
        {sessions.map((s) => (
          <li key={s.id} className="flex min-w-[220px] flex-1 items-center justify-between gap-3 rounded-md border bg-card p-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <GroupDot color={s.group?.color ?? null} />
                <span className="truncate">{s.course_title}</span>
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {formatClock(new Date(s.starts_at))} · {s.group?.name ?? 'Sin grupo'}
              </p>
            </div>
            <Button size="sm" variant={s.rollCallTaken ? 'outline' : 'default'} onClick={() => onOpen(s)}>
              <ClipboardCheck className="mr-1 h-4 w-4" aria-hidden /> {s.rollCallTaken ? 'Revisar lista' : 'Tomar lista'}
            </Button>
          </li>
        ))}
      </ul>
    )}
  </section>
);
