import { format } from 'date-fns';
import { z } from 'zod';

/** Validation of the admin student forms (personal data, account access, creation). */

const phoneRegex = /^\+?[\d\s()-]{7,20}$/;

export const personalDataSchema = z.object({
  name: z.string().trim().min(2, 'Escribe el nombre completo (mínimo 2 letras)').max(120, 'El nombre es demasiado largo'),
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || phoneRegex.test(v), 'Escribe un teléfono válido, por ejemplo 300 123 4567'),
  notes: z.string().max(1000, 'Máximo 1000 caracteres'),
  avatar: z.string(),
});
export type PersonalDataValues = z.infer<typeof personalDataSchema>;

const day = (label: string) => z.string().min(1, `Indica ${label}`).regex(/^\d{4}-\d{2}-\d{2}$/, `Indica ${label}`);

export const accountAccessSchema = z
  .object({
    status: z.enum(['active', 'inactive', 'suspended']),
    enabled_from: day('desde cuándo está habilitada la cuenta'),
    expires_at: day('cuándo expira la cuenta'),
  })
  .refine((v) => !v.enabled_from || !v.expires_at || v.expires_at >= v.enabled_from, {
    message: 'La fecha de expiración no puede ser anterior al inicio',
    path: ['expires_at'],
  });
export type AccountAccessValues = z.infer<typeof accountAccessSchema>;

export const newEnrollmentSchema = z.object({
  course_id: z.string().min(1, 'Elige un curso'),
  agreed_price: z.number().min(0, 'El valor no puede ser negativo'),
  initial_payment: z.number().min(0, 'El abono no puede ser negativo'),
});

export const createStudentSchema = z
  .object({
    email: z.string().trim().email('Escribe un correo válido').max(255),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(72, 'Máximo 72 caracteres'),
    /** Payment method shared by the optional initial payments. */
    initial_method: z.enum(['cash', 'transfer', 'card', 'nequi', 'daviplata', 'other']),
    status: z.enum(['active', 'inactive', 'suspended']),
    enabled_from: day('desde cuándo está habilitada la cuenta'),
    expires_at: day('cuándo expira la cuenta'),
    enrollments: z.array(newEnrollmentSchema),
  })
  .merge(personalDataSchema)
  .superRefine((value, ctx) => {
    if (value.expires_at < value.enabled_from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expires_at'],
        message: 'La fecha de expiración no puede ser anterior al inicio',
      });
    }
    const seen = new Set<string>();
    value.enrollments.forEach((e, i) => {
      if (seen.has(e.course_id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['enrollments', i, 'course_id'], message: 'Este curso ya está en la lista' });
      }
      seen.add(e.course_id);
      if (e.initial_payment > e.agreed_price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['enrollments', i, 'initial_payment'],
          message: 'El abono no puede superar el valor acordado',
        });
      }
    });
  });
export type CreateStudentValues = z.infer<typeof createStudentSchema>;

/** `yyyy-MM-dd` from a date input to an ISO instant: start or end of that local day. */
export const dayToIso = (value: string, edge: 'start' | 'end'): string =>
  new Date(`${value}T${edge === 'start' ? '00:00:00' : '23:59:59'}`).toISOString();

export const isoToDay = (iso: string | null | undefined): string => (iso ? format(new Date(iso), 'yyyy-MM-dd') : '');
