import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, startOfDay } from 'date-fns';
import { AgendaGrid } from '@/components/admin/agenda/AgendaGrid';
import { AgendaList } from '@/components/admin/agenda/AgendaList';
import { AgendaToolbar } from '@/components/admin/agenda/AgendaToolbar';
import { TodayStrip } from '@/components/admin/agenda/TodayStrip';
import { useAgendaSessions, useGroupOptions, type AgendaSession } from '@/hooks/useAgenda';
import { useCourses } from '@/hooks/useCourses';
import {
  agendaRange,
  LIST_DAYS,
  rangeLabel,
  sessionHref,
  sessionsOfDay,
  shiftAnchor,
  weekDays,
  type AgendaView,
} from '@/lib/agenda';

const MINUTE = 60_000;

/** Agenda: every class of every course and group, by week, day or as an upcoming list. */
export const Agenda = () => {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const [view, setView] = useState<AgendaView>('week');
  const [anchor, setAnchor] = useState(() => new Date());
  const [courseId, setCourseId] = useState('all');
  const [groupId, setGroupId] = useState('all');
  const [showCancelled, setShowCancelled] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), MINUTE);
    return () => window.clearInterval(timer);
  }, []);

  const range = useMemo(() => agendaRange(view, anchor), [view, anchor]);
  const todayRange = useMemo(() => agendaRange('day', now), [now]);

  const courses = useCourses();
  const groupOptions = useGroupOptions();
  const sessions = useAgendaSessions(range, { courseId, groupId, showCancelled });
  const today = useAgendaSessions(todayRange);

  const todayClasses = useMemo(
    () => sessionsOfDay(today.data ?? [], now).filter((s) => s.status === 'scheduled'),
    [today.data, now],
  );

  const courseOptions = useMemo(() => (courses.data ?? []).map((c) => ({ id: c.id, label: c.title })), [courses.data]);
  const groupFilterOptions = useMemo(
    () =>
      (groupOptions.data ?? [])
        .filter((g) => courseId === 'all' || g.course_id === courseId)
        .map((g) => ({ id: g.id, label: g.name })),
    [groupOptions.data, courseId],
  );

  const days = useMemo(() => {
    if (view === 'week') return weekDays(anchor);
    if (view === 'day') return [startOfDay(anchor)];
    const first = startOfDay(anchor);
    return Array.from({ length: LIST_DAYS }, (_, i) => addDays(first, i));
  }, [view, anchor]);

  const open = (session: AgendaSession) => navigate(sessionHref(session));
  const list = sessions.data ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold">Agenda</h1>
        <p className="text-muted-foreground">Las clases de todos los cursos y grupos en un solo calendario.</p>
      </div>

      <TodayStrip sessions={todayClasses} loading={today.isLoading} onOpen={open} />

      <AgendaToolbar
        title={rangeLabel(view, anchor)}
        view={view}
        courseId={courseId}
        groupId={groupId}
        showCancelled={showCancelled}
        courses={courseOptions}
        groups={groupFilterOptions}
        onView={setView}
        onPrev={() => setAnchor((a) => shiftAnchor(view, a, -1))}
        onNext={() => setAnchor((a) => shiftAnchor(view, a, 1))}
        onToday={() => setAnchor(new Date())}
        onCourse={(id) => {
          setCourseId(id);
          setGroupId('all');
        }}
        onGroup={setGroupId}
        onShowCancelled={setShowCancelled}
      />

      {sessions.isError ? (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          No se pudo cargar la agenda.{' '}
          <button type="button" className="underline" onClick={() => void sessions.refetch()}>
            Reintentar
          </button>
        </div>
      ) : sessions.isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Cargando clases…</p>
      ) : view === 'list' ? (
        <AgendaList days={days} sessions={list} now={now} hideEmptyDays onOpen={open} />
      ) : (
        <>
          <div className="hidden md:block">
            <AgendaGrid days={days} sessions={list} now={now} onOpen={open} />
          </div>
          <AgendaList className="md:hidden" days={days} sessions={list} now={now} onOpen={open} />
        </>
      )}
    </div>
  );
};
