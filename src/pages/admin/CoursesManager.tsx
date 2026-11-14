import { useNavigate } from 'react-router-dom';
import { useCourses, useDeleteCourse, Course } from '@/hooks/useCourses';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, BookOpen, Clock, Loader2, Eye, Users, ClipboardList } from 'lucide-react';

export const CoursesManager = () => {
  const navigate = useNavigate();
  const { data: courses = [], isLoading } = useCourses();
  const deleteCourse = useDeleteCourse();

  const handleDeleteCourse = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.')) {
      try {
        await deleteCourse.mutateAsync(id);
        toast.success('Curso eliminado');
      } catch (error) {
        toast.error('Error al eliminar el curso');
      }
    }
  };

  const statusColors = {
    published: 'bg-green-500/10 text-green-600 border-green-200',
    draft: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    archived: 'bg-gray-500/10 text-gray-600 border-gray-200',
  };

  const statusLabels = {
    published: 'Publicado',
    draft: 'Borrador',
    archived: 'Archivado',
  };

  const levelLabels = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Cursos</h1>
          <p className="text-muted-foreground">Crea y administra el contenido de la academia</p>
        </div>
        <Button className="gap-2" onClick={() => navigate('/admin/cursos/nuevo')}>
          <Plus className="w-4 h-4" />
          Nuevo Curso
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{courses.length}</p>
              <p className="text-sm text-muted-foreground">Total Cursos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {courses.filter((c) => c.status === 'published').length}
              </p>
              <p className="text-sm text-muted-foreground">Publicados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Edit className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {courses.filter((c) => c.status === 'draft').length}
              </p>
              <p className="text-sm text-muted-foreground">Borradores</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-gray-500/10 rounded-lg">
              <Users className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {courses.filter((c) => c.status === 'archived').length}
              </p>
              <p className="text-sm text-muted-foreground">Archivados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course List */}
      <div className="grid gap-4">
        {courses.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay cursos creados</h3>
              <p className="text-muted-foreground mb-6">
                Crea tu primer curso para empezar a compartir conocimiento
              </p>
              <Button onClick={() => navigate('/admin/cursos/nuevo')}>
                <Plus className="w-4 h-4 mr-2" />
                Crear primer curso
              </Button>
            </CardContent>
          </Card>
        ) : (
          courses.map((course) => (
            <Card
              key={course.id}
              className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => navigate(`/admin/cursos/${course.id}`)}
            >
              <CardContent className="p-0">
                <div className="flex gap-0">
                  {/* Cover Image */}
                  <div className="w-48 h-36 flex-shrink-0 bg-muted overflow-hidden">
                    {course.cover_image ? (
                      <img
                        src={course.cover_image}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <BookOpen className="w-12 h-12 text-primary/40" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={statusColors[course.status]}>
                            {statusLabels[course.status]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {levelLabels[course.level]}
                          </Badge>
                          {course.category && (
                            <Badge variant="secondary" className="text-xs">
                              {course.category}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                          {course.description || 'Sin descripción'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/cursos/${course.id}/grupo`);
                          }}
                        >
                          <ClipboardList className="w-4 h-4" />
                          <span className="hidden sm:inline">Grupo y asistencia</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/cursos/${course.id}`);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => handleDeleteCourse(course.id, e)}
                          disabled={deleteCourse.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      {course.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {course.duration}
                        </span>
                      )}
                      {course.price > 0 && (
                        <span className="font-medium text-foreground">
                          ${course.price.toLocaleString()}
                        </span>
                      )}
                      {course.price === 0 && (
                        <span className="text-green-600 font-medium">Gratis</span>
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
