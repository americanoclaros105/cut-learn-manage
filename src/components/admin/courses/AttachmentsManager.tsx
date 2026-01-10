import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCourseUpload, ContentType } from '@/hooks/useCourseUpload';
import {
  Plus,
  X,
  FileText,
  File,
  Download,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  path?: string;
  size: number;
  type: string;
}

interface AttachmentsManagerProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  courseId?: string;
  maxFiles?: number;
}

export const AttachmentsManager = ({
  attachments,
  onChange,
  courseId,
  maxFiles = 10,
}: AttachmentsManagerProps) => {
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use document type for general attachments
  const { uploadFile, isUploading, progress, error } = useCourseUpload({
    courseId,
    contentType: 'document',
  });

  // Also support PDFs
  const pdfUploader = useCourseUpload({
    courseId,
    contentType: 'pdf',
  });

  const getContentType = (mimeType: string): ContentType => {
    if (mimeType === 'application/pdf') return 'pdf';
    return 'document';
  };

  const handleFileSelect = async (file: File) => {
    if (attachments.length >= maxFiles) {
      toast.error(`Máximo ${maxFiles} archivos permitidos`);
      return;
    }

    setUploadingName(file.name);

    // Use appropriate uploader based on file type
    const uploader = file.type === 'application/pdf' ? pdfUploader : { uploadFile, error };
    const result = await uploader.uploadFile(file);

    if (result) {
      const newAttachment: Attachment = {
        id: crypto.randomUUID(),
        name: file.name,
        url: result.url,
        path: result.path,
        size: file.size,
        type: file.type,
      };
      onChange([...attachments, newAttachment]);
      toast.success('Archivo adjunto agregado');
    } else if (uploader.error) {
      toast.error(uploader.error);
    }

    setUploadingName(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleRemove = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id));
    toast.success('Archivo eliminado');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') {
      return <FileText className="w-4 h-4 text-red-500" />;
    }
    return <File className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Archivos Adjuntos ({attachments.length}/{maxFiles})
        </label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || pdfUploader.isUploading || attachments.length >= maxFiles}
        >
          <Plus className="w-4 h-4 mr-1" />
          Agregar
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Uploading state */}
      {(isUploading || pdfUploader.isUploading) && uploadingName && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium truncate">{uploadingName}</p>
            <Progress value={progress || pdfUploader.progress} className="h-1 mt-1" />
          </div>
        </div>
      )}

      {/* Attachments list */}
      {attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
            >
              {getFileIcon(attachment.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  asChild
                  className="h-8 w-8"
                >
                  <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4" />
                  </a>
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemove(attachment.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay archivos adjuntos
        </p>
      )}

      {(error || pdfUploader.error) && (
        <p className="text-sm text-destructive">{error || pdfUploader.error}</p>
      )}
    </div>
  );
};
