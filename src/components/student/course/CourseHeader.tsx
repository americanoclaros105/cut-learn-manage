import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, BookOpen, Award } from 'lucide-react';
import { Course } from '@/hooks/useCourses';

interface CourseHeaderProps {
  course: Course;
  progressPercentage: number;
  totalLessons: number;
  completedCount: number;
}

export const CourseHeader = ({
  course,
  progressPercentage,
  totalLessons,
  completedCount,
}: CourseHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
      <div className="p-4 lg:p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/estudiante')}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Mis Cursos
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Course Cover */}
          {course.cover_image && (
            <div className="w-full lg:w-48 aspect-video lg:aspect-square rounded-xl overflow-hidden shadow-lg flex-shrink-0">
              <img
                src={course.cover_image}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="secondary" className="font-medium">
                {course.level === 'beginner'
                  ? 'Principiante'
                  : course.level === 'intermediate'
                  ? 'Intermedio'
                  : 'Avanzado'}
              </Badge>
              {course.category && (
                <Badge variant="outline">{course.category}</Badge>
              )}
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-3 line-clamp-2">
              {course.title}
            </h1>

            {course.description && (
              <p className="text-muted-foreground mb-4 line-clamp-2 text-sm lg:text-base">
                {course.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              {course.duration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span>{totalLessons} lecciones</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>{completedCount} completadas</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="max-w-md">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Tu progreso</span>
                <span className="font-semibold text-primary">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
