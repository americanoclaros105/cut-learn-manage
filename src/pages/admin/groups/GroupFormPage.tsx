import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GroupForm, type GroupFormState } from '@/components/admin/groups/GroupForm';
import { GroupsBreadcrumb } from '@/components/admin/groups/GroupsBreadcrumb';
import { useCourses } from '@/hooks/useCourses';
import { useCourseGroups, useGenerateGroupSessions, useSaveCourseGroup } from '@/hooks/useCourseGroups';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import {
  emptyScheduleRow,
  nextGroupColor,
  nextGroupName,
  rowsToSlots,
  schedulePreview,
  slotsToRows,
  validateGroupForm,
  validateScheduleRows,
  type GroupFormErrors,
  type ScheduleRow,
} from '@/lib/groupForm';
import { localDay } from '@/lib/groupViews';
import { groupErrorMessage } from '@/lib/groups';
import { formatMoneyInput } from '@/lib/money';
import type { Course, CourseGroupWithStats } from '@/types';

let rowCounter = 0;
const newRowId = () => `row-${(rowCounter += 1)}`;

interface EditorProps {
  courseId: string;
  course: Pick<Course, 'title' | 'price'>;
  groups: CourseGroupWithStats[];
  /** Present when editing. */
  group: CourseGroupWithStats | null;
}

const initialState = (group: CourseGroupWithStats | null, groups: CourseGroupWithStats[]): GroupFormState =>
  group
    ? {
        name: group.name,
        color: group.color ?? nextGroupColor([]),
        start_date: group.start_date,
        end_date: group.end_date,
        location: group.location ?? '',
        instructor: group.instructor ?? '',
        capacity: group.capacity === null ? '' : String(group.capacity),
        priceText: group.price === null ? '' : formatMoneyInput(group.price),
        price: group.price ?? 0,
        notes: group.notes ?? '',
      }
    : {
        name: nextGroupName(groups.map((g) => g.name)),
        color: nextGroupColor(groups.map((g) => g.color)),
        start_date: localDay(new Date()),
        end_date: '',
        location: '',
        instructor: '',
        capacity: '',
        priceText: '',
        price: 0,
        notes: '',
      };

