import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCourses } from '@/hooks/useCourses';
import { useStudents } from '@/hooks/useStudents';
import { Users, GraduationCap, BookOpen, TrendingUp, Loader2 } from 'lucide-react';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';

export const AdminDashboard = () => {
  const { data: courses = [], isLoading: loadingCourses } = useCourses();
  const { data: students = [], isLoading: loadingStudents } = useStudents();

  const publishedCourses = courses.filter((c) => c.status === 'published');
  const activeStudents = students.filter((s) => s.status === 'active');
  
  // Note: For completion rate, we'd need a more complex query
  // For now, we'll show a placeholder
  const completionRate = 0;

  const statCards = [
    {
      title: 'Estudiantes',
      value: students.length,
      subtitle: `${activeStudents.length} activos`,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Cursos',
      value: courses.length,
      subtitle: `${publishedCourses.length} publicados`,
      icon: GraduationCap,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Lecciones',
      value: '-',
      subtitle: 'Total en todos los cursos',
      icon: BookOpen,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Tasa de Completitud',
      value: `${completionRate}%`,
      subtitle: 'Promedio general',
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  if (loadingCourses || loadingStudents) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
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
              <span className="font-medium">Supabase</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Última actualización</span>
              <span className="font-medium">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Versión</span>
              <span className="font-medium">2.0.0</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Dashboard */}
      <div className="mt-8">
        <AnalyticsDashboard />
      </div>
    </div>
  );
};
