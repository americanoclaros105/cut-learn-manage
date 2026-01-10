import { useState } from 'react';
import { Module, Lesson, useCreateModule, useUpdateModule, useDeleteModule } from '@/hooks/useCourses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Loader2,
  BookOpen,
  PlayCircle,
  FileText,
  File,
  ImageIcon,
  Link,
  HelpCircle,
} from 'lucide-react';
import { LessonEditor } from './LessonEditor';

interface ModulesEditorProps {
  courseId: string;
  modules: Module[];
}

export const ModulesEditor = ({ courseId, modules }: ModulesEditorProps) => {
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();

  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [editingModule, setEditingModule] = useState<Partial<Module> | null>(null);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showLessonEditor, setShowLessonEditor] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleAddModule = () => {
    setEditingModule({
      title: '',
      order_num: modules.length,
      course_id: courseId,
    } as any);
    setShowModuleDialog(true);
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setShowModuleDialog(true);
  };

  const handleSaveModule = async () => {
    if (!editingModule?.title?.trim()) {
      toast.error('El título del módulo es requerido');
      return;
    }

    try {
      if (editingModule.id) {
        await updateModule.mutateAsync({
          id: editingModule.id,
          course_id: courseId,
          title: editingModule.title,
          order_num: editingModule.order_num,
        } as any);
        toast.success('Módulo actualizado');
      } else {
        await createModule.mutateAsync({
          course_id: courseId,
          title: editingModule.title,
          order_num: editingModule.order_num,
        } as any);
        toast.success('Módulo creado');
      }
      setShowModuleDialog(false);
      setEditingModule(null);
    } catch (error) {
      toast.error('Error al guardar el módulo');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('¿Eliminar este módulo y todas sus lecciones?')) return;

    try {
      await deleteModule.mutateAsync({ moduleId, courseId });
      toast.success('Módulo eliminado');
    } catch (error) {
      toast.error('Error al eliminar el módulo');
    }
  };

  const handleAddLesson = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(null);
    setShowLessonEditor(true);
  };

  const handleEditLesson = (moduleId: string, lesson: Lesson) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(lesson);
    setShowLessonEditor(true);
  };

  const getLessonIcon = (type: Lesson['type']) => {
    switch (type) {
      case 'video':
        return <PlayCircle className="w-4 h-4 text-blue-500" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'text':
        return <File className="w-4 h-4 text-gray-500" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-green-500" />;
      case 'link':
        return <Link className="w-4 h-4 text-purple-500" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Módulos y Lecciones</CardTitle>
          <CardDescription>
            Organiza el contenido del curso en módulos con sus lecciones
          </CardDescription>
        </div>
        <Button onClick={handleAddModule} className="gap-2">
          <Plus className="w-4 h-4" />
          Agregar Módulo
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {modules.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No hay módulos creados aún
            </p>
            <Button variant="outline" onClick={handleAddModule}>
              <Plus className="w-4 h-4 mr-2" />
              Crear primer módulo
            </Button>
          </div>
        ) : (
          modules.map((module, index) => (
            <Collapsible
              key={module.id}
              open={expandedModules.has(module.id)}
              onOpenChange={() => toggleModule(module.id)}
            >
              <div className="border rounded-lg">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Módulo {index + 1}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          • {module.lessons?.length || 0} lecciones
                        </span>
                      </div>
                      <h3 className="font-semibold">{module.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditModule(module);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteModule(module.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {expandedModules.has(module.id) ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t p-4 space-y-2 bg-muted/30">
                    {(module.lessons || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay lecciones en este módulo
                      </p>
                    ) : (
                      module.lessons?.map((lesson, lIndex) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 p-3 bg-background rounded-lg border cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => handleEditLesson(module.id, lesson)}
                        >
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          {getLessonIcon(lesson.type)}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{lesson.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="capitalize">{lesson.type}</span>
                              {lesson.duration && <span>• {lesson.duration}</span>}
                              {lesson.is_required && (
                                <span className="text-primary">• Obligatoria</span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditLesson(module.id, lesson);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleAddLesson(module.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Lección
                    </Button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))
        )}
      </CardContent>

      {/* Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingModule?.id ? 'Editar Módulo' : 'Nuevo Módulo'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={editingModule?.title || ''}
                onChange={(e) =>
                  setEditingModule({ ...editingModule, title: e.target.value })
                }
                placeholder="Nombre del módulo"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                value={(editingModule as any)?.description || ''}
                onChange={(e) =>
                  setEditingModule({ ...editingModule, description: e.target.value } as any)
                }
                placeholder="Descripción breve del módulo..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModuleDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveModule}
              disabled={createModule.isPending || updateModule.isPending}
            >
              {(createModule.isPending || updateModule.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Editor Dialog */}
      {showLessonEditor && selectedModuleId && (
        <LessonEditor
          courseId={courseId}
          moduleId={selectedModuleId}
          lesson={editingLesson}
          lessonCount={
            modules.find((m) => m.id === selectedModuleId)?.lessons?.length || 0
          }
          open={showLessonEditor}
          onClose={() => {
            setShowLessonEditor(false);
            setSelectedModuleId(null);
            setEditingLesson(null);
          }}
        />
      )}
    </Card>
  );
};
