import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { initialsOf } from '@/lib/studentDetail';
import { personalDataSchema, type PersonalDataValues } from '@/lib/studentSchemas';
import { Field } from './Field';
import { fieldProps } from './fieldProps';

interface PersonalDataFormProps {
  defaultValues: PersonalDataValues;
  saving: boolean;
  uploadingAvatar: boolean;
  onUploadAvatar: (file: File) => Promise<string | null>;
  onSubmit: (values: PersonalDataValues) => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
}

/** Name, phone, notes and photo. Save stays disabled until something changes. */
export const PersonalDataForm = ({
  defaultValues,
  saving,
  uploadingAvatar,
  onUploadAvatar,
  onSubmit,
  onDirtyChange,
}: PersonalDataFormProps) => {
  const form = useForm<PersonalDataValues>({ resolver: zodResolver(personalDataSchema), defaultValues });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = form;

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);

  // Keep the form in sync when the saved profile changes (after save or refetch) and nothing is being edited.
  useEffect(() => {
    if (!isDirty) reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues]);

  const name = watch('name');
  const avatar = watch('avatar');

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      reset(values);
    } catch {
      // The container already reported the error; keep the edits so the admin can retry.
    }
  });

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const url = await onUploadAvatar(file);
    if (url) setValue('avatar', url, { shouldDirty: true });
  };

  return (
    <form onSubmit={submit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
          <CardDescription>Cómo se identifica y cómo contactar al estudiante.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-muted">
              <AvatarImage src={avatar || undefined} alt="" />
              <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">{initialsOf(name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" disabled={uploadingAvatar} asChild>
                <label className="cursor-pointer">
                  {uploadingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Subir foto
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleFile} />
                </label>
              </Button>
              {avatar && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setValue('avatar', '', { shouldDirty: true })}>
                  Quitar foto
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="student-name" label="Nombre completo *" error={errors.name?.message}>
              <Input {...fieldProps('student-name', errors.name?.message)} autoComplete="off" {...register('name')} />
            </Field>
            <Field id="student-phone" label="Teléfono / WhatsApp" error={errors.phone?.message} hint="Con indicativo si es de otro país.">
              <Input
                {...fieldProps('student-phone', errors.phone?.message, true)}
                type="tel"
                inputMode="tel"
                placeholder="300 123 4567"
                {...register('phone')}
              />
            </Field>
          </div>

          <Field id="student-notes" label="Notas internas" error={errors.notes?.message} hint="Solo las ve el equipo de la academia.">
            <Textarea {...fieldProps('student-notes', errors.notes?.message, true)} rows={4} {...register('notes')} />
          </Field>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button type="button" variant="ghost" disabled={!isDirty || saving} onClick={() => reset(defaultValues)}>
            Descartar cambios
          </Button>
          <Button type="submit" disabled={!isDirty || saving || uploadingAvatar}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
