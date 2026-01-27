import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCourseWithModules, Lesson } from '@/hooks/useCourses';
import { useCourseProgress, useMarkLessonComplete, useUserAssignedCourses } from '@/hooks/useProgress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Lock, Loader2, ArrowLeft } from 'lucide-react';
import { CoursePlayerHeader } from '@/components/student/course/CoursePlayerHeader';
import { CoursePlayerLayout } from '@/components/student/course/CoursePlayerLayout';
import { LessonPlayer } from '@/components/student/course/LessonPlayer';
import { CourseCertificate } from '@/components/student/course/CourseCertificate';
import { fireCourseCompleteConfetti, fireSuccessConfetti } from '@/lib/confetti';

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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const hasCelebratedRef = useRef(false);

  const hasAccess = courseId ? assignedCourses.includes(courseId) : false;
  const completedLessons = progressData.map((p) => p.lesson_id);

  // Apply course theme
  useEffect(() => {
    if (course && (course as any).theme_colors) {
      const theme = (course as any).theme_colors;
      const root = document.documentElement;
      if (theme.primary) root.style.setProperty('--primary', theme.primary);
      if (theme.accent) root.style.setProperty('--accent', theme.accent);
      if (theme.background) root.style.setProperty('--background', theme.background);

      return () => {
        root.style.removeProperty('--primary');
        root.style.removeProperty('--accent');
        root.style.removeProperty('--background');
      };
    }
  }, [course]);

  const getAllLessons = useCallback(() => {
    if (!course || !course.modules) return [];
    return course.modules.flatMap((m, mIndex) =>
      (m.lessons || []).map((l, lIndex) => ({ ...l, moduleIndex: mIndex, lessonIndex: lIndex }))
    );
  }, [course]);

  useEffect(() => {
    if (course && course.modules && course.modules.length > 0 && course.modules[0].lessons?.length > 0) {
      // Find first incomplete lesson or default to first
      const allLessons = getAllLessons();
      const firstIncomplete = allLessons.find((l) => !completedLessons.includes(l.id));

      if (firstIncomplete) {
        setCurrentModuleIndex(firstIncomplete.moduleIndex);
        setCurrentLessonIndex(firstIncomplete.lessonIndex);
        setCurrentLesson(firstIncomplete);
      } else {
        setCurrentLesson(course.modules[0].lessons[0]);
      }
    }
  }, [course, completedLessons.length, getAllLessons]);

  const handleLessonClick = useCallback((moduleIndex: number, lessonIndex: number) => {
    if (!course || !course.modules) return;
    const lesson = course.modules[moduleIndex].lessons?.[lessonIndex];
    if (lesson) {
      setCurrentModuleIndex(moduleIndex);
      setCurrentLessonIndex(lessonIndex);
      setCurrentLesson(lesson);
      setIsMobileSidebarOpen(false);
    }
  }, [course]);

  const handleMarkComplete = async () => {
    if (!currentLesson || !courseId) return;

    try {
      await markComplete.mutateAsync({ lessonId: currentLesson.id, courseId });
      
      // Check if this was the last lesson to complete the course
      const allLessons = getAllLessons();
      const newCompletedCount = completedLessons.length + 1;
      const totalLessonsCount = allLessons.length;
      
      if (newCompletedCount === totalLessonsCount && !hasCelebratedRef.current) {
        // Course completed! 🎉
        hasCelebratedRef.current = true;
        fireCourseCompleteConfetti();
        toast.success('🎉 ¡Felicidades! Has completado el curso', {
          description: '¡Ya puedes descargar tu certificado!',
          duration: 5000,
          action: {
            label: 'Ver certificado',
            onClick: () => setShowCertificate(true),
          },
        });
        
        // Show certificate modal after a short delay
        setTimeout(() => {
          setShowCertificate(true);
        }, 2000);
      } else {
        // Just a regular lesson completion
        fireSuccessConfetti();
        toast.success('¡Lección completada!', {
          description: 'Tu progreso ha sido guardado',
        });
        
        // Auto-advance to next lesson
        const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
        if (currentIndex < allLessons.length - 1) {
          const next = allLessons[currentIndex + 1];
          handleLessonClick(next.moduleIndex, next.lessonIndex);
        }
      }
    } catch (error) {
      toast.error('Error al marcar la lección');
    }
  };

  const handlePrevious = useCallback(() => {
    const allLessons = getAllLessons();
    const currentIndex = allLessons.findIndex((l) => l.id === currentLesson?.id);
    if (currentIndex > 0) {
      const prev = allLessons[currentIndex - 1];
      handleLessonClick(prev.moduleIndex, prev.lessonIndex);
    }
  }, [getAllLessons, currentLesson, handleLessonClick]);

  const handleNext = useCallback(() => {
    const allLessons = getAllLessons();
    const currentIndex = allLessons.findIndex((l) => l.id === currentLesson?.id);
    if (currentIndex < allLessons.length - 1) {
      const next = allLessons[currentIndex + 1];
      handleLessonClick(next.moduleIndex, next.lessonIndex);
    }
  }, [getAllLessons, currentLesson, handleLessonClick]);

  const isLessonCompleted = (lessonId: string) => completedLessons.includes(lessonId);

  const getProgressPercentage = () => {
    if (!course || !course.modules) return 0;
    const totalLessons = course.modules.reduce((a, m) => a + (m.lessons?.length || 0), 0);
    return totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;
  };

  const getTotalLessons = () => {
    if (!course || !course.modules) return 0;
    return course.modules.reduce((a, m) => a + (m.lessons?.length || 0), 0);
  };

  const getCurrentPosition = () => {
    const allLessons = getAllLessons();
    return allLessons.findIndex((l) => l.id === currentLesson?.id) + 1;
  };

  const isCourseComplete = getProgressPercentage() === 100;

  // Loading state
  if (loadingCourse || loadingAssigned || loadingProgress) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando curso...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center">Acceso Restringido</h2>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          No tienes acceso a este curso. Contacta al administrador para solicitar acceso.
        </p>
        <Button onClick={() => navigate('/estudiante')} size="lg">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Mis Cursos
        </Button>
      </div>
    );
  }

  // Course not found
  if (!course || !currentLesson) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Preparando contenido...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Compact Sticky Header */}
      <CoursePlayerHeader
        course={course}
        progressPercentage={getProgressPercentage()}
        completedCount={completedLessons.length}
        totalLessons={getTotalLessons()}
        isSidebarOpen={isMobileSidebarOpen}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isCourseComplete={isCourseComplete}
        onShowCertificate={() => setShowCertificate(true)}
      />

      {/* Main Layout with Content + Sidebar */}
      <CoursePlayerLayout
        modules={course.modules || []}
        currentLesson={currentLesson}
        completedLessons={completedLessons}
        onLessonClick={handleLessonClick}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onMarkComplete={handleMarkComplete}
        hasPrevious={getCurrentPosition() > 1}
        hasNext={getCurrentPosition() < getTotalLessons()}
        isCompleted={isLessonCompleted(currentLesson.id)}
        isMarkingComplete={markComplete.isPending}
        currentPosition={getCurrentPosition()}
        totalLessons={getTotalLessons()}
        progressPercentage={getProgressPercentage()}
        moduleIndex={currentModuleIndex}
        lessonIndex={currentLessonIndex}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
      >
        <LessonPlayer lesson={currentLesson} />
      </CoursePlayerLayout>

      {/* Certificate Modal */}
      <CourseCertificate
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        studentName={user?.name || 'Estudiante'}
        courseName={course.title}
        completionDate={new Date()}
        totalLessons={getTotalLessons()}
      />
    </div>
  );
};
