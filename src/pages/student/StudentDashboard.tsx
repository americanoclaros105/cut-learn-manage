import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getCourses, getUserById, getStudentProgress } from '@/lib/storage';
import { Course, StudentProgress } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, PlayCircle, CheckCircle, Lock } from 'lucide-react';

const levelLabels = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [assignedCourseIds, setAssignedCourseIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    const fullUser = getUserById(user.id);
    if (fullUser) {
      setAssignedCourseIds(fullUser.assignedCourses);
    }

    const allCourses = getCourses();
    setCourses(allCourses.filter((c) => c.status === 'published'));

    const studentProgress = getStudentProgress(user.id);
    setProgress(studentProgress || null);
  }, [user]);

  const getCourseProgress = (courseId: string) => {
    if (!progress) return { completed: 0, total: 0, percentage: 0 };

    const courseProgress = progress.courses.find((c) => c.courseId === courseId);
    const course = courses.find((c) => c.id === courseId);

    if (!course) return { completed: 0, total: 0, percentage: 0 };

    const totalLessons = course.modules.reduce((a, m) => a + m.lessons.length, 0);
    const completedLessons = courseProgress?.lessonCompleted.length || 0;
    const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return { completed: completedLessons, total: totalLessons, percentage };
  };

  const isAssigned = (courseId: string) => assignedCourseIds.includes(courseId);

  const assignedCourses = courses.filter((c) => isAssigned(c.id));
  const otherCourses = courses.filter((c) => !isAssigned(c.id));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">¡Hola, {user?.name}!</h1>
        <p className="text-muted-foreground">Continúa con tu aprendizaje</p>
      </div>

      {/* Assigned Courses */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Mis Cursos</h2>
        {assignedCourses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                Aún no tienes cursos asignados. Contacta al administrador.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedCourses.map((course) => {
              const { completed, total, percentage } = getCourseProgress(course.id);
              return (
                <Card
                  key={course.id}
                  className="border-0 shadow-lg overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => navigate(`/estudiante/curso/${course.id}`)}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={course.coverImage}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {percentage === 100 && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-green-500 text-white gap-1">
                          <CheckCircle className="w-3 h-3" /> Completado
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <Badge variant="outline" className="mb-2">
                      {levelLabels[course.level]}
                    </Badge>
                    <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" /> {total} lecciones
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-medium">
                          {completed}/{total}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                    <Button className="w-full mt-4 gap-2">
                      <PlayCircle className="w-4 h-4" />
                      {percentage === 0 ? 'Comenzar' : 'Continuar'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Other Available Courses */}
      {otherCourses.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Otros Cursos Disponibles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherCourses.map((course) => (
              <Card key={course.id} className="border-0 shadow-md overflow-hidden opacity-75">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-accent/60 flex items-center justify-center">
                    <Lock className="w-10 h-10 text-accent-foreground" />
                  </div>
                </div>
                <CardContent className="p-5">
                  <Badge variant="outline" className="mb-2">
                    {levelLabels[course.level]}
                  </Badge>
                  <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {course.description}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Contacta al administrador para obtener acceso
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
