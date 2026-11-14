import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCourses } from '@/hooks/useCourses';
import { useMyGroups } from '@/hooks/useMyGroups';
import { GroupScheduleBlock } from '@/components/student/GroupScheduleBlock';
import { useMyEnrollments, useUserProgress } from '@/hooks/useProgress';
import { accessBlockedMessage, formatCOP } from '@/lib/operations';
import { ContactWhatsAppButton } from '@/components/student/ContactWhatsAppButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Lock, CheckCircle, Loader2, Clock, PlayCircle } from 'lucide-react';

const levelLabels = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: allCourses = [], isLoading: loadingCourses } = useCourses({ status: 'published' });
  const { data: enrollments = [], isLoading: loadingAssigned } = useMyEnrollments();
  const { data: progressData = [], isLoading: loadingProgress } = useUserProgress();
  const groupIds = enrollments.map((e) => e.group_id).filter((id): id is string => !!id);
  const { data: groups = [] } = useMyGroups(groupIds);
  const now = new Date();

  /** Group card of the course, when the enrollment has a group the student can read. */
  const groupBlock = (courseId: string) => {
    const enrollment = enrollmentFor(courseId);
    const group = groups.find((g) => g.id === enrollment?.group_id);
    return enrollment && group ? <GroupScheduleBlock group={group} access={enrollment.access} now={now} /> : null;
  };

  const getCourseProgress = (courseId: string) => {
    const courseProgress = progressData.filter(p => p.course_id === courseId);
    return courseProgress.length;
  };

  const enrollmentFor = (courseId: string) => enrollments.find(e => e.course_id === courseId);

  // Only enrollments with active access open the course; the rest show a state card.
  const assignedCourses = allCourses.filter(c => enrollmentFor(c.id)?.access === 'active');
  const blockedCourses = allCourses.filter(c => {
    const e = enrollmentFor(c.id);
    return !!e && e.access !== 'active';
  });
  const otherCourses = allCourses.filter(c => !enrollmentFor(c.id));

  if (loadingCourses || loadingAssigned || loadingProgress) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          ¡Hola, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">Continúa tu aprendizaje</p>
      </div>

      {/* My Courses */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Mis Cursos</h2>
        {assignedCourses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Aún no tienes cursos asignados.
                <br />
                Contacta al administrador para comenzar tu formación.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedCourses.map((course) => {
              const progress = getCourseProgress(course.id);

              return (
                <Card
                  key={course.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-lg"
                  onClick={() => navigate(`/estudiante/curso/${course.id}`)}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={course.cover_image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800'}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {progress > 0 && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          En progreso
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <Badge variant="outline" className="mb-2">
                      {levelLabels[course.level]}
                    </Badge>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      {course.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {course.duration}
                        </span>
                      )}
                    </div>
                    {groupBlock(course.id)}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-medium">{progress} lecciones</span>
                      </div>
                      <Progress value={progress > 0 ? Math.min(progress * 10, 100) : 0} className="h-2" />
                    </div>
                    <Button className="w-full gap-2">
                      <PlayCircle className="w-4 h-4" />
                      {progress > 0 ? 'Continuar' : 'Comenzar'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Enrolled but without access yet (pending payment, suspended, not started, expired) */}
      {blockedCourses.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Inscripciones sin acceso</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blockedCourses.map((course) => {
              const enrollment = enrollmentFor(course.id)!;
              const message = accessBlockedMessage(enrollment.access, enrollment);
              return (
                <Card key={course.id} className="overflow-hidden border-0 shadow-md">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={course.cover_image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800'}
                      alt={course.title}
                      className="w-full h-full object-cover grayscale"
                    />
                    <div className="absolute inset-0 bg-accent/60 flex items-center justify-center">
                      <Lock className="w-10 h-10 text-accent-foreground" />
                    </div>
                  </div>
                  <CardContent className="p-5 space-y-3">
                    <Badge variant="outline">{message.title}</Badge>
                    <h3 className="font-semibold text-lg line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-muted-foreground">{message.detail}</p>
                    {groupBlock(course.id)}
                    {enrollment.access === 'pending' && enrollment.agreed_price > 0 && (
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valor acordado</span>
                          <span className="font-medium">{formatCOP(enrollment.agreed_price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pagado</span>
                          <span className="font-medium">{formatCOP(enrollment.paid)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Saldo</span>
                          <span className="font-semibold">{formatCOP(Math.max(enrollment.balance, 0))}</span>
                        </div>
                      </div>
                    )}
                    <ContactWhatsAppButton
                      className="w-full"
                      message={`Hola! Escribo sobre mi inscripción al curso "${course.title}" (${message.title}).`}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Other Courses */}
      {otherCourses.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Otros Cursos Disponibles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden opacity-75 border-0 shadow-md">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={course.cover_image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800'}
                    alt={course.title}
                    className="w-full h-full object-cover grayscale"
                  />
                  <div className="absolute inset-0 bg-accent/60 flex items-center justify-center">
                    <Lock className="w-10 h-10 text-accent-foreground" />
                  </div>
                </div>
                <CardContent className="p-5">
                  <Badge variant="outline" className="mb-2">
                    {levelLabels[course.level]}
                  </Badge>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.title}</h3>
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
