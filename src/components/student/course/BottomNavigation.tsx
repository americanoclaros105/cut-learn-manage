import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ChevronLeft, ChevronRight, List, CheckCircle, Loader2 } from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import { ModulesPanel } from './ModulesPanel';
import { Module, Lesson } from '@/hooks/useCourses';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  modules: Module[];
  currentLesson: Lesson | null;
  completedLessons: string[];
  onLessonClick: (moduleIndex: number, lessonIndex: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onMarkComplete: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  isCompleted: boolean;
  isMarkingComplete: boolean;
  currentPosition: number;
  totalLessons: number;
  progressPercentage: number;
}

export const BottomNavigation = ({
  modules,
  currentLesson,
  completedLessons,
  onLessonClick,
  onPrevious,
  onNext,
  onMarkComplete,
  hasPrevious,
  hasNext,
  isCompleted,
  isMarkingComplete,
  currentPosition,
  totalLessons,
  progressPercentage,
}: BottomNavigationProps) => {
  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
        'glass-header border-t safe-area-bottom'
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        {/* Previous Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="gap-1 px-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden xs:inline text-xs">Ant</span>
        </Button>

        {/* Center: Progress + Complete + Modules Sheet */}
        <div className="flex items-center gap-2">
          {/* Progress indicator */}
          <div className="flex items-center gap-1.5">
            <ProgressRing progress={progressPercentage} size={28} strokeWidth={2.5} showLabel={false} />
            <span className="text-xs text-muted-foreground">
              {currentPosition}/{totalLessons}
            </span>
          </div>

          {/* Complete button */}
          {!isCompleted ? (
            <Button
              size="sm"
              onClick={onMarkComplete}
              disabled={isMarkingComplete}
              className="gap-1.5 h-8 px-3"
            >
              {isMarkingComplete ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              <span className="text-xs">Completar</span>
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 px-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Hecho</span>
            </div>
          )}

          {/* Modules Sheet Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 px-3">
                <List className="w-4 h-4" />
                <span className="text-xs hidden xs:inline">Módulos</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
              <SheetHeader className="pb-4">
                <SheetTitle>Contenido del Curso</SheetTitle>
              </SheetHeader>
              <div className="overflow-auto h-[calc(80vh-80px)]">
                <ModulesPanel
                  modules={modules}
                  currentLesson={currentLesson}
                  completedLessons={completedLessons}
                  onLessonClick={onLessonClick}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Next Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={!hasNext}
          className="gap-1 px-2"
        >
          <span className="hidden xs:inline text-xs">Sig</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.nav>
  );
};
