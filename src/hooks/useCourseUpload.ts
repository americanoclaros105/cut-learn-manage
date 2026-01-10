import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ContentType = 'video' | 'pdf' | 'image' | 'document' | 'audio';

interface FileConfig {
  maxSize: number;
  allowedTypes: string[];
  folder: string;
}

const FILE_CONFIGS: Record<ContentType, FileConfig> = {
  video: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    folder: 'videos',
  },
  pdf: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['application/pdf'],
    folder: 'pdfs',
  },
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    folder: 'images',
  },
  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    folder: 'documents',
  },
  audio: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'],
    folder: 'audio',
  },
};

interface UploadResult {
  url: string;
  path: string;
  fileName: string;
  size: number;
  type: string;
}

interface UseCourseUploadOptions {
  courseId?: string;
  contentType: ContentType;
}

export const useCourseUpload = ({ courseId, contentType }: UseCourseUploadOptions) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const config = FILE_CONFIGS[contentType];

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!config.allowedTypes.includes(file.type)) {
        return `Tipo de archivo no permitido. Formatos aceptados: ${config.allowedTypes
          .map((t) => t.split('/')[1].toUpperCase())
          .join(', ')}`;
      }

      if (file.size > config.maxSize) {
        const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(0);
        return `El archivo excede el tamaño máximo de ${maxSizeMB}MB`;
      }

      return null;
    },
    [config]
  );

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setError(null);
      setProgress(0);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return null;
      }

      setIsUploading(true);

      try {
        // Create unique file name
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const safeName = file.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .substring(0, 50);
        const fileName = `${timestamp}_${safeName}`;

        // Build path: folder/courseId/filename or folder/general/filename
        const folderPath = courseId ? `${config.folder}/${courseId}` : `${config.folder}/general`;
        const filePath = `${folderPath}/${fileName}`;

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('course-content')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('course-content')
          .getPublicUrl(data.path);

        setProgress(100);

        return {
          url: urlData.publicUrl,
          path: data.path,
          fileName: file.name,
          size: file.size,
          type: file.type,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al subir el archivo';
        setError(message);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [courseId, config, validateFile]
  );

  const deleteFile = useCallback(async (path: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase.storage
        .from('course-content')
        .remove([path]);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar el archivo';
      setError(message);
      return false;
    }
  }, []);

  const getFileUrl = useCallback((path: string): string => {
    const { data } = supabase.storage.from('course-content').getPublicUrl(path);
    return data.publicUrl;
  }, []);

  return {
    uploadFile,
    deleteFile,
    getFileUrl,
    isUploading,
    progress,
    error,
    maxSize: config.maxSize,
    allowedTypes: config.allowedTypes,
  };
};

// Helper to determine content type from lesson type
export const getContentTypeFromLessonType = (
  lessonType: 'video' | 'pdf' | 'text' | 'image' | 'link' | 'quiz'
): ContentType | null => {
  switch (lessonType) {
    case 'video':
      return 'video';
    case 'pdf':
      return 'pdf';
    case 'image':
      return 'image';
    default:
      return null;
  }
};

// Check if content is a storage URL vs external URL
export const isStorageUrl = (url: string): boolean => {
  return url.includes('supabase') && url.includes('course-content');
};

// Extract path from storage URL for deletion
export const extractPathFromUrl = (url: string): string | null => {
  try {
    const match = url.match(/course-content\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};
