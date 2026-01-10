import { useState, useEffect } from 'react';
import { Lesson, useCreateLesson, useUpdateLesson, useDeleteLesson } from '@/hooks/useCourses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Trash2, PlayCircle, FileText, Type, ImageIcon, Link, HelpCircle } from 'lucide-react';
import { FileUploader } from '@/components/admin/FileUploader';
import { AttachmentsManager, Attachment } from './AttachmentsManager';

interface LessonEditorProps {
  courseId: string;
  moduleId: string;
  lesson: Lesson | null;
  lessonCount: number;
  open: boolean;
  onClose: () => void;
}

type LessonType = 'video' | 'pdf' | 'text' | 'image' | 'link' | 'quiz';

const lessonTypes = [
  { value: 'video', label: 'Video', icon: PlayCircle },
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'text', label: 'Texto', icon: Type },
  { value: 'image', label: 'Imagen', icon: ImageIcon },
  { value: 'link', label: 'Enlace', icon: Link },
  { value: 'quiz', label: 'Quiz', icon: HelpCircle },
] as const;

export const LessonEditor = ({
  courseId,
  moduleId,
  lesson,
  lessonCount,
  open,
  onClose,
}: LessonEditorProps) => {
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  const [formData, setFormData] = useState({
    title: '',
    type: 'video' as LessonType,
    content: '',
    duration: '',
    is_required: true,
    order_num: lessonCount,
    thumbnail: '',
    attachments: [] as Attachment[],
  });

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        type: lesson.type,
        content: lesson.content || '',
        duration: lesson.duration || '',
        is_required: lesson.is_required,
        order_num: lesson.order_num,
        thumbnail: (lesson as any).thumbnail || '',
        attachments: (lesson as any).attachments || [],
      });
    } else {
      setFormData({
        title: '',
        type: 'video',
        content: '',
        duration: '',
        is_required: true,
        order_num: lessonCount,
        thumbnail: '',
        attachments: [],
      });
    }
  }, [lesson, lessonCount]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('El título es requerido');
      return;
    }

    try {
      const lessonData = {
        title: formData.title,
        type: formData.type,
        content: formData.content,
        duration: formData.duration || null,
        is_required: formData.is_required,
        order_num: formData.order_num,
        thumbnail: formData.thumbnail || null,
        attachments: formData.attachments,
        module_id: moduleId,
      };

      if (lesson?.id) {
        await updateLesson.mutateAsync({
          id: lesson.id,
          courseId,
          ...lessonData,
        } as any);
        toast.success('Lección actualizada');
      } else {
        await createLesson.mutateAsync({
          courseId,
          ...lessonData,
        } as any);
        toast.success('Lección creada');
      }
      onClose();
    } catch (error) {
      toast.error('Error al guardar la lección');
    }
  };

  const handleDelete = async () => {
    if (!lesson?.id || !confirm('¿Eliminar esta lección?')) return;

    try {
      await deleteLesson.mutateAsync({ lessonId: lesson.id, courseId });
      toast.success('Lección eliminada');
      onClose();
    } catch (error) {
      toast.error('Error al eliminar la lección');
    }
  };

  const renderContentEditor = () => {
    switch (formData.type) {
      case 'video':
        return (
          <div className="space-y-4">
            <FileUploader
              value={formData.content}
              onChange={(url) => setFormData({ ...formData, content: url })}
              contentType="video"
              courseId={courseId}
              placeholder="Video de la lección"
              allowUrl={true}
            />
            <p className="text-xs text-muted-foreground">
              Sube un video MP4/WebM o usa una URL de YouTube/Vimeo
            </p>
          </div>
        );

      case 'pdf':
        return (
          <div className="space-y-4">
            <FileUploader
              value={formData.content}
              onChange={(url) => setFormData({ ...formData, content: url })}
              contentType="pdf"
              courseId={courseId}
              placeholder="Documento PDF"
              allowUrl={true}
            />
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <FileUploader
              value={formData.content}
              onChange={(url) => setFormData({ ...formData, content: url })}
              contentType="image"
              courseId={courseId}
              placeholder="Imagen de la lección"
              allowUrl={true}
            />
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">Contenido</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Escribe el contenido de la lección..."
              rows={10}
            />
          </div>
        );

      case 'link':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">URL del Enlace</label>
            <Input
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="https://ejemplo.com/recurso"
            />
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">Configuración del Quiz (JSON)</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder='{"questions": [...]}'
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Formato JSON para definir las preguntas del quiz
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const isPending = createLesson.isPending || updateLesson.isPending;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lesson ? 'Editar Lección' : 'Nueva Lección'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="content" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Contenido</TabsTrigger>
            <TabsTrigger value="settings">Ajustes</TabsTrigger>
            <TabsTrigger value="attachments">Adjuntos</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6 mt-4">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nombre de la lección"
              />
            </div>

            {/* Type Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Contenido</label>
              <div className="grid grid-cols-3 gap-2">
                {lessonTypes.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: value, content: '' })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      formData.type === value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Editor based on type */}
            {renderContentEditor()}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-4">
            {/* Duration */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Duración</label>
              <Input
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="ej: 10 min, 1 hora"
              />
            </div>

            {/* Required */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <label className="text-sm font-medium">Lección Obligatoria</label>
                <p className="text-sm text-muted-foreground">
                  El estudiante debe completarla para avanzar
                </p>
              </div>
              <Switch
                checked={formData.is_required}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_required: checked })
                }
              />
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Imagen de Preview (opcional)</label>
              <FileUploader
                value={formData.thumbnail}
                onChange={(url) => setFormData({ ...formData, thumbnail: url })}
                contentType="image"
                courseId={courseId}
                placeholder="Thumbnail"
                allowUrl={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="attachments" className="mt-4">
            <AttachmentsManager
              attachments={formData.attachments}
              onChange={(attachments) => setFormData({ ...formData, attachments })}
              courseId={courseId}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
          {lesson && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLesson.isPending}
              className="sm:mr-auto"
            >
              {deleteLesson.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Eliminar
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {lesson ? 'Actualizar' : 'Crear'} Lección
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
