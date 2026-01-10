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
  Download,
  ExternalLink,
  ImageIcon,
  Link as LinkIcon,
} from 'lucide-react';

// Check if URL is from Supabase storage
const isStorageUrl = (url: string): boolean => {
  return url?.includes('supabase') && url?.includes('storage');
};

// Check if URL is a YouTube/Vimeo embed
const isExternalVideoUrl = (url: string): boolean => {
  return url?.includes('youtube.com') || url?.includes('youtu.be') || url?.includes('vimeo.com');
};

// Convert YouTube URL to embed URL
const getEmbedUrl = (url: string): string => {
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return url;
};

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
        return <FileText className="w-4 h-4" />;
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'link':
        return <LinkIcon className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const renderLessonContent = () => {
    if (!currentLesson?.content) {
      return (
        <div className="bg-muted rounded-lg p-12 text-center">
          <File className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Esta lección no tiene contenido</p>
        </div>
      );
    }

    switch (currentLesson.type) {
      case 'video':
        if (isExternalVideoUrl(currentLesson.content)) {
          // YouTube/Vimeo embed
          return (
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
              <iframe
                src={getEmbedUrl(currentLesson.content)}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={currentLesson.title}
              />
            </div>
          );
        } else {
          // Direct video (from storage)
          return (
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
              <video
                src={currentLesson.content}
                className="w-full h-full"
                controls
                controlsList="nodownload"
                preload="metadata"
              >
                Tu navegador no soporta el elemento de video.
              </video>
            </div>
          );
        }

      case 'pdf':
        return (
          <div className="mb-6">
            <div className="bg-muted rounded-lg p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-red-500" />
                <div>
                  <p className="font-medium">Documento PDF</p>
                  <p className="text-sm text-muted-foreground">{currentLesson.title}</p>
                </div>
              </div>
              <Button asChild variant="outline">
                <a href={currentLesson.content} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir en nueva pestaña
                </a>
              </Button>
            </div>
            <iframe
              src={currentLesson.content}
              className="w-full h-[600px] rounded-lg border"
              title={currentLesson.title}
            />
          </div>
        );

      case 'image':
        return (
          <div className="mb-6">
            <img
              src={currentLesson.content}
              alt={currentLesson.title}
              className="w-full max-w-3xl mx-auto rounded-lg shadow-lg"
            />
          </div>
        );

      case 'text':
        return (
          <div className="prose prose-lg max-w-none mb-6 bg-card p-6 rounded-lg border">
            <div className="whitespace-pre-wrap">{currentLesson.content}</div>
          </div>
        );

      case 'link':
        return (
          <div className="mb-6">
            <div className="bg-muted rounded-lg p-6 text-center">
              <LinkIcon className="w-12 h-12 mx-auto text-primary mb-4" />
              <p className="text-muted-foreground mb-4">Esta lección contiene un enlace externo</p>
              <Button asChild>
                <a href={currentLesson.content} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir enlace
                </a>
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="prose prose-lg max-w-none mb-6 bg-card p-6 rounded-lg">
            <p className="whitespace-pre-wrap">{currentLesson.content}</p>
          </div>
        );
    }
  };

  // Render attachments if any
  const renderAttachments = () => {
    const attachments = (currentLesson as any)?.attachments;
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Archivos Adjuntos
        </h4>
        <div className="space-y-2">
          {attachments.map((attachment: any, index: number) => (
            <a
              key={index}
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-accent transition-colors"
            >
              <FileText className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium text-sm">{attachment.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(attachment.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Download className="w-4 h-4 text-muted-foreground" />
            </a>
          ))}
        </div>
      </div>
    );
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
    <div className="flex h-screen bg-background">
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
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span>
                  Módulo {currentModuleIndex + 1}, Lección {currentLessonIndex + 1}
                </span>
                {currentLesson.duration && (
                  <>
                    <span>•</span>
                    <span>{currentLesson.duration}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl font-bold">{currentLesson.title}</h1>
            </div>

            {/* Content based on type */}
            {renderLessonContent()}

            {/* Attachments */}
            {renderAttachments()}

            {/* Mark as complete */}
            <div className="mt-8">
              {!isLessonCompleted(currentLesson.id) ? (
                <Button onClick={handleMarkComplete} className="gap-2" disabled={markComplete.isPending}>
                  {markComplete.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Marcar como completada
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Lección completada</span>
                </div>
              )}
            </div>
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
          <span className="text-sm text-muted-foreground">
            {getAllLessons().findIndex((l) => l.id === currentLesson.id) + 1} de {getAllLessons().length}
          </span>
          <Button
            onClick={handleNext}
            disabled={
              getAllLessons().findIndex((l) => l.id === currentLesson.id) === getAllLessons().length - 1
            }
          >
            Siguiente <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </footer>
      </main>
    </div>
  );
};
