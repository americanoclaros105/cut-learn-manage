import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Eye, EyeOff, Loader2, Upload, User } from "lucide-react";
import { format } from "date-fns";
import type { StudentProfile, EnrollmentInput } from "@/hooks/useStudents";
import { useImageUpload } from "@/hooks/useImageUpload";
import { enrollmentStatusLabels, formatCOP } from "@/lib/operations";
import type { EnrollmentStatus } from "@/types";

interface Course {
  id: string;
  title: string;
  price?: number;
}

interface CourseAssignmentInput {
  course_id: string;
  enabled_from: string;
  expires_at: string;
  notes: string;
  assigned: boolean;
  /** Agreed total price as typed (string so the input can be edited freely). */
  agreed_price: string;
  /** Present when the student is already enrolled (editing). */
  existing?: {
    status: EnrollmentStatus;
    payment_count: number;
    enabled_from: string | null;
    expires_at: string | null;
  };
}

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: StudentProfile | null;
  courses: Course[];
  onSave: (data: StudentFormData) => Promise<void>;
  isLoading: boolean;
  mode: 'create' | 'edit';
}

export interface StudentFormData {
  email?: string;
  password?: string;
  name: string;
  phone: string;
  avatar: string;
  status: 'active' | 'inactive' | 'suspended';
  enabled_from: string;
  expires_at: string;
  notes: string;
  courses: EnrollmentInput[];
}

