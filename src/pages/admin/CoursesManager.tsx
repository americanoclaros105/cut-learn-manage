import { useState } from 'react';
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse, Course } from '@/hooks/useCourses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, BookOpen, Clock, Loader2 } from 'lucide-react';

export const CoursesManager = () => {
  const { data: courses = [], isLoading } = useCourses();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const defaultCourse: Partial<Course> = {
    title: '',
    description: '',
    cover_image: '',
    duration: '',
    level: 'beginner',
    price: 0,
    status: 'draft',
    category: '',
    tags: [],
  };

  const handleSaveCourse = async () => {
    if (!editingCourse?.title) {
      toast.error('El título es requerido');
      return;
    }

    try {
      if (editingCourse.id) {
        await updateCourse.mutateAsync(editingCourse as Course);
      } else {
        await createCourse.mutateAsync(editingCourse);
      }
      setEditingCourse(null);
      setIsDialogOpen(false);
      toast.success('Curso guardado correctamente');
    } catch (error) {
      toast.error('Error al guardar el curso');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este curso?')) {
      try {
        await deleteCourse.mutateAsync(id);
        toast.success('Curso eliminado');
      } catch (error) {
        toast.error('Error al eliminar el curso');
      }
    }
  };

  const statusColors = {
    published: 'bg-green-500/10 text-green-600',
    draft: 'bg-yellow-500/10 text-yellow-600',
    archived: 'bg-gray-500/10 text-gray-600',
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Cursos</h1>
          <p className="text-muted-foreground">Crea y administra el contenido de la academia</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              onClick={() => setEditingCourse(defaultCourse)}
            >
              <Plus className="w-4 h-4" />
              Nuevo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCourse?.id ? 'Editar Curso' : 'Nuevo Curso'}
              </DialogTitle>
            </DialogHeader>
            {editingCourse && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Título *</label>
                    <Input
                      value={editingCourse.title || ''}
                      onChange={(e) =>
                        setEditingCourse({ ...editingCourse, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Categoría</label>
                    <Input
                      value={editingCourse.category || ''}
                      onChange={(e) =>
                        setEditingCourse({ ...editingCourse, category: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <Textarea
                    value={editingCourse.description || ''}
                    onChange={(e) =>
                      setEditingCourse({ ...editingCourse, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nivel</label>
                    <Select
                      value={editingCourse.level || 'beginner'}
                      onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') =>
                        setEditingCourse({ ...editingCourse, level: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Principiante</SelectItem>
                        <SelectItem value="intermediate">Intermedio</SelectItem>
                        <SelectItem value="advanced">Avanzado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Estado</label>
                    <Select
                      value={editingCourse.status || 'draft'}
                      onValueChange={(value: 'published' | 'draft' | 'archived') =>
                        setEditingCourse({ ...editingCourse, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="published">Publicado</SelectItem>
                        <SelectItem value="archived">Archivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duración</label>
                    <Input
                      value={editingCourse.duration || ''}
                      onChange={(e) =>
                        setEditingCourse({ ...editingCourse, duration: e.target.value })
                      }
                      placeholder="ej: 8 horas"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">URL de Imagen de Portada</label>
                  <Input
                    value={editingCourse.cover_image || ''}
                    onChange={(e) =>
                      setEditingCourse({ ...editingCourse, cover_image: e.target.value })
                    }
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveCourse}
                    disabled={createCourse.isPending || updateCourse.isPending}
                  >
                    {(createCourse.isPending || updateCourse.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Guardar Curso
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {courses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay cursos creados aún</p>
            </CardContent>
          </Card>
        ) : (
          courses.map((course) => (
            <Card key={course.id} className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {course.cover_image && (
                    <img
                      src={course.cover_image}
                      alt={course.title}
                      className="w-32 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold">{course.title}</h3>
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                          {course.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCourse(course);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => handleDeleteCourse(course.id)}
                          disabled={deleteCourse.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <Badge className={statusColors[course.status]}>
                        {course.status === 'published'
                          ? 'Publicado'
                          : course.status === 'draft'
                          ? 'Borrador'
                          : 'Archivado'}
                      </Badge>
                      {course.duration && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {course.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
