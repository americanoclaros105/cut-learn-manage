import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BookOpen, Calendar, Edit, Key, MoreVertical, Phone, Trash2, User } from "lucide-react";
import type { StudentProfile, CourseAssignment } from "@/hooks/useStudents";
import { effectiveAccess, enrollmentBalance, enrollmentStatusLabels, formatCOP } from "@/lib/operations";
import type { EffectiveAccess } from "@/types";

const enrollmentBadgeClass: Record<EffectiveAccess, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
  not_started: 'bg-blue-100 text-blue-700',
  expired: 'bg-red-100 text-red-700',
  account_inactive: 'bg-red-100 text-red-700',
};

const accessLabel = (assignment: CourseAssignment): string => {
  const access = effectiveAccess(assignment);
  if (access === 'not_started') return 'Aún no inicia';
  if (access === 'expired') return 'Expirado';
  return enrollmentStatusLabels[assignment.status];
};

interface Course {
  id: string;
  title: string;
}

interface StudentCardProps {
  student: StudentProfile;
  courses: Course[];
  onEdit: (student: StudentProfile) => void;
  onChangePassword: (student: StudentProfile) => void;
  onDelete: (student: StudentProfile) => void;
}

const statusConfig = {
  active: { label: 'Activo', variant: 'default' as const, className: 'bg-green-500 hover:bg-green-600' },
  inactive: { label: 'Inactivo', variant: 'secondary' as const, className: '' },
  suspended: { label: 'Suspendido', variant: 'destructive' as const, className: '' },
};

export function StudentCard({ student, courses, onEdit, onChangePassword, onDelete }: StudentCardProps) {
  const status = statusConfig[student.status] || statusConfig.active;
  const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  const assignedCourses = student.assigned_courses || [];
  
  const getCourseTitle = (courseId: string) => {
    return courses.find(c => c.id === courseId)?.title || 'Curso desconocido';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sin fecha';
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: es });
  };

  const isExpired = student.expires_at && new Date(student.expires_at) < new Date();
  const expiresInDays = student.expires_at 
    ? Math.ceil((new Date(student.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-14 w-14 border-2 border-muted">
            <AvatarImage src={student.avatar || undefined} alt={student.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg truncate">{student.name}</h3>
              <Badge variant={status.variant} className={status.className}>
                {status.label}
              </Badge>
              {isExpired && (
                <Badge variant="destructive">Expirado</Badge>
              )}
              {!isExpired && expiresInDays !== null && expiresInDays <= 30 && expiresInDays > 0 && (
                <Badge variant="outline" className="border-orange-500 text-orange-600">
                  Expira en {expiresInDays} días
                </Badge>
              )}
            </div>

            {/* Contact info */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
              {student.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {student.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Expira: {formatDate(student.expires_at)}
              </span>
            </div>

            {/* Courses */}
            {assignedCourses.length > 0 && (
              <div className="mt-3 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Cursos asignados ({assignedCourses.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {assignedCourses.slice(0, 3).map((assignment: CourseAssignment) => {
                    const courseExpired = assignment.expires_at && new Date(assignment.expires_at) < new Date();
                    const accessStyle = enrollmentBadgeClass[effectiveAccess(assignment)];
                    const balance = enrollmentBalance(assignment.agreed_price, [
                      { amount: assignment.paid_total ?? 0 },
                    ]);
                    return (
                      <Badge
                        key={assignment.course_id}
                        variant="outline"
                        className={`text-xs ${courseExpired ? 'border-red-300 text-red-600' : ''}`}
                      >
                        <span className={`mr-1.5 rounded px-1 ${accessStyle}`}>
                          {accessLabel(assignment)}
                        </span>
                        {getCourseTitle(assignment.course_id)}
                        {assignment.status === 'pending' && balance.balance > 0 && (
                          <span className="ml-1 opacity-70">
                            · saldo {formatCOP(balance.balance)}
                          </span>
                        )}
                        {assignment.expires_at && (
                          <span className="ml-1 opacity-70">
                            → {formatDate(assignment.expires_at)}
                          </span>
                        )}
                      </Badge>
                    );
                  })}
                  {assignedCourses.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{assignedCourses.length - 3} más
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Notes preview */}
            {student.notes && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-1 italic">
                📝 {student.notes}
              </p>
            )}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(student)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangePassword(student)}>
                <Key className="h-4 w-4 mr-2" />
                Cambiar contraseña
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(student)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
