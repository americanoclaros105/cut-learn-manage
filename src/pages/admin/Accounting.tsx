import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Download, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LedgerKpiCards } from '@/components/admin/operations/LedgerKpiCards';
import { LedgerTable } from '@/components/admin/operations/LedgerTable';
import { PeriodSelector } from '@/components/admin/operations/PeriodSelector';
import { ReceivablesList } from '@/components/admin/operations/ReceivablesList';
import { RegisterPaymentDialog, type PaymentTarget } from '@/components/admin/operations/RegisterPaymentDialog';
import { VoidPaymentDialog } from '@/components/admin/operations/VoidPaymentDialog';
import { useCourses } from '@/hooks/useCourses';
import { useCreatePayment, useLedgerPayments, useVoidPayment } from '@/hooks/usePayments';
import { useStudents } from '@/hooks/useStudents';
import {
  buildLedgerCsv,
  buildReceivables,
  filterLedger,
  ledgerKpis,
  periodRange,
  type DateRange,
  type LedgerPayment,
  type PeriodKind,
} from '@/lib/accounting';
import { downloadTextFile } from '@/lib/download';
import { enrollmentBalance, paymentMethodLabels } from '@/lib/operations';
import type { PaymentMethod } from '@/types';

const PAGE = 50;
const methods = Object.keys(paymentMethodLabels) as PaymentMethod[];

