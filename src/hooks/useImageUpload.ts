import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseImageUploadOptions {
  bucket?: string;
  maxSize?: number; // en bytes
  allowedTypes?: string[];
}

interface UploadResult {
  url: string;
  path: string;
}

const DEFAULT_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const useImageUpload = (options: UseImageUploadOptions = {}) => {
  const {
    bucket = 'landing-images',
    maxSize = DEFAULT_MAX_SIZE,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido. Solo se aceptan: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`,
      };
    }

    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `El archivo es muy pesado (${fileSizeMB}MB). Máximo permitido: ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  };

  const uploadImage = async (file: File): Promise<UploadResult | null> => {
    setError(null);
    setProgress(0);

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Error de validación');
      return null;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName;

      setProgress(30);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      setProgress(80);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setProgress(100);

      return {
        url: publicUrl,
        path: filePath,
      };
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (path: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la imagen');
      return false;
    }
  };

  const getPathFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === bucket);
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }
      return null;
    } catch {
      return null;
    }
  };

  return {
    uploadImage,
    deleteImage,
    validateFile,
    getPathFromUrl,
    isUploading,
    progress,
    error,
    maxSize,
    allowedTypes,
  };
};
