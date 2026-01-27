import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  File,
  FileText,
  Download,
  ExternalLink,
  ImageIcon,
  Link as LinkIcon,
  PlayCircle,
  Maximize2,
} from 'lucide-react';
import { Lesson } from '@/hooks/useCourses';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LessonPlayerProps {
  lesson: Lesson;
  isLoading?: boolean;
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

export const LessonPlayer = ({ lesson, isLoading }: LessonPlayerProps) => {
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!lesson.content) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <File className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-center">
            Esta lección no tiene contenido disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderContent = () => {
    switch (lesson.type) {
      case 'video':
        if (isExternalVideoUrl(lesson.content)) {
          return (
            <motion.div
              className={cn(
                'bg-black rounded-xl overflow-hidden shadow-2xl transition-all duration-300',
                isTheaterMode ? 'fixed inset-4 z-50' : 'aspect-video'
              )}
              layoutId="video-player"
            >
              <iframe
                src={getEmbedUrl(lesson.content)}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={lesson.title}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setIsTheaterMode(!isTheaterMode)}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </motion.div>
          );
        }
        return (
          <div
            className={cn(
              'bg-black rounded-xl overflow-hidden shadow-2xl relative',
              isTheaterMode ? 'fixed inset-4 z-50' : 'aspect-video'
            )}
          >
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
                  <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-sm text-muted-foreground">Documento PDF</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <a href={lesson.content} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir
                  </a>
                </Button>
              </CardContent>
            </Card>
            <div className="rounded-xl overflow-hidden shadow-lg border h-[60vh] lg:h-[70vh]">
              <iframe
                src={lesson.content}
                className="w-full h-full"
                title={lesson.title}
              />
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="flex justify-center">
            {!imageLoaded && (
              <Skeleton className="aspect-video w-full max-w-3xl rounded-xl" />
            )}
            <img
              src={lesson.content}
              alt={lesson.title}
              className={cn(
                'max-w-full max-h-[70vh] rounded-xl shadow-2xl object-contain',
                !imageLoaded && 'hidden'
              )}
              onLoad={() => setImageLoaded(true)}
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
                Esta lección contiene un enlace a un recurso externo.
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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
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
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
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
      </motion.div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={lesson.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="lesson-enter"
      >
        {renderContent()}
        {renderAttachments()}
      </motion.div>
    </AnimatePresence>
  );
};

export const getLessonTypeInfo = (type: string) => {
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
