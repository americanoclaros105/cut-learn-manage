import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/admin/ImageUploader';

interface AboutContent {
  title: string;
  description: string;
  mission: string;
  vision: string;
  image: string;
}

interface AboutEditorProps {
  content: AboutContent;
  onChange: (content: AboutContent) => void;
}

export const AboutEditor = ({ content, onChange }: AboutEditorProps) => {
  const updateField = <K extends keyof AboutContent>(key: K, value: AboutContent[K]) => {
    onChange({ ...content, [key]: value });
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título de la Sección</Label>
            <Input
              value={content.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Quiénes Somos"
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={content.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Somos más que una barbería..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Misión</Label>
            <Textarea
              value={content.mission}
              onChange={(e) => updateField('mission', e.target.value)}
              placeholder="Ofrecer servicios de barbería de la más alta calidad..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Visión</Label>
            <Textarea
              value={content.vision}
              onChange={(e) => updateField('vision', e.target.value)}
              placeholder="Ser reconocidos como la barbería líder..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Imagen de la Sección</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploader
            value={content.image}
            onChange={(url) => updateField('image', url)}
            placeholder="Imagen de nosotros"
          />
        </CardContent>
      </Card>
    </div>
  );
};
