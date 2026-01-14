import { useState } from 'react';
import { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { openWhatsApp } from '@/lib/whatsapp';

interface CourseWithStats extends Course {
  lessonCount?: number;
}

interface CoursesSectionProps {
  title: string;
  subtitle: string;
  courses: CourseWithStats[];
  whatsapp: string;
}

const levelColors = {
  beginner: 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/30',
  intermediate: 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/30',
  advanced: 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/30',
};

const levelLabels = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

export const CoursesSection = ({ title, subtitle, courses, whatsapp }: CoursesSectionProps) => {
  const navigate = useNavigate();
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const publishedCourses = courses.filter((c) => c.status === 'published').slice(0, 3);

  const toggleDescription = (courseId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const DESCRIPTION_LIMIT = 100;

  return (
    <section id="courses" className="section-padding bg-accent text-accent-foreground">
      <div className="container-custom mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          <p className="text-accent-foreground/70 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {publishedCourses.map((course) => {
            const isExpanded = expandedDescriptions[course.id];
            const isLongDescription = course.description.length > DESCRIPTION_LIMIT;

            return (
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <Badge className={`absolute top-4 left-4 ${levelColors[course.level]} font-semibold px-3 py-1`}>
                  {levelLabels[course.level]}
                </Badge>
                </div>
                <CardContent className="p-6 flex flex-col flex-grow text-left">
                  <h3 className="text-xl font-bold text-card-foreground mb-3 line-clamp-2 leading-tight">
                    {course.title}
                  </h3>
                  
                  {/* Description with expand/collapse */}
                  <div className="mb-4">
                    <p className={`text-muted-foreground text-sm leading-relaxed ${!isExpanded && isLongDescription ? 'line-clamp-2' : ''}`}>
                      {course.description}
                    </p>
                    {isLongDescription && (
                      <button 
                        onClick={() => toggleDescription(course.id)}
                        className="text-primary text-sm font-medium hover:underline mt-2 flex items-center gap-1 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            Ver menos <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            Ver más <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Stats: duration and lessons */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    {course.duration && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary" />
                        {course.duration}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-primary" />
                      {course.lessonCount || 0} lecciones
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    {course.price > 0 ? (
                      <span className="text-2xl font-bold text-primary">${course.price}</span>
                    ) : (
                      <span className="text-xl font-bold text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full uppercase tracking-wide">
                        ¡Gratis!
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={() => openWhatsApp(whatsapp, course.title, 'curso')}
                    className="w-full h-11 bg-green-500 hover:bg-green-600 text-white gap-2 mt-auto"
                  >
                    <i className="fab fa-whatsapp text-lg" />
                    Inscribirme
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Button
            size="lg"
            onClick={() => openWhatsApp(whatsapp, 'todos los cursos disponibles', 'curso')}
            className="gap-2 bg-green-500 hover:bg-green-600 text-white"
          >
            <i className="fab fa-whatsapp text-lg" />
            Ver Todos los Cursos
          </Button>
        </div>
      </div>
    </section>
  );
};
