import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface NewSessionValues {
  startsAt: string;
  endsAt: string | null;
  topic: string;
  location: string;
}

interface NewSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting?: boolean;
  /** Prefills the location (e.g. the one of the group). */
  defaultLocation?: string;
  onSubmit: (values: NewSessionValues) => Promise<void> | void;
}

export const NewSessionDialog = ({ open, onOpenChange, submitting, defaultLocation = '', onSubmit }: NewSessionDialogProps) => {
  const [startsAt, setStartsAt] = useState('');
  const [duration, setDuration] = useState('');
  const [topic, setTopic] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (!open) return;
    setStartsAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setDuration('');
    setTopic('');
    setLocation(defaultLocation);
  }, [open, defaultLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startsAt) return;
    const start = new Date(startsAt);
    const minutes = Number(duration);
    void onSubmit({
      startsAt: start.toISOString(),
      endsAt: minutes > 0 ? new Date(start.getTime() + minutes * 60000).toISOString() : null,
      topic,
      location,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Nueva clase</DialogTitle>
            <DialogDescription>Crea la sesión presencial y luego toma la lista.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="session-start">Fecha y hora</Label>
              <Input id="session-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-duration">Duración en minutos (opcional)</Label>
              <Input id="session-duration" type="number" min={0} step={15} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="120" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-topic">Tema (opcional)</Label>
            <Input id="session-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ej: Técnica de sombreado" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-location">Lugar (opcional)</Label>
            <Input id="session-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Sede principal" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!startsAt || submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear clase
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
