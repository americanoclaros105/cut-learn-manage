import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BookOpen, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GroupCard } from '@/components/admin/groups/GroupCard';
import { GroupsBreadcrumb } from '@/components/admin/groups/GroupsBreadcrumb';
import { GroupsFilterBar } from '@/components/admin/groups/GroupsFilterBar';
import { UnassignedGroupCard } from '@/components/admin/groups/UnassignedGroupCard';
import { RosterKpiChips } from '@/components/admin/operations/RosterKpiChips';
import { useCourses } from '@/hooks/useCourses';
import { useCourseGroups } from '@/hooks/useCourseGroups';
import { useCourseOperations } from '@/hooks/useCourseOperations';
import { filterGroups, groupPhaseCounts, localDay, nextSession, rowsForGroup, unassignedCount, type GroupPhaseFilter } from '@/lib/groupViews';
import { groupPhase } from '@/lib/groups';
import { rosterKpis } from '@/lib/roster';
import { AttendanceTab } from '../course-group/AttendanceTab';
import { RosterTab } from '../course-group/RosterTab';

type HubTab = 'grupos' | 'inscritos' | 'sin-grupo';

/** Course "Grupos" hub: cohorts as cards, plus the course-wide roster and legacy classes without group. */
export const GroupsHub = () => {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [phase, setPhase] = useState<GroupPhaseFilter>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);

  const courses = useCourses();
  const groupsQuery = useCourseGroups(courseId);
  const { roster, sessionsQuery, rows, sessions, records } = useCourseOperations(courseId);

  const course = courses.data?.find((c) => c.id === courseId);
  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);
  const today = localDay(new Date());

  const requestedTab = params.get('tab');
  const tab: HubTab = requestedTab === 'inscritos' || requestedTab === 'sin-grupo' ? requestedTab : 'grupos';
  const groupFilter = params.get('grupo') ?? 'all';

  const setTab = (next: string) =>
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        if (next === 'grupos') out.delete('tab');
        else out.set('tab', next);
        out.delete('grupo');
        return out;
      },
      { replace: true },
    );
  const setGroupFilter = (value: string) =>
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        if (value === 'all') out.delete('grupo');
        else out.set('grupo', value);
        return out;
      },
      { replace: true },
    );

  const kpis = useMemo(() => rosterKpis(rows), [rows]);
  const visibleGroups = useMemo(() => filterGroups(groups, { phase, showArchived }, today), [groups, phase, showArchived, today]);
  const counts = useMemo(() => groupPhaseCounts(groups, today), [groups, today]);
  const unassigned = unassignedCount(rows);
  const legacySessions = useMemo(() => sessions.filter((s) => !s.group_id), [sessions]);
  const legacyRecords = useMemo(() => {
    const ids = new Set(legacySessions.map((s) => s.id));
    return records.filter((r) => ids.has(r.session_id));
  }, [legacySessions, records]);

  const stats = useMemo(() => {
    const byGroup = new Map<string, { collected: number; pending: number; next: string | null }>();
    for (const g of groups) {
      const k = rosterKpis(rowsForGroup(rows, g.id));
      const next = nextSession(sessions.filter((s) => s.group_id === g.id), new Date());
      byGroup.set(g.id, { collected: k.totalPaid, pending: k.totalBalance, next: next?.starts_at ?? null });
    }
    return byGroup;
  }, [groups, rows, sessions]);

  if (courses.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-8" aria-busy="true">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-muted-foreground">No se encontró el curso.</p>
        <Button variant="outline" onClick={() => navigate('/admin/cursos')}>
          Volver a cursos
        </Button>
      </div>
    );
  }

  const newGroup = () => navigate(`/admin/cursos/${courseId}/grupos/nuevo`);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <GroupsBreadcrumb courseId={courseId} courseTitle={course.title} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
            {course.cover_image ? (
              <img src={course.cover_image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary/40" aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Grupos del curso</p>
            <h1 className="truncate text-2xl font-bold">{course.title}</h1>
          </div>
        </div>
        <Button onClick={newGroup}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo grupo
        </Button>
      </div>

      <RosterKpiChips kpis={kpis} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="grupos">Grupos ({groups.length})</TabsTrigger>
          <TabsTrigger value="inscritos">Todos los inscritos ({kpis.enrolled})</TabsTrigger>
          {legacySessions.length > 0 && <TabsTrigger value="sin-grupo">Clases sin grupo ({legacySessions.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="grupos" className="mt-4 space-y-4">
          {groupsQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : groupsQuery.isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
              <p className="mb-3 text-sm text-destructive">No se pudieron cargar los grupos. Si es la primera vez, confirma que la migración de grupos esté aplicada.</p>
              <Button variant="outline" onClick={() => groupsQuery.refetch()}>
                Reintentar
              </Button>
            </div>
          ) : groups.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-dashed p-10 text-center">
                <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden />
                <p className="font-medium">Este curso aún no tiene grupos — crea el primero</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Un grupo es una tanda del curso con sus propios estudiantes, fechas, horario y cupos.
                </p>
                <Button onClick={newGroup}>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo grupo
                </Button>
              </div>
              {unassigned > 0 && (
                <div className="max-w-md">
                  <UnassignedGroupCard
                    count={unassigned}
                    onAssign={() => setParams({ tab: 'inscritos', grupo: 'none' }, { replace: true })}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <GroupsFilterBar
                phase={phase}
                onPhaseChange={setPhase}
                counts={counts}
                showArchived={showArchived}
                onShowArchivedChange={setShowArchived}
              />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleGroups.map((group) => {
                  const s = stats.get(group.id);
                  return (
                    <GroupCard
                      key={group.id}
                      group={group}
                      phase={groupPhase(group, today)}
                      collected={s?.collected ?? 0}
                      pending={s?.pending ?? 0}
                      nextClassAt={s?.next ?? null}
                      onOpen={() => navigate(`/admin/cursos/${courseId}/grupos/${group.id}`)}
                    />
                  );
                })}
                {unassigned > 0 && (
                  <UnassignedGroupCard
                    count={unassigned}
                    onAssign={() => setParams({ tab: 'inscritos', grupo: 'none' }, { replace: true })}
                  />
                )}
              </div>
              {visibleGroups.length === 0 && (
                <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Ningún grupo coincide con el filtro.
                </p>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="inscritos" className="mt-4">
          <RosterTab
            courseId={courseId}
            courseTitle={course.title}
            coursePrice={Number(course.price) || 0}
            rows={rows}
            groups={groups}
            groupFilter={groupFilter}
            onGroupFilterChange={setGroupFilter}
            loading={roster.isLoading}
            error={roster.isError}
            onRetry={() => roster.refetch()}
          />
        </TabsContent>

        {legacySessions.length > 0 && (
          <TabsContent value="sin-grupo" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Clases creadas antes de los grupos. Para llevar el calendario por grupo, crea una clase dentro del grupo.
            </p>
            <AttendanceTab
              courseId={courseId}
              rows={rows.filter((r) => r.enrollment.status !== 'cancelled')}
              sessions={legacySessions}
              records={legacyRecords}
              loading={sessionsQuery.isLoading || roster.isLoading}
              error={sessionsQuery.isError}
              onRetry={() => sessionsQuery.refetch()}
              openSessionId={openSessionId}
              onOpenSession={setOpenSessionId}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
