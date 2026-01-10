import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Upload, X, Link, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
}

export const ImageUploader = ({
  value,
  onChange,
  placeholder = 'Imagen',
  className = '',
}: ImageUploaderProps) => {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadImage, isUploading, progress, error, maxSize, allowedTypes } = useImageUpload();

  const handleFileSelect = async (file: File) => {
    const result = await uploadImage(file);
    if (result) {
      onChange(result.url);
      toast.success('Imagen subida correctamente');
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  }, []);

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
  const allowedExtensions = allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Preview */}
      {value && (
        <div className="relative group rounded-lg overflow-hidden border border-border bg-muted">
          <img
            src={value}
            alt={placeholder}
            className="w-full h-40 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
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
              <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <>
              <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                Arrastra una imagen o haz clic para seleccionar
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
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <Link className="w-3 h-3" />
          {showUrlInput ? 'Ocultar' : 'Usar URL'}
        </button>
        <div className="flex-1 h-px bg-border" />
      </div>

      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="flex-1"
          />
          <Button type="button" size="sm" onClick={handleUrlApply} disabled={!urlInput.trim()}>
            Aplicar
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
