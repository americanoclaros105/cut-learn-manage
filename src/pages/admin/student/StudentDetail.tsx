import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AddEnrollmentDialog,
  type EnrollableCourse,
} from '@/components/admin/students/detail/AddEnrollmentDialog';
import { StudentAttendancePanel } from '@/components/admin/students/detail/StudentAttendancePanel';
import { StudentDetailSkeleton, StudentPageMessage } from '@/components/admin/students/detail/StudentPageStates';
import { StudentHeader } from '@/components/admin/students/detail/StudentHeader';
import { StudentKpiCards } from '@/components/admin/students/detail/StudentKpiCards';
import { StudentPaymentsPanel } from '@/components/admin/students/detail/StudentPaymentsPanel';
import { StudentSidePanel } from '@/components/admin/students/detail/StudentSidePanel';
import { useCoursesWithStats } from '@/hooks/useCourses';
import { useGroupsForCourses } from '@/hooks/useCourseGroups';
import { useEnrollStudent } from '@/hooks/useEnrollments';
import { useStudentAttendance, useStudentLessonProgress, useStudentPayments } from '@/hooks/useStudentDetail';
import { useStudent } from '@/hooks/useStudents';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { buildLedgerCsv } from '@/lib/accounting';
import { knownGroupError } from '@/lib/groups';
import { downloadTextFile } from '@/lib/download';
import {
  buildStudentEnrollments,
  deleteImpact,
  parseStudentTab,
  studentKpis,
  STUDENT_TABS,
  type StudentTab,
} from '@/lib/studentDetail';
import { openWhatsAppMessage } from '@/lib/whatsapp';
import type { PaymentRecord } from '@/hooks/usePayments';
import { AccessTab } from './AccessTab';
import { PaymentDialogs, type PaymentRequest } from './PaymentDialogs';
import { PersonalTab } from './PersonalTab';
import { SummaryTab } from './SummaryTab';

const tabLabels: Record<StudentTab, string> = {
  resumen: 'Resumen',
  datos: 'Datos personales',
  acceso: 'Acceso a la cuenta',
  pagos: 'Pagos',
  asistencia: 'Asistencia',
};

const slug = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase() || 'estudiante';

