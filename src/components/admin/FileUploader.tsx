import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useCourseUpload, ContentType } from '@/hooks/useCourseUpload';
import {
  Upload,
  X,
  Link,
  FileVideo,
  FileText,
  FileImage,
  File,
  Music,
  Loader2,
  Play,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface FileUploaderProps {
  value: string;
  onChange: (url: string) => void;
  contentType: ContentType;
  courseId?: string;
  placeholder?: string;
  className?: string;
  allowUrl?: boolean;
}

const getIcon = (contentType: ContentType) => {
  switch (contentType) {
    case 'video':
      return FileVideo;
    case 'pdf':
      return FileText;
    case 'image':
      return FileImage;
    case 'audio':
      return Music;
    default:
      return File;
  }
};

const getTypeLabel = (contentType: ContentType) => {
  switch (contentType) {
    case 'video':
      return 'video';
    case 'pdf':
      return 'PDF';
    case 'image':
      return 'imagen';
    case 'audio':
      return 'audio';
    case 'document':
      return 'documento';
    default:
      return 'archivo';
  }
};

export const FileUploader = ({
  value,
  onChange,
  contentType,
  courseId,
  placeholder,
  className = '',
  allowUrl = true,
}: FileUploaderProps) => {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading, progress, error, maxSize, allowedTypes } =
    useCourseUpload({ courseId, contentType });

  const Icon = getIcon(contentType);
  const typeLabel = getTypeLabel(contentType);

  const handleFileSelect = async (file: File) => {
    const result = await uploadFile(file);
    if (result) {
      onChange(result.url);
      toast.success(`${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} subido correctamente`);
    } else if (error) {
      toast.error(error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleUrlApply = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
      toast.success('URL aplicada');
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
  const allowedExtensions = allowedTypes
    .map((t) => t.split('/')[1].toUpperCase())
    .join(', ');

  const renderPreview = () => {
    if (!value) return null;

    switch (contentType) {
      case 'image':
        return (
          <img
            src={value}
            alt={placeholder || 'Preview'}
            className="w-full h-40 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        );
      case 'video':
        // Check if it's a YouTube or Vimeo URL
        if (value.includes('youtube.com') || value.includes('youtu.be') || value.includes('vimeo.com')) {
          return (
            <div className="w-full h-40 bg-muted flex items-center justify-center gap-3">
              <Play className="w-8 h-8 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm font-medium">Video externo</p>
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center gap-1"
                >
                  Ver en nueva pestaña <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        }
        return (
          <video
            src={value}
            className="w-full h-40 object-cover bg-black"
            controls
            preload="metadata"
          />
        );
      case 'pdf':
        return (
          <div className="w-full h-40 bg-muted flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-red-500" />
            <div className="text-left">
              <p className="text-sm font-medium">Documento PDF</p>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1"
              >
                Ver PDF <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        );
      case 'audio':
        return (
          <div className="w-full p-4 bg-muted rounded-lg">
            <audio src={value} controls className="w-full" preload="metadata" />
          </div>
        );
      default:
        return (
          <div className="w-full h-40 bg-muted flex items-center justify-center gap-3">
            <File className="w-8 h-8 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Archivo adjunto</p>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1"
              >
                Descargar <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Preview */}
      {value && (
        <div className="relative group rounded-lg overflow-hidden border border-border bg-muted">
          {renderPreview()}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-1" />
              Cambiar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {!value && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${isUploading ? 'pointer-events-none opacity-70' : ''}
          `}
        >
          {isUploading ? (
            <div className="space-y-3">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Subiendo {typeLabel}...</p>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <>
              <Icon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                Arrastra un {typeLabel} o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Máx {maxSizeMB}MB • {allowedExtensions}
              </p>
            </>
          )}
        </div>
      )}

      {/* Hidden Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* URL Option */}
      {allowUrl && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Link className="w-3 h-3" />
              {showUrlInput ? 'Ocultar' : 'Usar URL externa'}
            </button>
            <div className="flex-1 h-px bg-border" />
          </div>

          {showUrlInput && (
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={
                  contentType === 'video'
                    ? 'https://youtube.com/watch?v=...'
                    : `https://ejemplo.com/${typeLabel}.${allowedExtensions.split(',')[0]?.toLowerCase()}`
                }
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleUrlApply}
                disabled={!urlInput.trim()}
              >
                Aplicar
              </Button>
            </div>
          )}
        </>
      )}

      {/* Error Display */}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
