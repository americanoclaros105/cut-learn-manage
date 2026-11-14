import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GroupHeader } from '@/components/admin/groups/GroupHeader';
import { GroupsBreadcrumb } from '@/components/admin/groups/GroupsBreadcrumb';
import { TodayClassBanner } from '@/components/admin/groups/TodayClassBanner';
import { ConfirmDialog } from '@/components/admin/operations/ConfirmDialog';
import { RosterKpiChips } from '@/components/admin/operations/RosterKpiChips';
import { useCourses } from '@/hooks/useCourses';
import { useArchiveCourseGroup, useCourseGroups, useDeleteCourseGroup } from '@/hooks/useCourseGroups';
import { useCourseOperations } from '@/hooks/useCourseOperations';
import { groupErrorMessage, groupPhase } from '@/lib/groups';
import { localDay, rowsForGroup, todaySession } from '@/lib/groupViews';
import { rosterKpis } from '@/lib/roster';
import { AttendanceTab } from '../course-group/AttendanceTab';
import { RosterTab } from '../course-group/RosterTab';
import { GroupFinanceTab } from './GroupFinanceTab';

type DetailTab = 'estudiantes' | 'calendario' | 'finanzas';
const tabs: DetailTab[] = ['estudiantes', 'calendario', 'finanzas'];

