import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { accountAccessSchema, type AccountAccessValues } from '@/lib/studentSchemas';
import { accountStatusHelp } from './accountStatusHelp';
import { Field } from './Field';
import { fieldProps } from './fieldProps';

interface AccountAccessFormProps {
  defaultValues: AccountAccessValues;
  saving: boolean;
  onSubmit: (values: AccountAccessValues) => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
}

/** Account state and validity window. The status gates every course of the student. */
export const AccountAccessForm = ({ defaultValues, saving, onSubmit, onDirtyChange }: AccountAccessFormProps) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<AccountAccessValues>({ resolver: zodResolver(accountAccessSchema), defaultValues });

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!isDirty) reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues]);

  const status = watch('status');

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      reset(values);
    } catch {
      // The container already reported the error; keep the edits so the admin can retry.
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Estado de la cuenta</CardTitle>
          <CardDescription>Controla si el estudiante puede entrar a la plataforma y durante qué fechas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="account-status" label="Estado" hint={accountStatusHelp[status]}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="account-status" aria-describedby="account-status-hint">
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
            <Field id="account-from" label="Habilitado desde" error={errors.enabled_from?.message}>
              <Input {...fieldProps('account-from', errors.enabled_from?.message)} type="date" {...register('enabled_from')} />
            </Field>
            <Field
              id="account-until"
              label="Expira"
              error={errors.expires_at?.message}
              hint="El estudiante pierde el acceso al pasar esta fecha."
            >
              <Input {...fieldProps('account-until', errors.expires_at?.message, true)} type="date" {...register('expires_at')} />
            </Field>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button type="button" variant="ghost" disabled={!isDirty || saving} onClick={() => reset(defaultValues)}>
            Descartar cambios
          </Button>
          <Button type="submit" disabled={!isDirty || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar acceso
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
