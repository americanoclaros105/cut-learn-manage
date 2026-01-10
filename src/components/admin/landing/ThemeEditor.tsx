import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorPicker, ThemeColors } from '@/components/admin/ColorPicker';
import { Palette } from 'lucide-react';

interface ThemeEditorProps {
  colors: ThemeColors;
  onChange: (colors: ThemeColors) => void;
}

export const ThemeEditor = ({ colors, onChange }: ThemeEditorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Colores del Tema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ColorPicker colors={colors} onChange={onChange} />
      </CardContent>
    </Card>
  );
};
