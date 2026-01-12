import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  File,
  FileText,
  Download,
  ExternalLink,
  ImageIcon,
  Link as LinkIcon,
  PlayCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Lesson } from '@/hooks/useCourses';
import { cn } from '@/lib/utils';

interface LessonContentProps {
  lesson: Lesson;
  moduleIndex: number;
  lessonIndex: number;
  isCompleted: boolean;
  isMarkingComplete: boolean;
  onMarkComplete: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  currentPosition: number;
  totalLessons: number;
}

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

const getLessonTypeLabel = (type: string) => {
  switch (type) {
    case 'video':
      return { label: 'Video', icon: PlayCircle, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
    case 'pdf':
      return { label: 'PDF', icon: FileText, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    case 'image':
      return { label: 'Imagen', icon: ImageIcon, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
    case 'link':
      return { label: 'Enlace', icon: LinkIcon, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
    case 'text':
      return { label: 'Lectura', icon: File, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
    default:
      return { label: 'Contenido', icon: File, color: 'bg-muted text-muted-foreground' };
  }
};

export const LessonContent = ({
  lesson,
  moduleIndex,
  lessonIndex,
  isCompleted,
  isMarkingComplete,
  onMarkComplete,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  currentPosition,
  totalLessons,
}: LessonContentProps) => {
  const typeInfo = getLessonTypeLabel(lesson.type);
  const TypeIcon = typeInfo.icon;

  const renderContent = () => {
    if (!lesson.content) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <File className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Esta lección no tiene contenido disponible
            </p>
          </CardContent>
        </Card>
      );
    }

    switch (lesson.type) {
      case 'video':
        if (isExternalVideoUrl(lesson.content)) {
          return (
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
              <iframe
                src={getEmbedUrl(lesson.content)}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={lesson.title}
              />
            </div>
          );
        }
        return (
          <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
            <video
              src={lesson.content}
              className="w-full h-full"
              controls
              controlsList="nodownload"
              preload="metadata"
            >
              Tu navegador no soporta el elemento de video.
            </video>
          </div>
        );

      case 'pdf':
        return (
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-sm text-muted-foreground">Documento PDF</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <a href={lesson.content} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir en nueva pestaña
                  </a>
                </Button>
              </CardContent>
            </Card>
            <div className="rounded-xl overflow-hidden shadow-lg border">
              <iframe
                src={lesson.content}
                className="w-full h-[70vh]"
                title={lesson.title}
              />
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="flex justify-center">
            <img
              src={lesson.content}
              alt={lesson.title}
              className="max-w-full max-h-[70vh] rounded-xl shadow-2xl object-contain"
            />
          </div>
        );

      case 'text':
        return (
          <Card className="overflow-hidden">
            <CardContent className="p-6 lg:p-8">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap leading-relaxed">{lesson.content}</div>
              </div>
            </CardContent>
          </Card>
        );

      case 'link':
        return (
          <Card className="overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <LinkIcon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Recurso Externo</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Esta lección contiene un enlace a un recurso externo. Haz clic en el botón para acceder.
              </p>
              <Button asChild size="lg">
                <a href={lesson.content} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir enlace
                </a>
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <p className="whitespace-pre-wrap">{lesson.content}</p>
            </CardContent>
          </Card>
        );
    }
  };

  const renderAttachments = () => {
    const attachments = (lesson as any)?.attachments;
    if (!attachments || attachments.length === 0) return null;

    return (
      <Card className="mt-6">
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Archivos Adjuntos
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {attachments.map((attachment: any, index: number) => (
              <a
                key={index}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-accent transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{attachment.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(attachment.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Lesson Header */}
      <div className="p-4 lg:p-6 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className={cn('gap-1', typeInfo.color)}>
                <TypeIcon className="w-3 h-3" />
                {typeInfo.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Módulo {moduleIndex + 1} • Lección {lessonIndex + 1}
              </span>
              {lesson.duration && (
                <span className="text-sm text-muted-foreground">• {lesson.duration}</span>
              )}
            </div>
            <h1 className="text-xl lg:text-2xl font-bold">{lesson.title}</h1>
          </div>

          {/* Complete Button */}
          {!isCompleted ? (
            <Button
              onClick={onMarkComplete}
              disabled={isMarkingComplete}
              className="gap-2 shrink-0"
              size="lg"
            >
              {isMarkingComplete ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Marcar completada
            </Button>
          ) : (
            <Badge className="gap-2 py-2 px-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Completada
            </Badge>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-5xl mx-auto">
          {renderContent()}
          {renderAttachments()}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="border-t p-4 bg-card/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {currentPosition} de {totalLessons}
            </span>
            <div className="hidden sm:flex gap-1">
              {Array.from({ length: Math.min(totalLessons, 10) }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    i < currentPosition ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
              {totalLessons > 10 && (
                <span className="text-xs text-muted-foreground ml-1">...</span>
              )}
            </div>
          </div>

          <Button
            onClick={onNext}
            disabled={!hasNext}
            className="gap-2"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
