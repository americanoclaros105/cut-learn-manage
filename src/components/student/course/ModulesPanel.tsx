import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CheckCircle,
  PlayCircle,
  FileText,
  File,
  ImageIcon,
  Link as LinkIcon,
  Circle,
} from 'lucide-react';
import { Module, Lesson } from '@/hooks/useCourses';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ModulesPanelProps {
  modules: Module[];
  currentLesson: Lesson | null;
  completedLessons: string[];
  onLessonClick: (moduleIndex: number, lessonIndex: number) => void;
  onClose?: () => void;
}

export const ModulesPanel = ({
  modules,
  currentLesson,
  completedLessons,
  onLessonClick,
  onClose,
}: ModulesPanelProps) => {
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const currentLessonRef = useRef<HTMLButtonElement>(null);

  // Auto-expand module containing current lesson
  useEffect(() => {
    if (currentLesson) {
      const moduleWithLesson = modules.find((m) =>
        m.lessons?.some((l) => l.id === currentLesson.id)
      );
      if (moduleWithLesson && !expandedModules.includes(moduleWithLesson.id)) {
        setExpandedModules([moduleWithLesson.id]);
      }
    }
  }, [currentLesson?.id, modules]);

  // Scroll to current lesson
  useEffect(() => {
    if (currentLessonRef.current) {
      setTimeout(() => {
        currentLessonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [currentLesson?.id]);

  const isLessonCompleted = (lessonId: string) => completedLessons.includes(lessonId);

  const getModuleProgress = (module: Module) => {
    const completed = module.lessons?.filter((l) => isLessonCompleted(l.id)).length || 0;
    const total = module.lessons?.length || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const getLessonIcon = (lesson: Lesson) => {
    const isCompleted = isLessonCompleted(lesson.id);
    const isCurrent = currentLesson?.id === lesson.id;

    if (isCompleted) {
      return <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />;
    }

    if (isCurrent) {
      return (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Circle className="w-4 h-4 text-primary fill-primary shrink-0" />
        </motion.div>
      );
    }

    switch (lesson.type) {
      case 'video':
        return <PlayCircle className="w-4 h-4 text-muted-foreground shrink-0" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-muted-foreground shrink-0" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />;
      case 'link':
        return <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />;
      default:
        return <File className="w-4 h-4 text-muted-foreground shrink-0" />;
    }
  };

  const handleLessonClick = (moduleIndex: number, lessonIndex: number) => {
    onLessonClick(moduleIndex, lessonIndex);
    onClose?.();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Overall progress */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progreso General</span>
          <span className="text-sm text-muted-foreground">
            {completedLessons.length}/{modules.reduce((a, m) => a + (m.lessons?.length || 0), 0)}
          </span>
        </div>
        <Progress
          value={
            (completedLessons.length /
              Math.max(modules.reduce((a, m) => a + (m.lessons?.length || 0), 0), 1)) *
            100
          }
          className="h-2"
        />
      </div>

      <ScrollArea className="flex-1">
        <Accordion
          type="multiple"
          value={expandedModules}
          onValueChange={setExpandedModules}
          className="p-3"
        >
          {modules.map((module, mIndex) => {
            const { completed, total, percentage } = getModuleProgress(module);
            const isModuleComplete = completed === total && total > 0;

            return (
              <AccordionItem
                key={module.id}
                value={module.id}
                className="border rounded-lg mb-2 overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/50 [&[data-state=open]]:bg-accent/30">
                  <div className="flex items-center gap-3 text-left w-full pr-2">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0',
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
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={percentage} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground shrink-0">
                          {completed}/{total}
                        </span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-2 pb-2">
                  <motion.ul
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: {
                        transition: { staggerChildren: 0.05 },
                      },
                    }}
                    className="space-y-1"
                  >
                    {module.lessons?.map((lesson, lIndex) => {
                      const isCurrent = currentLesson?.id === lesson.id;
                      const isCompleted = isLessonCompleted(lesson.id);

                      return (
                        <motion.li
                          key={lesson.id}
                          variants={{
                            hidden: { opacity: 0, x: -10 },
                            visible: { opacity: 1, x: 0 },
                          }}
                        >
                          <button
                            ref={isCurrent ? currentLessonRef : undefined}
                            onClick={() => handleLessonClick(mIndex, lIndex)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all',
                              isCurrent
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : isCompleted
                                ? 'hover:bg-green-50 dark:hover:bg-green-950/20 bg-green-50/50 dark:bg-green-950/10'
                                : 'hover:bg-accent'
                            )}
                          >
                            {getLessonIcon(lesson)}
                            <div className="flex-1 min-w-0">
                              <span className="line-clamp-1 block">{lesson.title}</span>
                              {lesson.duration && (
                                <span
                                  className={cn(
                                    'text-xs',
                                    isCurrent ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                  )}
                                >
                                  {lesson.duration}
                                </span>
                              )}
                            </div>
                            {isCompleted && !isCurrent && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              >
                                ✓
                              </Badge>
                            )}
                          </button>
                        </motion.li>
                      );
                    })}
                  </motion.ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>
    </div>
  );
};
