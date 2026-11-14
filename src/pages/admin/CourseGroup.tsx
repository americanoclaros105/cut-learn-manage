import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RosterKpiChips } from '@/components/admin/operations/RosterKpiChips';
import { useCourses } from '@/hooks/useCourses';
import { useCourseRoster } from '@/hooks/useEnrollments';
import { useCourseSessions } from '@/hooks/useClassSessions';
import { buildRosterRows, rosterKpis } from '@/lib/roster';
import { AttendanceTab } from './course-group/AttendanceTab';
import { RosterTab } from './course-group/RosterTab';

export const CourseGroup = () => {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const courses = useCourses();
  const roster = useCourseRoster(courseId);
  const sessionsQuery = useCourseSessions(courseId);

  const course = courses.data?.find((c) => c.id === courseId);
  const records = useMemo(() => sessionsQuery.data?.records ?? [], [sessionsQuery.data]);
  const sessions = useMemo(() => sessionsQuery.data?.sessions ?? [], [sessionsQuery.data]);

  const rows = useMemo(
    () =>
      buildRosterRows(
        roster.data?.enrollments ?? [],
        roster.data?.students ?? [],
        roster.data?.payments ?? [],
        records,
      ).sort((a, b) => a.student.name.localeCompare(b.student.name, 'es')),
    [roster.data, records],
  );
  const kpis = useMemo(() => rosterKpis(rows), [rows]);
  const attendanceRows = useMemo(() => rows.filter((r) => r.enrollment.status !== 'cancelled'), [rows]);

  if (courses.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
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

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/cursos')} aria-label="Volver a cursos">
          <ArrowLeft className="h-5 w-5" />
        </Button>
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
          <p className="text-xs text-muted-foreground">Grupo y asistencia</p>
          <h1 className="truncate text-2xl font-bold">{course.title}</h1>
        </div>
      </div>

      <RosterKpiChips kpis={kpis} />

      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster">Inscritos ({kpis.enrolled})</TabsTrigger>
          <TabsTrigger value="attendance">Asistencia ({sessions.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="roster" className="mt-4">
          <RosterTab
            courseId={courseId}
            courseTitle={course.title}
            coursePrice={Number(course.price) || 0}
            rows={rows}
            loading={roster.isLoading}
            error={roster.isError}
            onRetry={() => roster.refetch()}
          />
        </TabsContent>
        <TabsContent value="attendance" className="mt-4">
          <AttendanceTab
            courseId={courseId}
            rows={attendanceRows}
            sessions={sessions}
            records={records}
            loading={sessionsQuery.isLoading || roster.isLoading}
            error={sessionsQuery.isError}
            onRetry={() => sessionsQuery.refetch()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
