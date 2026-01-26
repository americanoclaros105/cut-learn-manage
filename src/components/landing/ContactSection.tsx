import { LandingContent } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, Mail, MapPin, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '@/lib/utils';

interface ContactSectionProps {
  content: LandingContent['contact'];
  onTrackClick?: (section: string, type: string, label?: string) => void;
}

// Validation schema
const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El nombre solo puede contener letras'),
  email: z
    .string()
    .trim()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido')
    .max(255, 'El email no puede exceder 255 caracteres'),
  message: z
    .string()
    .trim()
    .min(10, 'El mensaje debe tener al menos 10 caracteres')
    .max(1000, 'El mensaje no puede exceder 1000 caracteres'),
});

type FormErrors = Partial<Record<keyof z.infer<typeof contactSchema>, string>>;

export const ContactSection = ({ content, onTrackClick }: ContactSectionProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: keyof typeof formData, value: string) => {
    try {
      const fieldSchema = contactSchema.shape[field];
      fieldSchema.parse(value);
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, [field]: error.errors[0].message }));
      }
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field: keyof typeof formData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const result = contactSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      setTouched({ name: true, email: true, message: true });
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    // Build WhatsApp message with validated data
    const { name, email, message } = result.data;
    const whatsappMessage = `📩 *Nuevo mensaje de contacto*

👤 *Nombre:* ${name}
📧 *Email:* ${email}

💬 *Mensaje:*
${message}`;

    onTrackClick?.('contact', 'form', 'Enviar Mensaje');
    const phone = content.whatsapp.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(whatsappMessage);
    window.open(`https://api.whatsapp.com/send?phone=+${phone}&text=${encodedMessage}`, '_blank');

    toast.success('¡Redirigiendo a WhatsApp!');
    setFormData({ name: '', email: '', message: '' });
    setErrors({});
    setTouched({});
  };

  const handleWhatsAppClick = () => {
    onTrackClick?.('contact', 'button', 'WhatsApp');
    const message = encodeURIComponent(content.whatsappMessage);
    const phone = content.whatsapp.replace(/\D/g, '');
    window.open(`https://api.whatsapp.com/send?phone=+${phone}&text=${message}`, '_blank');
  };

  return (
    <section id="contact" className="section-padding bg-accent text-accent-foreground">
      <div className="container-custom mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Contáctanos</h2>
          <p className="text-accent-foreground/70 max-w-2xl mx-auto">
            Estamos aquí para atenderte. ¡Reserva tu cita o escríbenos!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Ubicación</h3>
                <p className="text-accent-foreground/70">{content.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Teléfono</h3>
                <p className="text-accent-foreground/70">{content.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Email</h3>
                <p className="text-accent-foreground/70">{content.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Horarios</h3>
                <p className="text-accent-foreground/70">{content.hours}</p>
              </div>
            </div>

            <Button
              size="lg"
              onClick={handleWhatsAppClick}
              className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700"
            >
              <i className="fab fa-whatsapp whatsapp-icon text-xl" />
              Escríbenos por WhatsApp
            </Button>
          </div>

          {/* Contact Form */}
          <div className="bg-card rounded-lg p-8 shadow-xl">
            <h3 className="text-xl font-semibold text-card-foreground mb-6">
              Envíanos un Mensaje
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-card-foreground">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Tu nombre completo"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  style={{ color: '#000' }}
                  maxLength={100}
                  className={cn(
                    'bg-background',
                    errors.name && touched.name && 'border-destructive focus-visible:ring-destructive'
                  )}
                />
                {errors.name && touched.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  style={{ color: '#000' }}
                  maxLength={255}
                  className={cn(
                    'bg-background',
                    errors.email && touched.email && 'border-destructive focus-visible:ring-destructive'
                  )}
                />
                {errors.email && touched.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="message" className="text-card-foreground">
                    Mensaje <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {formData.message.length}/1000
                  </span>
                </div>
                <Textarea
                  id="message"
                  placeholder="Escribe tu mensaje aquí..."
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  onBlur={() => handleBlur('message')}
                  style={{ color: '#000' }}
                  maxLength={1000}
                  rows={5}
                  className={cn(
                    'bg-background resize-none',
                    errors.message && touched.message && 'border-destructive focus-visible:ring-destructive'
                  )}
                />
                {errors.message && touched.message && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full gap-2">
                <i className="fab fa-whatsapp text-lg" />
                Enviar por WhatsApp
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