/** Mounted only once the data is loaded, so the initial state can be computed once. */
const GroupFormEditor = ({ courseId, course, groups, group }: EditorProps) => {
  const navigate = useNavigate();
  const saveGroup = useSaveCourseGroup();
  const generate = useGenerateGroupSessions();

  const initial = useRef({
    state: initialState(group, groups),
    rows: group ? slotsToRows(group.schedules, newRowId) : [],
  });
  const [state, setState] = useState<GroupFormState>(initial.current.state);
  const [rows, setRows] = useState<ScheduleRow[]>(initial.current.rows);
  const [generateNow, setGenerateNow] = useState(true);
  const [errors, setErrors] = useState<GroupFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const saved = useRef(false);

  const dirty = JSON.stringify({ state, rows }) !== JSON.stringify(initial.current);
  const confirmLeave = useUnsavedChangesGuard(dirty && !saved.current);

  const slots = useMemo(() => rowsToSlots(rows), [rows]);
  const scheduleIssues = useMemo(() => validateScheduleRows(rows), [rows]);
  const preview = useMemo(() => schedulePreview(state.start_date, state.end_date, slots), [state.start_date, state.end_date, slots]);

  // A freshly added row has no weekday yet: only nag about it once the user tries to save.
  const visibleIssues = submitted
    ? scheduleIssues
    : scheduleIssues.filter((i) => rows.find((r) => r.id === i.rowId)?.weekdays.length !== 0);

  const patch = (next: Partial<GroupFormState>) => {
    setState((s) => ({ ...s, ...next }));
    if (submitted) setErrors((e) => ({ ...e, ...Object.fromEntries(Object.keys(next).map((k) => [k, undefined])) }));
  };

  const goBack = () => {
    if (!confirmLeave()) return;
    navigate(group ? `/admin/cursos/${courseId}/grupos/${group.id}` : `/admin/cursos/${courseId}/grupos`);
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const found = validateGroupForm(state);
    setErrors(found);
    if (Object.keys(found).length > 0 || scheduleIssues.length > 0) {
      toast.error('Revisa los campos marcados antes de guardar.');
      return;
    }

    let groupId: string;
    try {
      groupId = await saveGroup.mutateAsync({
        id: group?.id,
        courseId,
        values: {
          name: state.name,
          start_date: state.start_date,
          end_date: state.end_date,
          location: state.location,
          instructor: state.instructor,
          capacity: state.capacity.trim() ? Number(state.capacity) : null,
          price: state.priceText.trim() ? state.price : null,
          color: state.color,
          notes: state.notes,
        },
        schedules: slots,
      });
    } catch (e) {
      console.error(e);
      toast.error('No se pudo guardar el grupo', { description: groupErrorMessage(e) });
      return;
    }

    saved.current = true;

    if (!group && generateNow && slots.length > 0) {
      try {
        const created = await generate.mutateAsync({ groupId, courseId });
        toast.success(`Grupo creado con ${created} ${created === 1 ? 'clase' : 'clases'} en el calendario`);
      } catch (e) {
        console.error(e);
        toast.error('El grupo se creó, pero no se pudo generar el calendario', {
          description: `${groupErrorMessage(e)} Puedes generarlo desde la pestaña Calendario.`,
        });
      }
    } else if (group) {
      const scheduleChanged =
        JSON.stringify(rowsToSlots(initial.current.rows)) !== JSON.stringify(slots) ||
        initial.current.state.start_date !== state.start_date ||
        initial.current.state.end_date !== state.end_date;
      toast.success('Grupo actualizado', {
        description: scheduleChanged
          ? 'Cambiaste el horario o las fechas: las clases ya generadas no cambian. Usa "Generar calendario" para completar o regenerar las futuras.'
          : undefined,
      });
    } else {
      toast.success('Grupo creado');
    }
    navigate(`/admin/cursos/${courseId}/grupos/${groupId}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <GroupsBreadcrumb
        courseId={courseId}
        courseTitle={course.title}
        groupName={group?.name}
        groupId={group?.id}
        leaf={group ? 'Editar' : 'Nuevo grupo'}
      />
      <div>
        <h1 className="text-2xl font-bold">{group ? `Editar ${group.name}` : 'Nuevo grupo'}</h1>
        <p className="text-sm text-muted-foreground">
          {course.title} · Un grupo es una tanda del curso con sus propios estudiantes, fechas y horario.
        </p>
      </div>

      <GroupForm
        state={state}
        onChange={patch}
        errors={errors}
        rows={rows}
        scheduleIssues={visibleIssues}
        onChangeRow={(id, change) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...change } : r)))}
        onAddRow={() => setRows((rs) => [...rs, emptyScheduleRow(newRowId())])}
        onRemoveRow={(id) => setRows((rs) => rs.filter((r) => r.id !== id))}
        preview={preview}
        coursePrice={Number(course.price) || 0}
        isCreate={!group}
        generateNow={generateNow}
        onGenerateNowChange={setGenerateNow}
        submitting={saveGroup.isPending || generate.isPending}
        submitLabel={group ? 'Guardar cambios' : 'Crear grupo'}
        onSubmit={handleSubmit}
        onCancel={goBack}
      />
    </div>
  );
};

/** `/admin/cursos/:courseId/grupos/nuevo` and `/admin/cursos/:courseId/grupos/:groupId/editar`. */
export const GroupFormPage = () => {
  const { courseId = '', groupId } = useParams<{ courseId: string; groupId?: string }>();
  const navigate = useNavigate();
  const courses = useCourses();
  const groups = useCourseGroups(courseId);

  const course = courses.data?.find((c) => c.id === courseId);
  const group = groupId ? (groups.data?.find((g) => g.id === groupId) ?? null) : null;

  if (courses.isLoading || groups.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8" aria-busy="true">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (groups.isError || courses.isError) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-destructive">No se pudo cargar la información del curso.</p>
        <Button
          variant="outline"
          onClick={() => {
            void groups.refetch();
            void courses.refetch();
          }}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (!course || (groupId && !group)) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-muted-foreground">{!course ? 'No se encontró el curso.' : 'No se encontró el grupo.'}</p>
        <Button variant="outline" onClick={() => navigate(course ? `/admin/cursos/${courseId}/grupos` : '/admin/cursos')}>
          Volver
        </Button>
      </div>
    );
  }

  return <GroupFormEditor key={group?.id ?? 'new'} courseId={courseId} course={course} groups={groups.data ?? []} group={group} />;
};
