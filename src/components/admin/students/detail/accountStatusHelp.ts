import type { AccountAccessValues } from '@/lib/studentSchemas';

/** What each account status means for the student, shown next to the status selector. */
export const accountStatusHelp: Record<AccountAccessValues['status'], string> = {
  active: 'Puede iniciar sesión y abrir los cursos cuya inscripción esté activa y pagada.',
  inactive: 'No tiene acceso a ningún curso, aunque estén pagados. Sus datos y pagos se conservan.',
  suspended: 'Bloqueo administrativo: no puede abrir ningún curso hasta que lo reactives.',
};
