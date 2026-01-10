import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
}

interface SocialEditorProps {
  content: SocialLinks;
  onChange: (content: SocialLinks) => void;
}

export const SocialEditor = ({ content, onChange }: SocialEditorProps) => {
  const updateField = (key: keyof SocialLinks, value: string) => {
    onChange({ ...content, [key]: value || undefined });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Redes Sociales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <i className="fab fa-instagram text-pink-600" />
            Instagram
          </Label>
          <Input
            value={content.instagram || ''}
            onChange={(e) => updateField('instagram', e.target.value)}
            placeholder="https://instagram.com/tucuenta"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <i className="fab fa-facebook text-blue-600" />
            Facebook
          </Label>
          <Input
            value={content.facebook || ''}
            onChange={(e) => updateField('facebook', e.target.value)}
            placeholder="https://facebook.com/tupagina"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <i className="fab fa-tiktok" />
            TikTok
          </Label>
          <Input
            value={content.tiktok || ''}
            onChange={(e) => updateField('tiktok', e.target.value)}
            placeholder="https://tiktok.com/@tucuenta"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <i className="fab fa-youtube text-red-600" />
            YouTube
          </Label>
          <Input
            value={content.youtube || ''}
            onChange={(e) => updateField('youtube', e.target.value)}
            placeholder="https://youtube.com/tucanal"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Deja vacío el campo si no quieres mostrar esa red social
        </p>
      </CardContent>
    </Card>
  );
};
