import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import { Course } from '@/hooks/useCourses';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CoursePlayerHeaderProps {
  course: Course;
  progressPercentage: number;
  completedCount: number;
  totalLessons: number;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const CoursePlayerHeader = ({
  course,
  progressPercentage,
  completedCount,
  totalLessons,
  isSidebarOpen,
  onToggleSidebar,
}: CoursePlayerHeaderProps) => {
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        'sticky top-0 z-50 h-14 px-3 lg:px-4',
        'flex items-center justify-between gap-3',
        'glass-header border-b'
      )}
    >
      {/* Left: Back button + Course info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/estudiante')}
          className="shrink-0 h-9 w-9"
          aria-label="Volver a mis cursos"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Course cover - small */}
        {course.cover_image && (
          <div className="hidden sm:block w-9 h-9 rounded-lg overflow-hidden shadow-sm shrink-0">
            <img
              src={course.cover_image}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title */}
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-sm lg:text-base truncate">
            {course.title}
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {completedCount}/{totalLessons} lecciones completadas
          </p>
        </div>
      </div>

      {/* Right: Progress ring + Menu toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <ProgressRing
          progress={progressPercentage}
          size={36}
          strokeWidth={3}
          className="hidden xs:flex"
        />

        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú de módulos'}
        >
          {isSidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>
      </div>
    </motion.header>
  );
};
