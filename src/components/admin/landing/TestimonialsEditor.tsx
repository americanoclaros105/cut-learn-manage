import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/admin/ImageUploader';
import {
  useTestimonials,
  useCreateTestimonial,
  useUpdateTestimonial,
  useDeleteTestimonial,
  Testimonial,
} from '@/hooks/useLandingContent';
import { Plus, Trash2, Edit2, X, Check, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TestimonialFormData {
  name: string;
  content: string;
  rating: number;
  avatar: string;
}

const defaultTestimonialData: TestimonialFormData = {
  name: '',
  content: '',
  rating: 5,
  avatar: '',
};

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className="focus:outline-none"
      >
        <Star
          className={`w-5 h-5 ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
        />
      </button>
    ))}
  </div>
);

export const TestimonialsEditor = () => {
  const { data: testimonials, isLoading } = useTestimonials();
  const createTestimonial = useCreateTestimonial();
  const updateTestimonial = useUpdateTestimonial();
  const deleteTestimonial = useDeleteTestimonial();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<TestimonialFormData>(defaultTestimonialData);
  const [isCreating, setIsCreating] = useState(false);
  const [newTestimonialData, setNewTestimonialData] = useState<TestimonialFormData>(defaultTestimonialData);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newTestimonialData.name.trim() || !newTestimonialData.content.trim()) {
      toast.error('El nombre y el testimonio son requeridos');
      return;
    }

    try {
      await createTestimonial.mutateAsync({
        name: newTestimonialData.name,
        content: newTestimonialData.content,
        rating: newTestimonialData.rating,
        avatar: newTestimonialData.avatar || null,
        order_num: (testimonials?.length || 0) + 1,
      });
      setNewTestimonialData(defaultTestimonialData);
      setIsCreating(false);
      toast.success('Testimonio creado');
    } catch (error) {
      toast.error('Error al crear el testimonio');
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingId(testimonial.id);
    setEditData({
      name: testimonial.name,
      content: testimonial.content,
      rating: testimonial.rating,
      avatar: testimonial.avatar || '',
    });
  };

  const handleSave = async () => {
    if (!editingId || !editData.name.trim() || !editData.content.trim()) {
      toast.error('El nombre y el testimonio son requeridos');
      return;
    }

    try {
      await updateTestimonial.mutateAsync({
        id: editingId,
        name: editData.name,
        content: editData.content,
        rating: editData.rating,
        avatar: editData.avatar || null,
      });
      setEditingId(null);
      toast.success('Testimonio actualizado');
    } catch (error) {
      toast.error('Error al actualizar el testimonio');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteTestimonial.mutateAsync(deleteId);
      setDeleteId(null);
      toast.success('Testimonio eliminado');
    } catch (error) {
      toast.error('Error al eliminar el testimonio');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Testimonials List */}
      <div className="grid gap-4">
        {testimonials?.map((testimonial) => (
          <Card key={testimonial.id}>
            <CardContent className="p-4">
              {editingId === testimonial.id ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-4">
                      <div className="space-y-2">
                        <Label>Nombre del Cliente</Label>
                        <Input
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Testimonio</Label>
                        <Textarea
                          value={editData.content}
                          onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Calificación</Label>
                        <StarRating
                          value={editData.rating}
                          onChange={(v) => setEditData({ ...editData, rating: v })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Avatar (opcional)</Label>
                      <ImageUploader
                        value={editData.avatar}
                        onChange={(url) => setEditData({ ...editData, avatar: url })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={updateTestimonial.isPending}
                    >
                      {updateTestimonial.isPending ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-1" />
                      )}
                      Guardar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  {testimonial.avatar ? (
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-medium">{testimonial.name[0]}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{testimonial.name}</h4>
                      <div className="flex">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      "{testimonial.content}"
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(testimonial)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(testimonial.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create New Testimonial */}
      {isCreating ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nuevo Testimonio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-4">
                <div className="space-y-2">
                  <Label>Nombre del Cliente *</Label>
                  <Input
                    value={newTestimonialData.name}
                    onChange={(e) => setNewTestimonialData({ ...newTestimonialData, name: e.target.value })}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Testimonio *</Label>
                  <Textarea
                    value={newTestimonialData.content}
                    onChange={(e) => setNewTestimonialData({ ...newTestimonialData, content: e.target.value })}
                    placeholder="Excelente servicio, muy profesionales..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Calificación</Label>
                  <StarRating
                    value={newTestimonialData.rating}
                    onChange={(v) => setNewTestimonialData({ ...newTestimonialData, rating: v })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Avatar (opcional)</Label>
                <ImageUploader
                  value={newTestimonialData.avatar}
                  onChange={(url) => setNewTestimonialData({ ...newTestimonialData, avatar: url })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewTestimonialData(defaultTestimonialData);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createTestimonial.isPending}>
                {createTestimonial.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-1" />
                )}
                Crear Testimonio
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Testimonio
        </Button>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar testimonio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El testimonio será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
