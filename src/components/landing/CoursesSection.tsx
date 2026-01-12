import { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { openWhatsApp } from '@/lib/whatsapp';

interface CoursesSectionProps {
  title: string;
  subtitle: string;
  courses: Course[];
  whatsapp: string;
}

const levelColors = {
  beginner: 'bg-green-500/10 text-green-600 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const levelLabels = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

export const CoursesSection = ({ title, subtitle, courses, whatsapp }: CoursesSectionProps) => {
  const navigate = useNavigate();
  const publishedCourses = courses.filter((c) => c.status === 'published').slice(0, 3);

  return (
    <section id="courses" className="section-padding bg-accent text-accent-foreground">
      <div className="container-custom mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          <p className="text-accent-foreground/70 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {publishedCourses.map((course) => (
            <Card
              key={course.id}
              className="bg-card border-0 overflow-hidden group hover:shadow-2xl transition-all duration-300 flex flex-col h-full"
            >
              <div className="aspect-video overflow-hidden relative flex-shrink-0">
                <img
                  src={course.coverImage}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <Badge className={`absolute top-4 left-4 ${levelColors[course.level]}`}>
                  {levelLabels[course.level]}
                </Badge>
              </div>
              <CardContent className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold text-card-foreground mb-2 line-clamp-1">{course.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-grow">{course.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lecciones
                    </span>
                  </div>
                </div>
                {course.price > 0 && (
                  <div className="text-2xl font-bold text-primary mb-4">${course.price}</div>
                )}
                <Button
                  onClick={() => openWhatsApp(whatsapp, course.title, 'curso')}
                  className="w-full h-11 bg-green-500 hover:bg-green-600 text-white gap-2 mt-auto"
                >
                  <i className="fab fa-whatsapp text-lg" />
                  Inscribirme
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button
            size="lg"
            onClick={() => navigate('/login')}
            className="gap-2"
          >
            Ver Todos los Cursos
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
