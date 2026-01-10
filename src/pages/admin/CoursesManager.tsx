import { useState, useEffect } from 'react';
import { getCourses, saveCourses, generateId } from '@/lib/storage';
import { Course, Module, Lesson } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, BookOpen, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export const CoursesManager = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  useEffect(() => {
    setCourses(getCourses());
  }, []);

  const defaultCourse: Course = {
    id: '',
    title: '',
    description: '',
    coverImage: '',
    duration: '',
    level: 'beginner',
    price: 0,
    status: 'draft',
    category: '',
    tags: [],
    modules: [],
    createdAt: '',
    updatedAt: '',
  };

  const handleSaveCourse = () => {
    if (!editingCourse?.title) {
      toast.error('El título es requerido');
      return;
    }

    let updatedCourses: Course[];
    if (editingCourse.id) {
      updatedCourses = courses.map((c) =>
        c.id === editingCourse.id ? { ...editingCourse, updatedAt: new Date().toISOString() } : c
      );
    } else {
      const newCourse = {
        ...editingCourse,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedCourses = [...courses, newCourse];
    }

    saveCourses(updatedCourses);
    setCourses(updatedCourses);
    setEditingCourse(null);
    setIsDialogOpen(false);
    toast.success('Curso guardado correctamente');
  };

  const handleDeleteCourse = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este curso?')) {
      const updated = courses.filter((c) => c.id !== id);
      saveCourses(updated);
      setCourses(updated);
      toast.success('Curso eliminado');
    }
  };

  const handleAddModule = () => {
    if (!editingCourse) return;
    const newModule: Module = {
      id: generateId(),
      title: 'Nuevo Módulo',
      order: editingCourse.modules.length + 1,
      lessons: [],
    };
    setEditingCourse({
      ...editingCourse,
      modules: [...editingCourse.modules, newModule],
    });
  };

  const handleAddLesson = (moduleId: string) => {
    if (!editingCourse) return;
    const newLesson: Lesson = {
      id: generateId(),
      title: 'Nueva Lección',
      type: 'text',
      content: '',
      isRequired: true,
      order: 1,
    };
    setEditingCourse({
      ...editingCourse,
      modules: editingCourse.modules.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: [...m.lessons, { ...newLesson, order: m.lessons.length + 1 }] }
          : m
      ),
    });
  };

  const statusColors = {
    published: 'bg-green-500/10 text-green-600',
    draft: 'bg-yellow-500/10 text-yellow-600',
    archived: 'bg-gray-500/10 text-gray-600',
  };

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
                      value={editingCourse.title}
                      onChange={(e) =>
                        setEditingCourse({ ...editingCourse, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Categoría</label>
                    <Input
                      value={editingCourse.category}
                      onChange={(e) =>
                        setEditingCourse({ ...editingCourse, category: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <Textarea
                    value={editingCourse.description}
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
                      value={editingCourse.level}
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
                      value={editingCourse.status}
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
                      value={editingCourse.duration}
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
                    value={editingCourse.coverImage}
                    onChange={(e) =>
                      setEditingCourse({ ...editingCourse, coverImage: e.target.value })
                    }
                  />
                </div>

                {/* Modules */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Módulos y Lecciones</h3>
                    <Button size="sm" variant="outline" onClick={handleAddModule}>
                      <Plus className="w-4 h-4 mr-1" /> Módulo
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {editingCourse.modules.map((module, mIndex) => (
                      <Card key={module.id} className="bg-secondary/50">
                        <CardContent className="p-4">
                          <Input
                            value={module.title}
                            onChange={(e) => {
                              const updated = [...editingCourse.modules];
                              updated[mIndex].title = e.target.value;
                              setEditingCourse({ ...editingCourse, modules: updated });
                            }}
                            className="mb-3 font-medium"
                          />
                          <div className="space-y-2 ml-4">
                            {module.lessons.map((lesson, lIndex) => (
                              <div key={lesson.id} className="flex gap-2 items-center">
                                <Input
                                  value={lesson.title}
                                  onChange={(e) => {
                                    const updated = [...editingCourse.modules];
                                    updated[mIndex].lessons[lIndex].title = e.target.value;
                                    setEditingCourse({ ...editingCourse, modules: updated });
                                  }}
                                  className="flex-1"
                                  placeholder="Título de la lección"
                                />
                                <Select
                                  value={lesson.type}
                                  onValueChange={(value: Lesson['type']) => {
                                    const updated = [...editingCourse.modules];
                                    updated[mIndex].lessons[lIndex].type = value;
                                    setEditingCourse({ ...editingCourse, modules: updated });
                                  }}
                                >
                                  <SelectTrigger className="w-28">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="text">Texto</SelectItem>
                                    <SelectItem value="pdf">PDF</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAddLesson(module.id)}
                              className="text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" /> Lección
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveCourse}>Guardar Curso</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {courses.map((course) => (
          <Card key={course.id} className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex gap-6">
                {course.coverImage && (
                  <img
                    src={course.coverImage}
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
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {course.duration}
                    </span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />{' '}
                      {course.modules.reduce((a, m) => a + m.lessons.length, 0)} lecciones
                    </span>
                  </div>
                </div>
              </div>

              {/* Expandable modules */}
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() =>
                  setExpandedCourse(expandedCourse === course.id ? null : course.id)
                }
              >
                {expandedCourse === course.id ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" /> Ocultar módulos
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" /> Ver módulos
                  </>
                )}
              </Button>

              {expandedCourse === course.id && (
                <div className="mt-4 ml-4 space-y-2">
                  {course.modules.map((module) => (
                    <div key={module.id} className="border-l-2 border-primary/20 pl-4">
                      <p className="font-medium">{module.title}</p>
                      <ul className="text-sm text-muted-foreground ml-4">
                        {module.lessons.map((lesson) => (
                          <li key={lesson.id}>• {lesson.title}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};