import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AccountAccessForm } from '@/components/admin/students/detail/AccountAccessForm';
import { AccountSecurityCards } from '@/components/admin/students/detail/AccountSecurityCards';
import { DeleteStudentDialog } from '@/components/admin/students/detail/DeleteStudentDialog';
import { PasswordDialog } from '@/components/admin/students/PasswordDialog';
import {
  useDeleteStudent,
  useUpdateStudent,
  useUpdateStudentPassword,
  type StudentProfile,
} from '@/hooks/useStudents';
import type { DeleteImpact } from '@/lib/studentDetail';
import { dayToIso, isoToDay, type AccountAccessValues } from '@/lib/studentSchemas';

interface AccessTabProps {
  student: StudentProfile;
  impact: DeleteImpact;
  onDirtyChange: (dirty: boolean) => void;
  onDeleted: () => void;
}

export const AccessTab = ({ student, impact, onDirtyChange, onDeleted }: AccessTabProps) => {
  const updateStudent = useUpdateStudent();
  const updatePassword = useUpdateStudentPassword();
  const deleteStudent = useDeleteStudent();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const defaultValues = useMemo<AccountAccessValues>(
    () => ({
      status: student.status,
      enabled_from: isoToDay(student.enabled_from),
      expires_at: isoToDay(student.expires_at),
    }),
    [student.status, student.enabled_from, student.expires_at],
  );

  const handleSubmit = async (values: AccountAccessValues) => {
    try {
      await updateStudent.mutateAsync({
        id: student.id,
        status: values.status,
        enabled_from: dayToIso(values.enabled_from, 'start'),
        expires_at: dayToIso(values.expires_at, 'end'),
      });
      toast.success('Acceso de la cuenta actualizado');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo actualizar el acceso. Tus cambios siguen aquí, inténtalo de nuevo.');
      throw e;
    }
  };

  const handlePassword = async (password: string) => {
    try {
      await updatePassword.mutateAsync({ studentId: student.id, newPassword: password });
      toast.success('Contraseña actualizada correctamente');
      setPasswordOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(`No se pudo actualizar la contraseña${e instanceof Error ? `: ${e.message}` : ''}`);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStudent.mutateAsync(student.id);
      toast.success('Estudiante eliminado');
      onDeleted();
    } catch (e) {
      console.error(e);
      toast.error(`No se pudo eliminar al estudiante${e instanceof Error ? `: ${e.message}` : ''}`);
    }
  };

  return (
    <div className="space-y-4">
      <AccountAccessForm
        defaultValues={defaultValues}
        saving={updateStudent.isPending}
        onSubmit={handleSubmit}
        onDirtyChange={onDirtyChange}
      />
      <AccountSecurityCards onChangePassword={() => setPasswordOpen(true)} onDelete={() => setDeleteOpen(true)} />

      <PasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        studentName={student.name}
        onSave={handlePassword}
        isLoading={updatePassword.isPending}
      />
      <DeleteStudentDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        studentName={student.name}
        impact={impact}
        deleting={deleteStudent.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
};
