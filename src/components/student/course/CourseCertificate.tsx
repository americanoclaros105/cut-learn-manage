import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Award, Share2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CourseCertificateProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  courseName: string;
  completionDate: Date;
  totalLessons: number;
}

export const CourseCertificate = ({
  isOpen,
  onClose,
  studentName,
  courseName,
  completionDate,
  totalLessons,
}: CourseCertificateProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const formattedDate = format(completionDate, "d 'de' MMMM 'de' yyyy", { locale: es });

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Certificado-${courseName.replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!certificateRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `Certificado-${courseName.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Certificado de Finalización
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Certificate Preview */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="overflow-auto"
          >
            <div
              ref={certificateRef}
              className="w-[800px] h-[566px] mx-auto bg-white relative overflow-hidden"
              style={{
                backgroundImage: `
                  linear-gradient(135deg, #fef3c7 0%, #fde68a 25%, #fbbf24 50%, #f59e0b 75%, #d97706 100%)
                `,
              }}
            >
              {/* Inner white area */}
              <div className="absolute inset-4 bg-white rounded-lg shadow-lg flex flex-col items-center justify-center p-8">
                {/* Decorative corners */}
                <div className="absolute top-2 left-2 w-16 h-16 border-t-4 border-l-4 border-amber-500 rounded-tl-lg" />
                <div className="absolute top-2 right-2 w-16 h-16 border-t-4 border-r-4 border-amber-500 rounded-tr-lg" />
                <div className="absolute bottom-2 left-2 w-16 h-16 border-b-4 border-l-4 border-amber-500 rounded-bl-lg" />
                <div className="absolute bottom-2 right-2 w-16 h-16 border-b-4 border-r-4 border-amber-500 rounded-br-lg" />

                {/* Award Icon */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4 shadow-lg">
                  <Award className="w-10 h-10 text-white" />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-serif font-bold text-gray-800 mb-2 tracking-wide">
                  CERTIFICADO DE FINALIZACIÓN
                </h1>
                
                <div className="w-32 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 rounded mb-6" />

                {/* Subtitle */}
                <p className="text-gray-600 text-lg mb-4">Se otorga el presente certificado a</p>

                {/* Student Name */}
                <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4 border-b-2 border-amber-400 pb-2 px-8">
                  {studentName}
                </h2>

                {/* Course completion text */}
                <p className="text-gray-600 text-lg text-center max-w-lg mb-2">
                  Por haber completado satisfactoriamente el curso
                </p>

                {/* Course Name */}
                <h3 className="text-2xl font-bold text-amber-700 mb-4 text-center max-w-lg">
                  "{courseName}"
                </h3>

                {/* Stats */}
                <p className="text-gray-500 text-sm mb-6">
                  {totalLessons} lecciones completadas
                </p>

                {/* Date and signature area */}
                <div className="flex items-end justify-between w-full max-w-md mt-auto">
                  <div className="text-center">
                    <div className="w-32 border-t-2 border-gray-300 pt-2">
                      <p className="text-sm text-gray-600">{formattedDate}</p>
                      <p className="text-xs text-gray-400">Fecha de finalización</p>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-32 border-t-2 border-gray-300 pt-2">
                      <p className="text-sm text-gray-600 font-script italic">Academia</p>
                      <p className="text-xs text-gray-400">Firma autorizada</p>
                    </div>
                  </div>
                </div>

                {/* Verification */}
                <p className="text-xs text-gray-400 mt-4">
                  Certificado generado digitalmente • ID: {Date.now().toString(36).toUpperCase()}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Download Actions */}
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generando...' : 'Descargar PDF'}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Descargar Imagen
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