export function StudentForm({ 
  open, 
  onOpenChange, 
  student, 
  courses, 
  onSave, 
  isLoading,
  mode 
}: StudentFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'suspended'>('active');
  const [enabledFrom, setEnabledFrom] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [courseAssignments, setCourseAssignments] = useState<CourseAssignmentInput[]>([]);

  const { uploadImage, isUploading } = useImageUpload({ bucket: 'landing-images' });

  // Initialize form with student data
  useEffect(() => {
    if (student && mode === 'edit') {
      setName(student.name || '');
      setPhone(student.phone || '');
      setAvatar(student.avatar || '');
      setStatus(student.status || 'active');
      setEnabledFrom(student.enabled_from ? format(new Date(student.enabled_from), 'yyyy-MM-dd') : '');
      setExpiresAt(student.expires_at ? format(new Date(student.expires_at), 'yyyy-MM-dd') : '');
      setNotes(student.notes || '');
      
      // Initialize course assignments
      const assignments: CourseAssignmentInput[] = courses.map(course => {
        const existing = student.assigned_courses?.find(a => a.course_id === course.id);
        return {
          course_id: course.id,
          enabled_from: existing?.enabled_from ? format(new Date(existing.enabled_from), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          expires_at: existing?.expires_at ? format(new Date(existing.expires_at), 'yyyy-MM-dd') : '',
          notes: existing?.notes || '',
          assigned: !!existing,
          agreed_price: String(existing ? existing.agreed_price : course.price ?? 0),
          existing: existing
            ? {
                status: existing.status,
                payment_count: existing.payment_count ?? 0,
                enabled_from: existing.enabled_from,
                expires_at: existing.expires_at,
              }
            : undefined,
        };
      });
      setCourseAssignments(assignments);
    } else {
      // Reset form for create mode
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
      setAvatar('');
      setStatus('active');
      setEnabledFrom(format(new Date(), 'yyyy-MM-dd'));
      setExpiresAt(format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
      setNotes('');
      setCourseAssignments(courses.map(course => ({
        course_id: course.id,
        enabled_from: format(new Date(), 'yyyy-MM-dd'),
        expires_at: '',
        notes: '',
        assigned: false,
        agreed_price: String(course.price ?? 0),
      })));
    }
  }, [student, mode, courses, open]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const result = await uploadImage(file);
    if (result) {
      setAvatar(result.url);
    }
  };

  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);

  const toggleCourseAssignment = (courseId: string) => {
    const target = courseAssignments.find(c => c.course_id === courseId);
    // Removing an enrollment that already has payments needs explicit confirmation.
    if (target?.assigned && target.existing && target.existing.payment_count > 0) {
      setPendingRemoval(courseId);
      return;
    }
    applyToggle(courseId);
  };

  const applyToggle = (courseId: string) => {
    setCourseAssignments(prev =>
      prev.map(c => 
        c.course_id === courseId ? { ...c, assigned: !c.assigned } : c
      )
    );
  };

  const updateCourseAssignment = (courseId: string, field: keyof CourseAssignmentInput, value: string) => {
    setCourseAssignments(prev => 
      prev.map(c => 
        c.course_id === courseId ? { ...c, [field]: value } : c
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const assignedCourses = courseAssignments
      .filter(c => c.assigned)
      .map((c): EnrollmentInput => {
        // Keep the stored timestamp when the date shown was not changed, so saving
        // does not shift existing dates through the date-only input.
        const sameDay = (stored: string | null | undefined, typed: string) =>
          !!stored && !!typed && format(new Date(stored), 'yyyy-MM-dd') === typed;
        const price = Number(c.agreed_price);
        return {
          course_id: c.course_id,
          enabled_from: sameDay(c.existing?.enabled_from, c.enabled_from)
            ? c.existing!.enabled_from!
            : c.enabled_from ? new Date(c.enabled_from).toISOString() : undefined,
          expires_at: sameDay(c.existing?.expires_at, c.expires_at)
            ? c.existing!.expires_at!
            : c.expires_at ? new Date(c.expires_at).toISOString() : undefined,
          notes: c.notes || undefined,
          agreed_price: c.agreed_price !== '' && Number.isFinite(price) && price >= 0 ? price : undefined,
        };
      });

    const data: StudentFormData = {
      name,
      phone,
      avatar,
      status,
      enabled_from: enabledFrom ? new Date(enabledFrom).toISOString() : new Date().toISOString(),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      notes,
      courses: assignedCourses,
    };

    if (mode === 'create') {
      data.email = email;
      data.password = password;
    }

    await onSave(data);
  };

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'NN';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nuevo Estudiante' : 'Editar Estudiante'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Completa los datos para crear un nuevo estudiante' 
              : 'Modifica los datos del estudiante'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-muted">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" disabled={isUploading} asChild>
                    <span>
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Subir foto
                    </span>
                  </Button>
                </Label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                {avatar && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setAvatar('')}
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Información Personal
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+52 123 456 7890"
                  />
                </div>
              </div>

              {mode === 'create' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="estudiante@email.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Access Configuration */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Configuración de Acceso
              </h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select value={status} onValueChange={(v: 'active' | 'inactive' | 'suspended') => setStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                      <SelectItem value="suspended">Suspendido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="enabled-from">Habilitado desde</Label>
                  <Input
                    id="enabled-from"
                    type="date"
                    value={enabledFrom}
                    onChange={(e) => setEnabledFrom(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expires-at">Expira</Label>
                  <Input
                    id="expires-at"
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Course Assignments */}
            <div className="space-y-4">
              <h4 className="font-medium">Cursos Asignados</h4>
              
              {courses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay cursos disponibles</p>
              ) : (
                <div className="space-y-3">
                  {courseAssignments.map((assignment) => {
                    const course = courses.find(c => c.id === assignment.course_id);
                    if (!course) return null;
                    
                    return (
                      <div 
                        key={assignment.course_id} 
                        className={`p-4 rounded-lg border transition-colors ${
                          assignment.assigned ? 'bg-primary/5 border-primary/30' : 'bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Label htmlFor={`course-${course.id}`} className="font-medium cursor-pointer">
                              {course.title}
                            </Label>
                            {assignment.assigned && (
                              <Badge variant="outline" className="text-xs">
                                {assignment.existing
                                  ? enrollmentStatusLabels[assignment.existing.status]
                                  : 'Nueva inscripción: pendiente de pago'}
                              </Badge>
                            )}
                          </div>
                          <Switch
                            id={`course-${course.id}`}
                            checked={assignment.assigned}
                            onCheckedChange={() => toggleCourseAssignment(course.id)}
                          />
                        </div>
                        
                        {assignment.assigned && (
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="space-y-1 col-span-2">
                              <Label className="text-xs text-muted-foreground">
                                Valor acordado (COP)
                                {course.price !== undefined && ` · precio del curso: ${formatCOP(course.price)}`}
                              </Label>
                              <Input
                                type="number"
                                min={0}
                                step={1000}
                                inputMode="numeric"
                                value={assignment.agreed_price}
                                onChange={(e) => updateCourseAssignment(course.id, 'agreed_price', e.target.value)}
                                className="h-8"
                              />
                              <p className="text-xs text-muted-foreground">
                                El acceso se activa automáticamente cuando los pagos cubren este valor.
                              </p>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Acceso desde</Label>
                              <Input
                                type="date"
                                value={assignment.enabled_from}
                                onChange={(e) => updateCourseAssignment(course.id, 'enabled_from', e.target.value)}
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Expira</Label>
                              <Input
                                type="date"
                                value={assignment.expires_at}
                                onChange={(e) => updateCourseAssignment(course.id, 'expires_at', e.target.value)}
                                className="h-8"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas internas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas privadas sobre el estudiante..."
                rows={3}
              />
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === 'create' ? 'Crear Estudiante' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={pendingRemoval !== null} onOpenChange={(o) => !o && setPendingRemoval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar inscripción con pagos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta inscripción tiene pagos registrados. Si la quitas, los pagos se conservan en el
              historial contable pero quedan desvinculados de la inscripción. Esta acción se aplica
              al guardar los cambios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingRemoval) applyToggle(pendingRemoval);
                setPendingRemoval(null);
              }}
            >
              Quitar inscripción
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
