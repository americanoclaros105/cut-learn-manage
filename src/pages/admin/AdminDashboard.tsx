import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUsers, getCourses, getProgress } from '@/lib/storage';
import { Users, GraduationCap, BookOpen, TrendingUp } from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalCourses: 0,
    publishedCourses: 0,
    totalLessons: 0,
    completionRate: 0,
  });

  useEffect(() => {
    const users = getUsers();
    const courses = getCourses();
    const progress = getProgress();

    const students = users.filter((u) => u.role === 'student');
    const activeStudents = students.filter((u) => u.status === 'active');
    const publishedCourses = courses.filter((c) => c.status === 'published');
    const totalLessons = courses.reduce(
      (acc, c) => acc + c.modules.reduce((a, m) => a + m.lessons.length, 0),
      0
    );

    // Calculate completion rate
    let totalCompletedLessons = 0;
    let totalPossibleLessons = 0;
    progress.forEach((p) => {
      p.courses.forEach((cp) => {
        const course = courses.find((c) => c.id === cp.courseId);
        if (course) {
          const courseLessons = course.modules.reduce((a, m) => a + m.lessons.length, 0);
          totalPossibleLessons += courseLessons;
          totalCompletedLessons += cp.lessonCompleted.length;
        }
      });
    });

    const completionRate = totalPossibleLessons > 0
      ? Math.round((totalCompletedLessons / totalPossibleLessons) * 100)
      : 0;

    setStats({
      totalStudents: students.length,
      activeStudents: activeStudents.length,
      totalCourses: courses.length,
      publishedCourses: publishedCourses.length,
      totalLessons,
      completionRate,
    });
  }, []);

  const statCards = [
    {
      title: 'Estudiantes',
      value: stats.totalStudents,
      subtitle: `${stats.activeStudents} activos`,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Cursos',
      value: stats.totalCourses,
      subtitle: `${stats.publishedCourses} publicados`,
      icon: GraduationCap,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Lecciones',
      value: stats.totalLessons,
      subtitle: 'Total en todos los cursos',
      icon: BookOpen,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Tasa de Completitud',
      value: `${stats.completionRate}%`,
      subtitle: 'Promedio general',
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Vista general del sistema</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="/admin/estudiantes"
              className="block p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <p className="font-medium">Agregar nuevo estudiante</p>
              <p className="text-sm text-muted-foreground">Crea una cuenta para un nuevo alumno</p>
            </a>
            <a
              href="/admin/cursos"
              className="block p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <p className="font-medium">Crear nuevo curso</p>
              <p className="text-sm text-muted-foreground">Agrega contenido a la academia</p>
            </a>
            <a
              href="/admin/landing"
              className="block p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <p className="font-medium">Editar página principal</p>
              <p className="text-sm text-muted-foreground">Actualiza el contenido del sitio</p>
            </a>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Almacenamiento</span>
              <span className="font-medium">LocalStorage</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Última actualización</span>
              <span className="font-medium">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Versión</span>
              <span className="font-medium">1.0.0</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};