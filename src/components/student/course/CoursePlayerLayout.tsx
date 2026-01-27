import { ReactNode, useEffect, useState, useCallback } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, ChevronLeft, ChevronRight, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { ModulesPanel } from './ModulesPanel';
import { BottomNavigation } from './BottomNavigation';
import { Module, Lesson } from '@/hooks/useCourses';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getLessonTypeInfo } from './LessonPlayer';

interface CoursePlayerLayoutProps {
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
  moduleIndex: number;
  lessonIndex: number;
  isMobileSidebarOpen: boolean;
  onCloseMobileSidebar: () => void;
  children: ReactNode;
}

export const CoursePlayerLayout = ({
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
  moduleIndex,
  lessonIndex,
  isMobileSidebarOpen,
  onCloseMobileSidebar,
  children,
}: CoursePlayerLayoutProps) => {
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          if (hasPrevious) onPrevious();
          break;
        case 'ArrowRight':
          if (hasNext) onNext();
          break;
        case 'Escape':
          onCloseMobileSidebar();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrevious, hasNext, onPrevious, onNext, onCloseMobileSidebar]);

  const typeInfo = currentLesson ? getLessonTypeInfo(currentLesson.type) : null;
  const TypeIcon = typeInfo?.icon;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Lesson Header */}
        <div className="px-4 lg:px-6 py-3 border-b bg-card/50 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {typeInfo && TypeIcon && (
                  <Badge className={cn('gap-1 text-xs', typeInfo.color)}>
                    <TypeIcon className="w-3 h-3" />
                    {typeInfo.label}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  M{moduleIndex + 1} • L{lessonIndex + 1}
                </span>
                {currentLesson?.duration && (
                  <span className="text-xs text-muted-foreground">• {currentLesson.duration}</span>
                )}
              </div>
              <h2 className="text-lg lg:text-xl font-bold truncate">{currentLesson?.title}</h2>
            </div>

            {/* Complete Button - Desktop */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              {!isCompleted ? (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={onMarkComplete}
                    disabled={isMarkingComplete}
                    className="gap-2"
                  >
                    {isMarkingComplete ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Marcar completada
                  </Button>
                </motion.div>
              ) : (
                <Badge className="gap-2 py-2 px-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  Completada
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-6 pb-24 lg:pb-6">
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentLesson?.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Footer - Desktop */}
        <div className="hidden lg:flex border-t p-4 bg-card/80 backdrop-blur-sm items-center justify-between">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Lección {currentPosition} de {totalLessons}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalLessons, 12) }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    i < currentPosition ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
              {totalLessons > 12 && (
                <span className="text-xs text-muted-foreground ml-1">+{totalLessons - 12}</span>
              )}
            </div>
          </div>

          <Button
            onClick={onNext}
            disabled={!hasNext}
            className="gap-2"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </main>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-l bg-card transition-all duration-300',
          isDesktopSidebarCollapsed ? 'w-12' : 'w-80 xl:w-96'
        )}
      >
        {/* Collapse toggle */}
        <div className="p-2 border-b flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
            className="h-8 w-8"
          >
            {isDesktopSidebarCollapsed ? (
              <PanelRightOpen className="w-4 h-4" />
            ) : (
              <PanelRightClose className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Sidebar content */}
        {!isDesktopSidebarCollapsed && (
          <ModulesPanel
            modules={modules}
            currentLesson={currentLesson}
            completedLessons={completedLessons}
            onLessonClick={onLessonClick}
          />
        )}
      </aside>

      {/* Mobile/Tablet Sidebar Sheet */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={onCloseMobileSidebar}>
        <SheetContent side="right" className="w-full sm:w-96 p-0">
          <ModulesPanel
            modules={modules}
            currentLesson={currentLesson}
            completedLessons={completedLessons}
            onLessonClick={onLessonClick}
            onClose={onCloseMobileSidebar}
          />
        </SheetContent>
      </Sheet>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        modules={modules}
        currentLesson={currentLesson}
        completedLessons={completedLessons}
        onLessonClick={onLessonClick}
        onPrevious={onPrevious}
        onNext={onNext}
        onMarkComplete={onMarkComplete}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        isCompleted={isCompleted}
        isMarkingComplete={isMarkingComplete}
        currentPosition={currentPosition}
        totalLessons={totalLessons}
        progressPercentage={progressPercentage}
      />
    </div>
  );
};
