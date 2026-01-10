import { useState } from 'react';
import { useStudents, useUpdateStudent, StudentProfile } from '@/hooks/useStudents';
import { useCourses } from '@/hooks/useCourses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Edit, Search, Mail, Phone, Calendar, Loader2, Users } from 'lucide-react';

export const StudentsManager = () => {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: courses = [], isLoading: loadingCourses } = useCourses();
  const updateStudent = useUpdateStudent();
  
  const [editingUser, setEditingUser] = useState<StudentProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      await updateStudent.mutateAsync({
        id: editingUser.id,
        name: editingUser.name,
        phone: editingUser.phone,
        status: editingUser.status,
        enabled_from: editingUser.enabled_from,
        expires_at: editingUser.expires_at,
        notes: editingUser.notes,
        assigned_courses: editingUser.assigned_courses,
      });
      setEditingUser(null);
      setIsDialogOpen(false);
      toast.success('Estudiante actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar el estudiante');
    }
  };

  const toggleCourse = (courseId: string) => {
    if (!editingUser) return;
    const assigned = editingUser.assigned_courses?.includes(courseId)
      ? editingUser.assigned_courses.filter((id) => id !== courseId)
      : [...(editingUser.assigned_courses || []), courseId];
    setEditingUser({ ...editingUser, assigned_courses: assigned });
  };

  const filteredUsers = students.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    active: 'bg-green-500/10 text-green-600',
    inactive: 'bg-gray-500/10 text-gray-600',
    suspended: 'bg-red-500/10 text-red-600',
  };

  const statusLabels = {
    active: 'Activo',
    inactive: 'Inactivo',
    suspended: 'Suspendido',
  };

  if (loadingStudents || loadingCourses) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Estudiantes</h1>
          <p className="text-muted-foreground">Administra los usuarios de la academia</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Los estudiantes se crean automáticamente al registrarse en Supabase Auth
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
            <SelectItem value="suspended">Suspendidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No se encontraron estudiantes</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" /> {user.phone}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge className={statusColors[user.status]}>
                          {statusLabels[user.status]}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Expira: {new Date(user.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                      {user.assigned_courses && user.assigned_courses.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {user.assigned_courses.map((courseId) => {
                            const course = courses.find((c) => c.id === courseId);
                            return course ? (
                              <Badge key={courseId} variant="outline" className="text-xs">
                                {course.title}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingUser(user);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Estudiante</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nombre Completo</label>
                  <Input
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Teléfono</label>
                  <Input
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Estado</label>
                  <Select
                    value={editingUser.status}
                    onValueChange={(value: 'active' | 'inactive' | 'suspended') =>
                      setEditingUser({ ...editingUser, status: value })
                    }
                  >
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
                <div>
                  <label className="text-sm font-medium">Habilitado desde</label>
                  <Input
                    type="date"
                    value={editingUser.enabled_from.split('T')[0]}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, enabled_from: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Expira el</label>
                  <Input
                    type="date"
                    value={editingUser.expires_at.split('T')[0]}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, expires_at: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Course Assignment */}
              <div className="border-t pt-4">
                <label className="text-sm font-medium mb-3 block">Cursos Asignados</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {courses
                    .filter((c) => c.status === 'published')
                    .map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-secondary/50 cursor-pointer"
                        onClick={() => toggleCourse(course.id)}
                      >
                        <Checkbox
                          checked={editingUser.assigned_courses?.includes(course.id) || false}
                          onCheckedChange={() => toggleCourse(course.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{course.title}</p>
                          <p className="text-xs text-muted-foreground">{course.duration}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveUser}
                  disabled={updateStudent.isPending}
                >
                  {updateStudent.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
