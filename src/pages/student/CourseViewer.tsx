import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCourseWithModules, Lesson } from '@/hooks/useCourses';
import { useCourseProgress, useMarkLessonComplete, useUserAssignedCourses } from '@/hooks/useProgress';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  PlayCircle,
  FileText,
  File,
  Lock,
  Loader2,
} from 'lucide-react';

export const CourseViewer = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: course, isLoading: loadingCourse } = useCourseWithModules(courseId || '');
  const { data: assignedCourses = [], isLoading: loadingAssigned } = useUserAssignedCourses();
  const { data: progressData = [], isLoading: loadingProgress } = useCourseProgress(courseId || '');
  const markComplete = useMarkLessonComplete();
  
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

  const hasAccess = courseId ? assignedCourses.includes(courseId) : false;
  const completedLessons = progressData.map(p => p.lesson_id);

  useEffect(() => {
    if (course && course.modules && course.modules.length > 0 && course.modules[0].lessons?.length > 0) {
      setCurrentLesson(course.modules[0].lessons[0]);
    }
  }, [course]);

  const getAllLessons = () => {
    if (!course || !course.modules) return [];
    return course.modules.flatMap((m, mIndex) =>
      (m.lessons || []).map((l, lIndex) => ({ ...l, moduleIndex: mIndex, lessonIndex: lIndex }))
    );
  };

  const handleLessonClick = (moduleIndex: number, lessonIndex: number) => {
    if (!course || !course.modules) return;
    const lesson = course.modules[moduleIndex].lessons?.[lessonIndex];
    if (lesson) {
      setCurrentModuleIndex(moduleIndex);
      setCurrentLessonIndex(lessonIndex);
      setCurrentLesson(lesson);
    }
  };

  const handleMarkComplete = async () => {
    if (!currentLesson || !courseId) return;

    try {
      await markComplete.mutateAsync({ lessonId: currentLesson.id, courseId });
      toast.success('Lección completada');

      // Auto-advance to next lesson
      const allLessons = getAllLessons();
      const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
      if (currentIndex < allLessons.length - 1) {
        const next = allLessons[currentIndex + 1];
        handleLessonClick(next.moduleIndex, next.lessonIndex);
      }
    } catch (error) {
      toast.error('Error al marcar la lección');
    }
  };

  const handlePrevious = () => {
    const allLessons = getAllLessons();
    const currentIndex = allLessons.findIndex((l) => l.id === currentLesson?.id);
    if (currentIndex > 0) {
      const prev = allLessons[currentIndex - 1];
      handleLessonClick(prev.moduleIndex, prev.lessonIndex);
    }
  };

  const handleNext = () => {
    const allLessons = getAllLessons();
    const currentIndex = allLessons.findIndex((l) => l.id === currentLesson?.id);
    if (currentIndex < allLessons.length - 1) {
      const next = allLessons[currentIndex + 1];
      handleLessonClick(next.moduleIndex, next.lessonIndex);
    }
  };

  const isLessonCompleted = (lessonId: string) => completedLessons.includes(lessonId);

  const getProgressPercentage = () => {
    if (!course || !course.modules) return 0;
    const totalLessons = course.modules.reduce((a, m) => a + (m.lessons?.length || 0), 0);
    return totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;
  };

  const getLessonIcon = (lesson: Lesson) => {
    if (isLessonCompleted(lesson.id)) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    switch (lesson.type) {
      case 'video':
        return <PlayCircle className="w-4 h-4" />;
      case 'pdf':
        return <File className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loadingCourse || loadingAssigned || loadingProgress) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Lock className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
        <p className="text-muted-foreground mb-6">No tienes acceso a este curso.</p>
        <Button onClick={() => navigate('/estudiante')}>Volver a Mis Cursos</Button>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar - Course Structure */}
      <aside className="w-80 bg-card border-r flex flex-col">
        <div className="p-4 border-b">
          <Button variant="ghost" size="sm" onClick={() => navigate('/estudiante')} className="mb-3">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
          <h2 className="font-semibold text-lg line-clamp-2">{course.title}</h2>
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">{getProgressPercentage()}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {course.modules?.map((module, mIndex) => (
              <div key={module.id}>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">
                  Módulo {mIndex + 1}: {module.title}
                </h3>
                <ul className="space-y-1">
                  {module.lessons?.map((lesson, lIndex) => (
                    <li key={lesson.id}>
                      <button
                        onClick={() => handleLessonClick(mIndex, lIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          currentLesson?.id === lesson.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-secondary'
                        }`}
                      >
                        {getLessonIcon(lesson)}
                        <span className="flex-1 line-clamp-1">{lesson.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">{currentLesson.title}</h1>

            {/* Content based on type */}
            {currentLesson.type === 'video' && currentLesson.content && (
              <div className="aspect-video bg-accent rounded-lg overflow-hidden mb-6">
                <iframe
                  src={currentLesson.content}
                  className="w-full h-full"
                  allowFullScreen
                  title={currentLesson.title}
                />
              </div>
            )}

            {currentLesson.type === 'text' && currentLesson.content && (
              <div className="prose prose-lg max-w-none mb-6 bg-card p-6 rounded-lg">
                <p className="whitespace-pre-wrap">{currentLesson.content}</p>
              </div>
            )}

            {currentLesson.type === 'pdf' && currentLesson.content && (
              <div className="mb-6">
                <iframe
                  src={currentLesson.content}
                  className="w-full h-[600px] rounded-lg border"
                  title={currentLesson.title}
                />
              </div>
            )}

            {/* Mark as complete */}
            {!isLessonCompleted(currentLesson.id) && (
              <Button 
                onClick={handleMarkComplete} 
                className="gap-2"
                disabled={markComplete.isPending}
              >
                {markComplete.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Marcar como completada
              </Button>
            )}

            {isLessonCompleted(currentLesson.id) && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Lección completada</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <footer className="border-t p-4 flex justify-between items-center bg-card">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={getAllLessons().findIndex((l) => l.id === currentLesson.id) === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Anterior
          </Button>
          <Button
            onClick={handleNext}
            disabled={
              getAllLessons().findIndex((l) => l.id === currentLesson.id) ===
              getAllLessons().length - 1
            }
          >
            Siguiente <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </footer>
      </main>
    </div>
  );
};
