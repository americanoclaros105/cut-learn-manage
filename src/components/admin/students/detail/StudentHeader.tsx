import { ArrowLeft, MessageCircle, Phone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { initialsOf } from '@/lib/studentDetail';
import { formatDate } from './format';

const accountStatus = {
  active: { label: 'Cuenta activa', className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100' },
  inactive: { label: 'Cuenta inactiva', className: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100' },
  suspended: { label: 'Cuenta suspendida', className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100' },
} as const;

export interface HeaderStudent {
  name: string;
  phone: string | null;
  avatar: string | null;
  status: keyof typeof accountStatus;
  created_at: string;
}

interface StudentHeaderProps {
  student: HeaderStudent;
  onBack: () => void;
  onWhatsApp: () => void;
}

/** Sticky identity bar: stays visible while the admin scrolls long tabs. */
export const StudentHeader = ({ student, onBack, onWhatsApp }: StudentHeaderProps) => {
  const status = accountStatus[student.status] ?? accountStatus.active;
  return (
    <header className="sticky top-14 z-30 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur md:top-0 md:-mx-8 md:px-8">
      <Button variant="link" className="mb-1 h-auto p-0 text-muted-foreground" onClick={onBack}>
        <ArrowLeft className="mr-1 h-4 w-4" aria-hidden /> Estudiantes
      </Button>
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="h-14 w-14 border-2 border-muted">
          <AvatarImage src={student.avatar || undefined} alt="" />
          <AvatarFallback className="bg-primary/10 font-semibold text-primary">{initialsOf(student.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-bold">{student.name}</h1>
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {student.phone ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" aria-hidden /> {student.phone}
              </span>
            ) : (
              <span>Sin teléfono</span>
            )}
            <span>Miembro desde {formatDate(student.created_at)}</span>
          </p>
        </div>
        {student.phone && (
          <Button variant="outline" onClick={onWhatsApp}>
            <MessageCircle className="mr-2 h-4 w-4" aria-hidden /> WhatsApp
          </Button>
        )}
      </div>
    </header>
  );
};
