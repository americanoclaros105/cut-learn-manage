import { useEffect, useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CourseGroupPicker } from '@/components/admin/groups/CourseGroupPicker';
import { MoneyInput } from '@/components/admin/operations/MoneyInput';
import { enrollmentDefaults } from '@/lib/groupPicker';
import { formatMoneyInput } from '@/lib/money';
import { formatCOP, paymentMethodLabels } from '@/lib/operations';
import { defaultAccessDates } from '@/lib/studentDetail';
import { createStudentSchema, type CreateStudentValues } from '@/lib/studentSchemas';
import type { CourseGroupWithStats, PaymentMethod } from '@/types';
import { accountStatusHelp } from './accountStatusHelp';
import type { EnrollableCourse } from './AddEnrollmentDialog';
import { Field } from './Field';
import { fieldProps } from './fieldProps';
import { PasswordField } from './PasswordField';

interface NewStudentFormProps {
  courses: EnrollableCourse[];
  saving: boolean;
  onSubmit: (values: CreateStudentValues) => Promise<void>;
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

const methods = Object.keys(paymentMethodLabels) as PaymentMethod[];
const moneyText = (value: number) => (value > 0 ? formatMoneyInput(value) : '');

/** Single-page creation form: personal data, credentials, account access and optional enrollments. */
export const NewStudentForm = ({ courses, saving, onSubmit, onCancel, onDirtyChange }: NewStudentFormProps) => {
  const defaultValues = useMemo<CreateStudentValues>(
    () => ({
      name: '',
      phone: '',
      notes: '',
      avatar: '',
      email: '',
      password: '',
      initial_method: 'cash',
      status: 'active',
      ...defaultAccessDates(),
      enrollments: [],
    }),
    [],
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<CreateStudentValues>({ resolver: zodResolver(createStudentSchema), defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: 'enrollments' });

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);

  const status = watch('status');
  const picked = watch('enrollments');
  const hasInitialPayment = picked.some((e) => e.initial_payment > 0);
  const allPicked = picked.length >= courses.length;

  // Picking a group prefills the agreed price and the access window (still editable); none restores the course price.
  const pickGroup = (index: number, courseId: string, group: CourseGroupWithStats | null) => {
    const defaults = enrollmentDefaults(group, courses.find((c) => c.id === courseId)?.price ?? 0);
    const opts = { shouldDirty: true };
    setValue(`enrollments.${index}.group_id`, group?.id ?? '', opts);
    setValue(`enrollments.${index}.agreed_price`, defaults.agreedPrice, opts);
    setValue(`enrollments.${index}.enabled_from`, defaults.enabledFrom ?? '', opts);
    setValue(`enrollments.${index}.expires_at`, defaults.expiresAt ?? '', opts);
  };

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch {
      // The container already reported the error; keep the form so the admin can retry.
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
          <CardDescription>Cómo se identifica y cómo contactar al estudiante.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="new-name" label="Nombre completo *" error={errors.name?.message}>
              <Input {...fieldProps('new-name', errors.name?.message)} autoComplete="off" autoFocus {...register('name')} />
            </Field>
            <Field id="new-phone" label="Teléfono / WhatsApp" error={errors.phone?.message}>
              <Input {...fieldProps('new-phone', errors.phone?.message)} type="tel" inputMode="tel" placeholder="300 123 4567" {...register('phone')} />
            </Field>
          </div>
          <Field id="new-notes" label="Notas internas" error={errors.notes?.message}>
            <Textarea {...fieldProps('new-notes', errors.notes?.message)} rows={3} {...register('notes')} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credenciales de acceso</CardTitle>
          <CardDescription>Con estos datos el estudiante inicia sesión. El correo no se podrá cambiar después.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="new-email" label="Correo electrónico *" error={errors.email?.message}>
            <Input
              {...fieldProps('new-email', errors.email?.message)}
              type="email"
              autoComplete="off"
              placeholder="estudiante@correo.com"
              {...register('email')}
            />
          </Field>
          <Field
            id="new-password"
            label="Contraseña *"
            error={errors.password?.message}
            hint="Genera una y cópiala para enviársela. No se podrá consultar después, solo cambiar."
          >
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <PasswordField
                  id="new-password"
                  value={field.value}
                  error={errors.password?.message}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estado de la cuenta</CardTitle>
          <CardDescription>Controla si puede entrar a la plataforma y durante qué fechas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="new-status" label="Estado" hint={accountStatusHelp[status]}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="new-status" aria-describedby="new-status-hint">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="suspended">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="new-from" label="Habilitado desde" error={errors.enabled_from?.message}>
              <Input {...fieldProps('new-from', errors.enabled_from?.message)} type="date" {...register('enabled_from')} />
            </Field>
            <Field id="new-until" label="Expira" error={errors.expires_at?.message}>
              <Input {...fieldProps('new-until', errors.expires_at?.message)} type="date" {...register('expires_at')} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inscripciones iniciales (opcional)</CardTitle>
          <CardDescription>
            Cada curso queda pendiente de pago y su acceso se activa automáticamente cuando el estudiante completa el valor
            acordado. Con valor $0 se activa de inmediato. También puedes inscribirlo más tarde desde su perfil.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay cursos en la lista.</p>}

          {fields.map((item, index) => {
            const rowErrors = errors.enrollments?.[index];
            const takenElsewhere = new Set(picked.filter((_, i) => i !== index).map((e) => e.course_id));
            return (
              <fieldset key={item.id} className="space-y-3 rounded-lg border p-3">
                <legend className="px-1 text-sm font-medium">Curso {index + 1}</legend>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Field id={`new-course-${index}`} label="Curso" error={rowErrors?.course_id?.message}>
                    <Controller
                      control={control}
                      name={`enrollments.${index}.course_id`}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(id) => {
                            field.onChange(id);
                            // The groups belong to the course: reset the group (and its prefilled dates) too.
                            pickGroup(index, id, null);
                          }}
                        >
                          <SelectTrigger id={`new-course-${index}`} aria-invalid={rowErrors?.course_id ? true : undefined}>
                            <SelectValue placeholder="Elige un curso" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses
                              .filter((c) => !takenElsewhere.has(c.id))
                              .map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.title} · {formatCOP(c.price)}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="self-end text-destructive hover:text-destructive"
                    aria-label={`Quitar curso ${index + 1}`}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {picked[index]?.course_id && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Grupo</p>
                    <CourseGroupPicker
                      idPrefix={`new-group-${index}`}
                      courseId={picked[index].course_id}
                      coursePrice={courses.find((c) => c.id === picked[index].course_id)?.price ?? 0}
                      value={picked[index]?.group_id ?? ''}
                      onChange={(group) => pickGroup(index, picked[index].course_id, group)}
                    />
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id={`new-price-${index}`} label="Valor acordado (COP)" error={rowErrors?.agreed_price?.message}>
                    <Controller
                      control={control}
                      name={`enrollments.${index}.agreed_price`}
                      render={({ field }) => (
                        <MoneyInput
                          id={`new-price-${index}`}
                          value={moneyText(field.value)}
                          placeholder="0"
                          onChange={(_, amount) => field.onChange(amount)}
                        />
                      )}
                    />
                  </Field>
                  <Field
                    id={`new-paid-${index}`}
                    label="Abono inicial (COP)"
                    error={rowErrors?.initial_payment?.message}
                    hint="Opcional: se registra como pago al crear."
                  >
                    <Controller
                      control={control}
                      name={`enrollments.${index}.initial_payment`}
                      render={({ field }) => (
                        <MoneyInput
                          id={`new-paid-${index}`}
                          value={moneyText(field.value)}
                          placeholder="0"
                          onChange={(_, amount) => field.onChange(amount)}
                        />
                      )}
                    />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id={`new-enroll-from-${index}`} label="Acceso desde (opcional)" error={rowErrors?.enabled_from?.message}>
                    <Input
                      {...fieldProps(`new-enroll-from-${index}`, rowErrors?.enabled_from?.message)}
                      type="date"
                      {...register(`enrollments.${index}.enabled_from`)}
                    />
                  </Field>
                  <Field id={`new-enroll-until-${index}`} label="Acceso hasta (opcional)" error={rowErrors?.expires_at?.message}>
                    <Input
                      {...fieldProps(`new-enroll-until-${index}`, rowErrors?.expires_at?.message)}
                      type="date"
                      {...register(`enrollments.${index}.expires_at`)}
                    />
                  </Field>
                </div>
              </fieldset>
            );
          })}

          <Button
            type="button"
            variant="outline"
            disabled={courses.length === 0 || allPicked}
            onClick={() => append({ course_id: '', agreed_price: 0, initial_payment: 0, group_id: '', enabled_from: '', expires_at: '' })}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden /> Agregar curso
          </Button>
          {courses.length === 0 && <p className="text-sm text-muted-foreground">No hay cursos publicados para inscribir.</p>}

          {hasInitialPayment && (
            <Field id="new-method" label="Medio de pago de los abonos">
              <Controller
                control={control}
                name="initial_method"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="new-method" className="sm:max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {methods.map((m) => (
                        <SelectItem key={m} value={m}>
                          {paymentMethodLabels[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear estudiante
        </Button>
      </div>
    </form>
  );
};
