import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/admin/ImageUploader';

interface HeroContent {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage: string;
}

interface HeroEditorProps {
  content: HeroContent;
  onChange: (content: HeroContent) => void;
}

export const HeroEditor = ({ content, onChange }: HeroEditorProps) => {
  const updateField = <K extends keyof HeroContent>(key: K, value: HeroContent[K]) => {
    onChange({ ...content, [key]: value });
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contenido del Hero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título Principal</Label>
            <Input
              value={content.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="El Arte del Estilo Masculino"
            />
          </div>

          <div className="space-y-2">
            <Label>Subtítulo</Label>
            <Textarea
              value={content.subtitle}
              onChange={(e) => updateField('subtitle', e.target.value)}
              placeholder="Más de 10 años transformando estilos..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Texto del Botón</Label>
            <Input
              value={content.ctaText}
              onChange={(e) => updateField('ctaText', e.target.value)}
              placeholder="Reservar Cita"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Imagen de Fondo</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploader
            value={content.backgroundImage}
            onChange={(url) => updateField('backgroundImage', url)}
            placeholder="Imagen de fondo del hero"
          />
        </CardContent>
      </Card>
    </div>
  );
};
