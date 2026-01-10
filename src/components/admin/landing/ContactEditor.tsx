import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';

interface ContactContent {
  phone: string;
  whatsapp: string;
  whatsappMessage: string;
  email: string;
  address: string;
  hours: string;
  mapEmbed?: string;
}

interface ContactEditorProps {
  content: ContactContent;
  onChange: (content: ContactContent) => void;
}

export const ContactEditor = ({ content, onChange }: ContactEditorProps) => {
  const updateField = <K extends keyof ContactContent>(key: K, value: ContactContent[K]) => {
    onChange({ ...content, [key]: value });
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información de Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Teléfono
            </Label>
            <Input
              value={content.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+1 234 567 8900"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              type="email"
              value={content.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="info@ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Dirección
            </Label>
            <Input
              value={content.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Calle Principal 123, Ciudad"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horarios
            </Label>
            <Input
              value={content.hours}
              onChange={(e) => updateField('hours', e.target.value)}
              placeholder="Lunes a Sábado: 9:00 AM - 8:00 PM"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Número de WhatsApp</Label>
            <Input
              value={content.whatsapp}
              onChange={(e) => updateField('whatsapp', e.target.value)}
              placeholder="+1234567890"
            />
            <p className="text-xs text-muted-foreground">
              Solo números, incluyendo código de país (ej: +521234567890)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Mensaje predefinido</Label>
            <Textarea
              value={content.whatsappMessage}
              onChange={(e) => updateField('whatsappMessage', e.target.value)}
              placeholder="Hola! Me gustaría reservar una cita."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Este mensaje se enviará automáticamente cuando el cliente haga clic en WhatsApp
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Vista previa del enlace:</p>
            <a
              href={`https://wa.me/${content.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(content.whatsappMessage || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline break-all"
            >
              wa.me/{content.whatsapp?.replace(/\D/g, '')}
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
