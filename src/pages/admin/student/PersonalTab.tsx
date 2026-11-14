import { useMemo } from 'react';
import { toast } from 'sonner';
import { PersonalDataForm } from '@/components/admin/students/detail/PersonalDataForm';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useUpdateStudent, type StudentProfile } from '@/hooks/useStudents';
import type { PersonalDataValues } from '@/lib/studentSchemas';

interface PersonalTabProps {
  student: StudentProfile;
  onDirtyChange: (dirty: boolean) => void;
}

export const PersonalTab = ({ student, onDirtyChange }: PersonalTabProps) => {
  const updateStudent = useUpdateStudent();
  const { uploadImage, isUploading } = useImageUpload({ bucket: 'landing-images' });

  const defaultValues = useMemo<PersonalDataValues>(
    () => ({
      name: student.name,
      phone: student.phone ?? '',
      notes: student.notes ?? '',
      avatar: student.avatar ?? '',
    }),
    [student.name, student.phone, student.notes, student.avatar],
  );

  const handleSubmit = async (values: PersonalDataValues) => {
    try {
      await updateStudent.mutateAsync({
        id: student.id,
        name: values.name,
        phone: values.phone || null,
        avatar: values.avatar || null,
        notes: values.notes || null,
      });
      toast.success('Datos personales guardados');
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron guardar los datos. Tus cambios siguen aquí, inténtalo de nuevo.');
      throw e;
    }
  };

  const handleUpload = async (file: File): Promise<string | null> => {
    const result = await uploadImage(file);
    if (!result) toast.error('No se pudo subir la foto. Usa una imagen JPG, PNG o WebP de máximo 2 MB.');
    return result?.url ?? null;
  };

  return (
    <PersonalDataForm
      defaultValues={defaultValues}
      saving={updateStudent.isPending}
      uploadingAvatar={isUploading}
      onUploadAvatar={handleUpload}
      onSubmit={handleSubmit}
      onDirtyChange={onDirtyChange}
    />
  );
};
