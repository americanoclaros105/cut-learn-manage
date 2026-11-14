import { useState } from 'react';
import { Copy, Eye, EyeOff, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generatePassword } from '@/lib/studentDetail';
import { fieldProps } from './fieldProps';

interface PasswordFieldProps {
  id: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

/** Password input with show/hide, a generator and copy-to-clipboard for handing it over. */
export const PasswordField = ({ id, value, error, onChange, onBlur }: PasswordFieldProps) => {
  const [visible, setVisible] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Contraseña copiada');
    } catch {
      toast.error('No se pudo copiar. Selecciónala y cópiala manualmente.');
    }
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Input
          {...fieldProps(id, error, true)}
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          className="pr-10"
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          onChange(generatePassword());
          setVisible(true);
        }}
      >
        <Wand2 className="mr-2 h-4 w-4" aria-hidden /> Generar
      </Button>
      <Button type="button" variant="outline" size="icon" aria-label="Copiar contraseña" disabled={!value} onClick={copy}>
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
};
