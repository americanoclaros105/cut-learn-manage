import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  PlayCircle,
  FileText,
  File,
  ImageIcon,
  Link as LinkIcon,
  ChevronDown,
  Circle,
} from 'lucide-react';
import { Module, Lesson } from '@/hooks/useCourses';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CourseSidebarProps {
  modules: Module[];
  currentLesson: Lesson | null;
  completedLessons: string[];
  onLessonClick: (moduleIndex: number, lessonIndex: number) => void;
}

export const CourseSidebar = ({
  modules,
  currentLesson,
  completedLessons,
  onLessonClick,
}: CourseSidebarProps) => {
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  // Auto-expand module containing current lesson
  useEffect(() => {
    if (currentLesson) {
      const moduleWithLesson = modules.find((m) =>
        m.lessons?.some((l) => l.id === currentLesson.id)
      );
      if (moduleWithLesson && !expandedModules.includes(moduleWithLesson.id)) {
        setExpandedModules((prev) => [...prev, moduleWithLesson.id]);
      }
    }
  }, [currentLesson, modules]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const isLessonCompleted = (lessonId: string) => completedLessons.includes(lessonId);

  const getModuleProgress = (module: Module) => {
    const completed = module.lessons?.filter((l) => isLessonCompleted(l.id)).length || 0;
    const total = module.lessons?.length || 0;
    return { completed, total };
  };

  const getLessonIcon = (lesson: Lesson) => {
    const isCompleted = isLessonCompleted(lesson.id);
    const isCurrent = currentLesson?.id === lesson.id;

    if (isCompleted) {
      return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
    }

    if (isCurrent) {
      return <Circle className="w-4 h-4 text-primary fill-primary flex-shrink-0" />;
    }

    switch (lesson.type) {
      case 'video':
        return <PlayCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
      case 'link':
        return <LinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
      default:
        return <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
    }
  };

  return (
    <aside className="w-full lg:w-80 xl:w-96 bg-card border-r flex flex-col h-full">
      <div className="p-4 border-b bg-muted/30">
        <h2 className="font-semibold text-lg">Contenido del Curso</h2>
        <p className="text-sm text-muted-foreground">
          {modules.length} módulos • {modules.reduce((a, m) => a + (m.lessons?.length || 0), 0)} lecciones
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {modules.map((module, mIndex) => {
            const { completed, total } = getModuleProgress(module);
            const isExpanded = expandedModules.includes(module.id);
            const isModuleComplete = completed === total && total > 0;

            return (
              <Collapsible
                key={module.id}
                open={isExpanded}
                onOpenChange={() => toggleModule(module.id)}
              >
                <CollapsibleTrigger className="w-full">
                  <div
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-accent text-left w-full',
                      isExpanded && 'bg-accent/50'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
                        isModuleComplete
                          ? 'bg-green-500 text-white'
                          : 'bg-primary/10 text-primary'
                      )}
                    >
                      {isModuleComplete ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        mIndex + 1
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-1">{module.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {completed}/{total} completadas
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-muted-foreground transition-transform flex-shrink-0',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <ul className="ml-4 pl-4 border-l-2 border-muted mt-1 space-y-1">
                    {module.lessons?.map((lesson, lIndex) => {
                      const isCurrent = currentLesson?.id === lesson.id;
                      const isCompleted = isLessonCompleted(lesson.id);

                      return (
                        <li key={lesson.id}>
                          <button
                            onClick={() => onLessonClick(mIndex, lIndex)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all',
                              isCurrent
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : isCompleted
                                ? 'hover:bg-green-50 dark:hover:bg-green-950/20'
                                : 'hover:bg-accent'
                            )}
                          >
                            {getLessonIcon(lesson)}
                            <div className="flex-1 min-w-0">
                              <span className="line-clamp-1 block">{lesson.title}</span>
                              {lesson.duration && (
                                <span className={cn(
                                  'text-xs',
                                  isCurrent ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                )}>
                                  {lesson.duration}
                                </span>
                              )}
                            </div>
                            {isCompleted && !isCurrent && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                ✓
                              </Badge>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
};
