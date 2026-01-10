import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette } from 'lucide-react';

export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
}

interface ColorPickerProps {
  colors: ThemeColors;
  onChange: (colors: ThemeColors) => void;
}

// Presets de colores populares
const colorPresets = [
  { name: 'Rojo Clásico', primary: '0 72% 51%', accent: '0 0% 10%' },
  { name: 'Azul Profesional', primary: '217 91% 60%', accent: '215 25% 27%' },
  { name: 'Verde Natural', primary: '142 71% 45%', accent: '142 40% 15%' },
  { name: 'Dorado Elegante', primary: '45 93% 47%', accent: '30 20% 15%' },
  { name: 'Púrpura Premium', primary: '262 83% 58%', accent: '262 40% 15%' },
  { name: 'Naranja Energético', primary: '25 95% 53%', accent: '25 40% 15%' },
];

// Convertir HSL string a hex para el color picker
const hslToHex = (hsl: string): string => {
  try {
    const [h, s, l] = hsl.split(' ').map((v, i) => {
      const num = parseFloat(v.replace('%', ''));
      return i === 0 ? num : num / 100;
    });
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch {
    return '#dc2626';
  }
};

// Convertir hex a HSL string
const hexToHsl = (hex: string): string => {
  try {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0 72% 51%';
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch {
    return '0 72% 51%';
  }
};

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

const ColorInput = ({ label, value, onChange, description }: ColorInputProps) => {
  const [hexValue, setHexValue] = useState(hslToHex(value));

  useEffect(() => {
    setHexValue(hslToHex(value));
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setHexValue(hex);
    onChange(hexToHsl(hex));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={hexValue}
            onChange={handleColorChange}
            className="w-10 h-10 rounded-lg border border-border cursor-pointer"
          />
        </div>
        <Input
          value={hexValue}
          onChange={(e) => {
            const hex = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
              setHexValue(hex);
              onChange(hexToHsl(hex));
            } else {
              setHexValue(hex);
            }
          }}
          placeholder="#dc2626"
          className="flex-1 font-mono text-sm"
        />
      </div>
    </div>
  );
};

export const ColorPicker = ({ colors, onChange }: ColorPickerProps) => {
  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    onChange({ ...colors, [key]: value });
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    onChange({
      ...colors,
      primary: preset.primary,
      accent: preset.accent,
    });
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Presets de Colores</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {colorPresets.map((preset) => (
            <Button
              key={preset.name}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
              className="justify-start gap-2 h-auto py-2"
            >
              <div
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: hslToHex(preset.primary) }}
              />
              <span className="text-xs">{preset.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Color Inputs */}
      <div className="grid gap-4">
        <ColorInput
          label="Color Primario"
          value={colors.primary}
          onChange={(v) => handleColorChange('primary', v)}
          description="Botones, enlaces"
        />
        <ColorInput
          label="Texto Primario"
          value={colors.primaryForeground}
          onChange={(v) => handleColorChange('primaryForeground', v)}
          description="Texto sobre primario"
        />
        <ColorInput
          label="Color de Acento"
          value={colors.accent}
          onChange={(v) => handleColorChange('accent', v)}
          description="Fondos destacados"
        />
        <ColorInput
          label="Fondo"
          value={colors.background}
          onChange={(v) => handleColorChange('background', v)}
          description="Fondo principal"
        />
        <ColorInput
          label="Texto Principal"
          value={colors.foreground}
          onChange={(v) => handleColorChange('foreground', v)}
          description="Textos generales"
        />
      </div>

      {/* Preview */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Vista Previa</Label>
        <div
          className="rounded-lg p-4 border"
          style={{ backgroundColor: hslToHex(colors.background) }}
        >
          <h3
            className="text-lg font-bold mb-2"
            style={{ color: hslToHex(colors.foreground) }}
          >
            Título de Ejemplo
          </h3>
          <p
            className="text-sm mb-3"
            style={{ color: hslToHex(colors.mutedForeground || colors.foreground) }}
          >
            Este es un texto de ejemplo para ver cómo se verán los colores.
          </p>
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: hslToHex(colors.primary),
              color: hslToHex(colors.primaryForeground),
            }}
          >
            Botón de Ejemplo
          </button>
        </div>
      </div>
    </div>
  );
};
