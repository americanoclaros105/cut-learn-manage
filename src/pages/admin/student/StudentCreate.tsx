import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EnrollableCourse } from '@/components/admin/students/detail/AddEnrollmentDialog';
import { NewStudentForm } from '@/components/admin/students/detail/NewStudentForm';
import { useCourses } from '@/hooks/useCourses';
import { fetchEnrollmentIdsByCourse } from '@/hooks/useEnrollments';
import { useCreatePayment } from '@/hooks/usePayments';
import { useCreateStudent } from '@/hooks/useStudents';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { dayToIso, type CreateStudentValues } from '@/lib/studentSchemas';

/** Create-student page: creates the account (edge function), then the optional initial payments. */
export const StudentCreate = () => {
  const navigate = useNavigate();
  const courses = useCourses({ status: 'published' });
  const createStudent = useCreateStudent();
  const createPayment = useCreatePayment();
  const [dirty, setDirty] = useState(false);
  // After a successful creation we navigate away on purpose: skip the unsaved-changes prompt.
  const created = useRef(false);
  const confirmLeave = useUnsavedChangesGuard(dirty && !created.current);

  const available = useMemo<EnrollableCourse[]>(
    () => (courses.data ?? []).map((c) => ({ id: c.id, title: c.title, price: Number(c.price) || 0 })),
    [courses.data],
  );

  const goBack = () => {
    if (confirmLeave()) navigate('/admin/estudiantes');
  };

  const handleSubmit = async (values: CreateStudentValues) => {
    let userId: string;
    try {
      const response = await createStudent.mutateAsync({
        email: values.email.trim(),
        password: values.password,
        name: values.name,
        phone: values.phone || undefined,
        status: values.status,
        enabled_from: dayToIso(values.enabled_from, 'start'),
        expires_at: dayToIso(values.expires_at, 'end'),
        notes: values.notes || undefined,
        courses: values.enrollments.map((e) => ({ course_id: e.course_id, agreed_price: e.agreed_price })),
      });
      userId = response.user_id as string;
    } catch (e) {
      console.error(e);
      toast.error(`No se pudo crear el estudiante${e instanceof Error ? `: ${e.message}` : ''}`);
      throw e;
    }

    created.current = true;

    const withPayment = values.enrollments.filter((e) => e.initial_payment > 0);
    let paymentFailures = 0;
    if (withPayment.length > 0) {
      try {
        const ids = await fetchEnrollmentIdsByCourse(userId);
        for (const e of withPayment) {
          const enrollmentId = ids[e.course_id];
          if (!enrollmentId) {
            paymentFailures += 1;
            continue;
          }
          try {
            await createPayment.mutateAsync({
              enrollmentId,
              courseId: e.course_id,
              amount: e.initial_payment,
              method: values.initial_method,
              paidAt: format(new Date(), 'yyyy-MM-dd'),
              statusBefore: 'pending',
            });
          } catch (error) {
            console.error(error);
            paymentFailures += 1;
          }
        }
      } catch (error) {
        console.error(error);
        paymentFailures = withPayment.length;
      }
    }

    if (paymentFailures > 0) {
      toast.warning('Estudiante creado, pero no se pudieron registrar algunos abonos. Regístralos desde la pestaña Pagos.');
    } else {
      toast.success('Estudiante creado correctamente');
    }
    navigate(`/admin/estudiantes/${userId}?tab=resumen`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div>
        <Button variant="link" className="mb-1 h-auto p-0 text-muted-foreground" onClick={goBack}>
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden /> Estudiantes
        </Button>
        <h1 className="text-3xl font-bold">Nuevo estudiante</h1>
        <p className="text-muted-foreground">Crea la cuenta, define su acceso y, si quieres, inscríbelo en cursos.</p>
      </div>

      <NewStudentForm
        courses={available}
        saving={createStudent.isPending || createPayment.isPending}
        onSubmit={handleSubmit}
        onCancel={goBack}
        onDirtyChange={setDirty}
      />
    </div>
  );
};