export const Accounting = () => {
  const ledger = useLedgerPayments();
  const students = useStudents();
  const courses = useCourses();
  const createPayment = useCreatePayment();
  const voidPayment = useVoidPayment();

  const [periodKind, setPeriodKind] = useState<PeriodKind>('this-month');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [courseId, setCourseId] = useState('all');
  const [method, setMethod] = useState('all');
  const [search, setSearch] = useState('');
  const [includeVoided, setIncludeVoided] = useState(false);
  const [shown, setShown] = useState(PAGE);

  const [payOpen, setPayOpen] = useState(false);
  const [payEnrollmentId, setPayEnrollmentId] = useState<string | null>(null);
  const [voidTarget, setVoidTarget] = useState<LedgerPayment | null>(null);

  const range = useMemo(() => periodRange(periodKind, new Date(), customRange), [periodKind, customRange]);
  const payments = useMemo(() => ledger.data?.payments ?? [], [ledger.data]);
  const staffNames = ledger.data?.staffNames ?? {};

  // KPIs follow the period only; the table adds the user filters on top.
  const periodPayments = useMemo(
    () => filterLedger(payments, { ...range, courseId: 'all', method: 'all', search: '', includeVoided: false }),
    [payments, range],
  );
  const kpis = useMemo(() => ledgerKpis(periodPayments), [periodPayments]);
  const filtered = useMemo(
    () => filterLedger(payments, { ...range, courseId, method, search, includeVoided }),
    [payments, range, courseId, method, search, includeVoided],
  );

  const enrollments = useMemo(
    () =>
      (students.data ?? []).flatMap((s) =>
        (s.assigned_courses ?? []).map((a) => ({
          id: a.id,
          user_id: a.user_id,
          course_id: a.course_id,
          status: a.status,
          agreed_price: Number(a.agreed_price),
        })),
      ),
    [students.data],
  );
  const studentList = useMemo(
    () => (students.data ?? []).map((s) => ({ id: s.id, name: s.name, phone: s.phone })),
    [students.data],
  );
  const courseList = useMemo(() => (courses.data ?? []).map((c) => ({ id: c.id, title: c.title })), [courses.data]);

  const receivables = useMemo(
    () => buildReceivables(enrollments, studentList, courseList, payments),
    [enrollments, studentList, courseList, payments],
  );
  const totalReceivable = receivables.reduce((n, r) => n + r.balance, 0);
  const pendingEnrollments = enrollments.filter((e) => e.status === 'pending').length;

  const targets = useMemo<PaymentTarget[]>(() => {
    const studentById = new Map(studentList.map((s) => [s.id, s]));
    const courseById = new Map(courseList.map((c) => [c.id, c]));
    return enrollments
      .filter((e) => e.status !== 'cancelled')
      .map((e) => ({
        enrollmentId: e.id,
        courseId: e.course_id,
        studentName: studentById.get(e.user_id)?.name ?? 'Estudiante',
        courseTitle: courseById.get(e.course_id)?.title ?? 'Curso',
        status: e.status,
        agreed: e.agreed_price,
        paid: enrollmentBalance(
          e.agreed_price,
          payments.filter((p) => p.enrollment_id === e.id),
        ).paid,
      }))
      .sort((a, b) => a.studentName.localeCompare(b.studentName, 'es'));
  }, [enrollments, studentList, courseList, payments]);

  const openRegister = (enrollmentId: string | null) => {
    setPayEnrollmentId(enrollmentId);
    setPayOpen(true);
  };

  const handleExport = () => {
    downloadTextFile(`pagos_${range.from}_${range.to}.csv`, buildLedgerCsv(filtered));
    toast.success(`Exportados ${filtered.length} pagos`);
  };

  const loading = ledger.isLoading || students.isLoading;
  const visible = filtered.slice(0, shown);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Contabilidad</h1>
          <p className="text-muted-foreground">Pagos, recaudo y cuentas por cobrar de la academia</p>
        </div>
        <Button onClick={() => openRegister(null)}>
          <Plus className="mr-2 h-4 w-4" /> Registrar pago
        </Button>
      </div>

      <PeriodSelector
        kind={periodKind}
        range={range}
        onKindChange={(k) => {
          setPeriodKind(k);
          setShown(PAGE);
        }}
        onCustomRange={(r) => {
          setCustomRange(r);
          setPeriodKind('custom');
          setShown(PAGE);
        }}
      />

      {ledger.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="mb-3 text-sm text-destructive">No se pudieron cargar los pagos. Revisa tu conexión e inténtalo de nuevo.</p>
          <Button variant="outline" onClick={() => ledger.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <>
          <LedgerKpiCards kpis={kpis} totalReceivable={totalReceivable} pendingEnrollments={pendingEnrollments} />

          <Tabs defaultValue="ledger">
            <TabsList>
              <TabsTrigger value="ledger">Pagos</TabsTrigger>
              <TabsTrigger value="receivables">Cuentas por cobrar ({receivables.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="ledger" className="mt-4 space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_12rem_12rem_auto] md:items-end">
                <div className="space-y-1">
                  <Label htmlFor="ledger-search">Estudiante</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input
                      id="ledger-search"
                      className="pl-9"
                      placeholder="Buscar por nombre o referencia"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setShown(PAGE);
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ledger-course">Curso</Label>
                  <Select
                    value={courseId}
                    onValueChange={(v) => {
                      setCourseId(v);
                      setShown(PAGE);
                    }}
                  >
                    <SelectTrigger id="ledger-course">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los cursos</SelectItem>
                      {courseList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ledger-method">Medio de pago</Label>
                  <Select
                    value={method}
                    onValueChange={(v) => {
                      setMethod(v);
                      setShown(PAGE);
                    }}
                  >
                    <SelectTrigger id="ledger-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los medios</SelectItem>
                      {methods.map((m) => (
                        <SelectItem key={m} value={m}>
                          {paymentMethodLabels[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch id="include-voided" checked={includeVoided} onCheckedChange={setIncludeVoided} />
                  <Label htmlFor="include-voided">Incluir anulados</Label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{filtered.length} pagos</p>
                <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
                  <Download className="mr-1 h-4 w-4" /> Exportar CSV
                </Button>
              </div>

              {filtered.length === 0 ? (
                <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                  No hay pagos para este período y filtros.
                </p>
              ) : (
                <>
                  <LedgerTable payments={visible} staffNames={staffNames} onVoid={setVoidTarget} />
                  {filtered.length > shown && (
                    <div className="text-center">
                      <Button variant="outline" onClick={() => setShown((n) => n + PAGE)}>
                        Cargar más ({filtered.length - shown} restantes)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="receivables" className="mt-4">
              {receivables.length === 0 ? (
                <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                  No hay saldos pendientes. Todo está al día.
                </p>
              ) : (
                <ReceivablesList items={receivables} onRegisterPayment={(item) => openRegister(item.enrollmentId)} />
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      <RegisterPaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        targets={targets}
        initialEnrollmentId={payEnrollmentId}
        submitting={createPayment.isPending}
        onSubmit={async ({ target, amount, method: paymentMethod, paidAt, reference, notes }) => {
          try {
            const result = await createPayment.mutateAsync({
              enrollmentId: target.enrollmentId,
              courseId: target.courseId,
              amount,
              method: paymentMethod,
              paidAt,
              reference,
              notes,
              statusBefore: target.status,
            });
            toast.success(result.activated ? 'Pago registrado — acceso habilitado automáticamente' : 'Pago registrado');
            setPayOpen(false);
          } catch (e) {
            console.error(e);
            toast.error('No se pudo registrar el pago');
          }
        }}
      />

      <VoidPaymentDialog
        open={!!voidTarget}
        onOpenChange={(open) => !open && setVoidTarget(null)}
        summary={voidTarget ? { amount: voidTarget.amount, studentName: voidTarget.student_name, courseTitle: voidTarget.course_title } : null}
        submitting={voidPayment.isPending}
        onConfirm={async (reason) => {
          if (!voidTarget) return;
          try {
            await voidPayment.mutateAsync({ paymentId: voidTarget.id, reason, courseId: voidTarget.course_id });
            toast.success('Pago anulado');
            setVoidTarget(null);
          } catch (e) {
            console.error(e);
            toast.error('No se pudo anular el pago');
          }
        }}
      />
    </div>
  );
};