/** `/admin/cursos/:courseId/grupos/:groupId` with URL-synced tabs (`?tab=`) and a deep link to a class (`&clase=`). */
export const GroupDetail = () => {
  const { courseId = '', groupId = '' } = useParams<{ courseId: string; groupId: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const courses = useCourses();
  const groupsQuery = useCourseGroups(courseId);
  const { roster, sessionsQuery, rows: courseRows, sessions, records } = useCourseOperations(courseId, groupId);
  const archiveGroup = useArchiveCourseGroup();
  const deleteGroup = useDeleteCourseGroup();

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const course = courses.data?.find((c) => c.id === courseId);
  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);
  const group = groups.find((g) => g.id === groupId) ?? null;

  const groupRows = useMemo(() => rowsForGroup(courseRows, groupId), [courseRows, groupId]);
  const liveRows = useMemo(() => groupRows.filter((r) => r.enrollment.status !== 'cancelled'), [groupRows]);
  const kpis = useMemo(() => rosterKpis(groupRows), [groupRows]);
  const todayClass = useMemo(() => todaySession(sessions, new Date()), [sessions]);
  const todayTaken = !!todayClass && records.some((r) => r.session_id === todayClass.id);

  const requestedTab = params.get('tab');
  const tab: DetailTab = tabs.includes(requestedTab as DetailTab) ? (requestedTab as DetailTab) : 'estudiantes';
  const openSessionId = tab === 'calendario' ? params.get('clase') : null;

  const setTab = (next: string) =>
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        if (next === 'estudiantes') out.delete('tab');
        else out.set('tab', next);
        out.delete('clase');
        return out;
      },
      { replace: true },
    );
  const openSession = (sessionId: string | null) =>
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        out.set('tab', 'calendario');
        if (sessionId) out.set('clase', sessionId);
        else out.delete('clase');
        return out;
      },
      { replace: sessionId === null },
    );

  if (courses.isLoading || groupsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-8" aria-busy="true">
        <Skeleton className="h-5 w-72" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (groupsQuery.isError) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-destructive">No se pudo cargar el grupo. Revisa tu conexión e inténtalo de nuevo.</p>
        <Button variant="outline" onClick={() => groupsQuery.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!course || !group) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-muted-foreground">{!course ? 'No se encontró el curso.' : 'No se encontró el grupo.'}</p>
        <Button variant="outline" onClick={() => navigate(course ? `/admin/cursos/${courseId}/grupos` : '/admin/cursos')}>
          Volver
        </Button>
      </div>
    );
  }

  const phase = groupPhase(group, localDay(new Date()));
  const archived = phase === 'archived';
  const hasEnrollments = groupRows.length > 0;

  const handleArchive = async () => {
    setArchiveOpen(false);
    try {
      await archiveGroup.mutateAsync({ id: group.id, courseId, archived: !archived });
      toast.success(archived ? 'Grupo restaurado' : 'Grupo archivado');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo actualizar el grupo', { description: groupErrorMessage(e) });
    }
  };

  const handleDelete = async () => {
    setDeleteOpen(false);
    try {
      await deleteGroup.mutateAsync({ id: group.id, courseId });
      toast.success('Grupo eliminado');
      navigate(`/admin/cursos/${courseId}/grupos`, { replace: true });
    } catch (e) {
      console.error(e);
      toast.error('No se pudo eliminar el grupo', { description: groupErrorMessage(e) });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-8">
      <GroupsBreadcrumb courseId={courseId} courseTitle={course.title} groupName={group.name} groupId={group.id} />

      <GroupHeader
        group={group}
        phase={phase}
        editHref={`/admin/cursos/${courseId}/grupos/${group.id}/editar`}
        onToggleArchive={() => (archived ? void handleArchive() : setArchiveOpen(true))}
        onDelete={() => setDeleteOpen(true)}
      />

      {todayClass && !openSessionId && !archived && (
        <TodayClassBanner startsAt={todayClass.starts_at} taken={todayTaken} onOpen={() => openSession(todayClass.id)} />
      )}

      <RosterKpiChips kpis={kpis} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="estudiantes">Estudiantes ({kpis.enrolled})</TabsTrigger>
          <TabsTrigger value="calendario">Calendario y asistencia ({sessions.length})</TabsTrigger>
          <TabsTrigger value="finanzas">Finanzas</TabsTrigger>
        </TabsList>

        <TabsContent value="estudiantes" className="mt-4">
          <RosterTab
            courseId={courseId}
            courseTitle={course.title}
            coursePrice={Number(course.price) || 0}
            rows={groupRows}
            allRows={courseRows}
            groups={groups}
            scopeGroup={group}
            loading={roster.isLoading}
            error={roster.isError}
            onRetry={() => roster.refetch()}
          />
        </TabsContent>

        <TabsContent value="calendario" className="mt-4">
          <AttendanceTab
            courseId={courseId}
            group={group}
            rows={liveRows}
            sessions={sessions}
            records={records}
            loading={sessionsQuery.isLoading || roster.isLoading}
            error={sessionsQuery.isError}
            onRetry={() => sessionsQuery.refetch()}
            openSessionId={openSessionId}
            onOpenSession={openSession}
          />
        </TabsContent>

        <TabsContent value="finanzas" className="mt-4">
          <GroupFinanceTab
            courseId={courseId}
            courseTitle={course.title}
            groupName={group.name}
            rows={groupRows}
            loading={roster.isLoading}
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archivar grupo"
        description={`${group.name} deja de aparecer en la lista principal y ya no se ofrece para inscribir o trasladar estudiantes. Sus estudiantes, clases y pagos se conservan, y puedes restaurarlo cuando quieras.`}
        confirmLabel="Archivar"
        onConfirm={handleArchive}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={hasEnrollments ? 'No se puede eliminar este grupo' : 'Eliminar grupo'}
        description={
          hasEnrollments
            ? `${group.name} tiene ${groupRows.length} ${groupRows.length === 1 ? 'inscripción' : 'inscripciones'}. Traslada a los estudiantes a otro grupo, o archiva el grupo si ya terminó: así no pierdes su historial.`
            : `Se eliminarán ${group.name}, su horario y sus ${sessions.length} ${sessions.length === 1 ? 'clase' : 'clases'} del calendario. Esta acción no se puede deshacer.`
        }
        confirmLabel={hasEnrollments ? 'Entendido' : 'Eliminar grupo'}
        destructive={!hasEnrollments}
        onConfirm={hasEnrollments ? () => setDeleteOpen(false) : handleDelete}
      />
    </div>
  );
};