/** Student page container: loads data, owns tab state (?tab=) and the dialogs shared across tabs. */
export const StudentDetail = () => {
  const { studentId = '' } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseStudentTab(searchParams.get('tab'));

  const student = useStudent(studentId);
  const courses = useCoursesWithStats({ notifyOnCountsError: true });
  const ledger = useStudentPayments(studentId);
  const lessonProgress = useStudentLessonProgress(studentId);
  const enrollStudent = useEnrollStudent();

  const enrollments = useMemo(() => student.data?.assigned_courses ?? [], [student.data]);
  const courseIds = useMemo(() => enrollments.map((e) => e.course_id), [enrollments]);
  const attendance = useStudentAttendance(studentId, courseIds);
  const groups = useGroupsForCourses(courseIds);
  const groupsById = useMemo(() => new Map((groups.data ?? []).map((g) => [g.id, g])), [groups.data]);

  const [personalDirty, setPersonalDirty] = useState(false);
  const [accessDirty, setAccessDirty] = useState(false);
  const confirmLeave = useUnsavedChangesGuard(personalDirty || accessDirty);

  const [payRequest, setPayRequest] = useState<PaymentRequest | null>(null);
  const [voidTarget, setVoidTarget] = useState<PaymentRecord | null>(null);
  const [enrollOpen, setEnrollOpen] = useState(false);

  const rows = useMemo(
    () =>
      buildStudentEnrollments(
        enrollments,
        ledger.data?.payments ?? [],
        (courses.data ?? []).map((c) => ({
          id: c.id,
          title: c.title,
          cover_image: c.cover_image,
          lesson_count: c.lesson_count ?? 0,
        })),
        lessonProgress.data ?? [],
        attendance.data?.sessions ?? [],
        attendance.data?.records ?? [],
      ).sort((a, b) => (a.course?.title ?? '').localeCompare(b.course?.title ?? '', 'es')),
    [enrollments, ledger.data, courses.data, lessonProgress.data, attendance.data],
  );
  const kpis = useMemo(() => studentKpis(rows), [rows]);
  const impact = useMemo(() => deleteImpact(rows), [rows]);

  const enrollable = useMemo<EnrollableCourse[]>(() => {
    const taken = new Set(enrollments.map((e) => e.course_id));
    return (courses.data ?? [])
      .filter((c) => c.status === 'published' && !taken.has(c.id))
      .map((c) => ({ id: c.id, title: c.title, price: Number(c.price) || 0 }));
  }, [courses.data, enrollments]);

  const setTab = useCallback(
    (next: string) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set('tab', parseStudentTab(next));
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const goBack = () => {
    if (confirmLeave()) navigate('/admin/estudiantes');
  };

  if (student.isLoading || courses.isLoading || ledger.isLoading) return <StudentDetailSkeleton />;

  if (student.isError || ledger.isError) {
    return (
      <StudentPageMessage
        title="No se pudo cargar el estudiante"
        detail="Revisa tu conexión e inténtalo de nuevo."
        onBack={() => navigate('/admin/estudiantes')}
        onRetry={() => {
          void student.refetch();
          void ledger.refetch();
        }}
      />
    );
  }

  if (!student.data) {
    return (
      <StudentPageMessage
        title="Estudiante no encontrado"
        detail="El enlace es incorrecto o el estudiante fue eliminado."
        onBack={() => navigate('/admin/estudiantes')}
      />
    );
  }

  const profile = student.data;
  const payable = rows.some((r) => r.enrollment.status !== 'cancelled');
  const firstName = profile.name.split(' ')[0];

  const exportCsv = () =>
    downloadTextFile(`pagos_${slug(profile.name)}.csv`, buildLedgerCsv(ledger.data?.payments ?? []));

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 md:px-8">
      <StudentHeader
        student={profile}
        onBack={goBack}
        onWhatsApp={() => profile.phone && openWhatsAppMessage(profile.phone, `Hola ${firstName}, te escribimos de Claros Studio.`)}
      />

      <div className="space-y-6 pt-6">
        <StudentKpiCards kpis={kpis} />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-auto w-full justify-start overflow-x-auto">
            {STUDENT_TABS.map((value) => (
              <TabsTrigger key={value} value={value}>
                {tabLabels[value]}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              {/* Forms stay mounted (hidden) so unsaved edits survive a tab switch. */}
              <TabsContent value="resumen" className="mt-0">
                <SummaryTab
                  studentName={profile.name}
                  rows={rows}
                  groupsById={groupsById}
                  onPay={(enrollmentId) => setPayRequest({ enrollmentId })}
                  onEnroll={() => setEnrollOpen(true)}
                />
              </TabsContent>
              <TabsContent value="datos" forceMount className="mt-0 data-[state=inactive]:hidden">
                <PersonalTab student={profile} onDirtyChange={setPersonalDirty} />
              </TabsContent>
              <TabsContent value="acceso" forceMount className="mt-0 data-[state=inactive]:hidden">
                <AccessTab
                  student={profile}
                  impact={impact}
                  onDirtyChange={setAccessDirty}
                  onDeleted={() => navigate('/admin/estudiantes')}
                />
              </TabsContent>
              <TabsContent value="pagos" className="mt-0">
                <StudentPaymentsPanel
                  payments={ledger.data?.payments ?? []}
                  staffNames={ledger.data?.staffNames ?? {}}
                  loading={false}
                  error={ledger.isError}
                  canRegister={payable}
                  onRetry={() => void ledger.refetch()}
                  onRegister={() => setPayRequest({ enrollmentId: null })}
                  onVoid={setVoidTarget}
                  onExport={exportCsv}
                />
              </TabsContent>
              <TabsContent value="asistencia" className="mt-0">
                <StudentAttendancePanel
                  rows={rows.filter((r) => r.enrollment.status !== 'cancelled')}
                  groupsById={groupsById}
                  loading={attendance.isLoading}
                  error={attendance.isError}
                />
              </TabsContent>
            </div>

            <StudentSidePanel
              enabledFrom={profile.enabled_from}
              expiresAt={profile.expires_at}
              notes={profile.notes}
              canRegisterPayment={payable}
              onRegisterPayment={() => setPayRequest({ enrollmentId: null })}
              onEnroll={() => setEnrollOpen(true)}
              onOpenAccess={() => setTab('acceso')}
            />
          </div>
        </Tabs>
      </div>

      <PaymentDialogs
        studentName={profile.name}
        rows={rows}
        payRequest={payRequest}
        onPayClose={() => setPayRequest(null)}
        voidTarget={voidTarget}
        onVoidClose={() => setVoidTarget(null)}
      />

      <AddEnrollmentDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        studentName={profile.name}
        courses={enrollable}
        submitting={enrollStudent.isPending}
        onSubmit={async (values) => {
          try {
            await enrollStudent.mutateAsync({ userId: profile.id, ...values });
            toast.success('Estudiante inscrito en el curso');
            setEnrollOpen(false);
            setTab('resumen');
          } catch (e) {
            console.error(e);
            toast.error(knownGroupError(e) ?? 'No se pudo inscribir al estudiante');
          }
        }}
      />
    </div>
  );
};
