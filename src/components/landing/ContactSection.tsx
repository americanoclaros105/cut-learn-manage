import { LandingContent } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ContactSectionProps {
  content: LandingContent['contact'];
}

export const ContactSection = ({ content }: ContactSectionProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('¡Mensaje enviado! Te contactaremos pronto.');
    setFormData({ name: '', email: '', message: '' });
  };

  const handleWhatsAppClick = () => {
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
              <MessageCircle className="w-5 h-5" />
              Escríbenos por WhatsApp
            </Button>
          </div>

          {/* Contact Form */}
          <div className="bg-card rounded-lg p-8 shadow-xl">
            <h3 className="text-xl font-semibold text-card-foreground mb-6">
              Envíanos un Mensaje
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Tu nombre"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-background"
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Tu email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-background"
                />
              </div>
              <div>
                <Textarea
                  placeholder="Tu mensaje"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={5}
                  className="bg-background"
                />
              </div>
              <Button type="submit" className="w-full">
                Enviar Mensaje
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
