import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/admin/ImageUploader';
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  Service,
} from '@/hooks/useLandingContent';
import { Plus, Trash2, GripVertical, Edit2, X, Check, Loader2 } from 'lucide-react';
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

interface ServiceFormData {
  name: string;
  description: string;
  price: number;
  duration: string;
  image: string;
}

const defaultServiceData: ServiceFormData = {
  name: '',
  description: '',
  price: 0,
  duration: '',
  image: '',
};

export const ServicesEditor = () => {
  const { data: services, isLoading } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<ServiceFormData>(defaultServiceData);
  const [isCreating, setIsCreating] = useState(false);
  const [newServiceData, setNewServiceData] = useState<ServiceFormData>(defaultServiceData);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newServiceData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      await createService.mutateAsync({
        name: newServiceData.name,
        description: newServiceData.description || null,
        price: newServiceData.price,
        duration: newServiceData.duration || null,
        image: newServiceData.image || null,
        order_num: (services?.length || 0) + 1,
      });
      setNewServiceData(defaultServiceData);
      setIsCreating(false);
      toast.success('Servicio creado');
    } catch (error) {
      toast.error('Error al crear el servicio');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setEditData({
      name: service.name,
      description: service.description || '',
      price: service.price,
      duration: service.duration || '',
      image: service.image || '',
    });
  };

  const handleSave = async () => {
    if (!editingId || !editData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      await updateService.mutateAsync({
        id: editingId,
        name: editData.name,
        description: editData.description || null,
        price: editData.price,
        duration: editData.duration || null,
        image: editData.image || null,
      });
      setEditingId(null);
      toast.success('Servicio actualizado');
    } catch (error) {
      toast.error('Error al actualizar el servicio');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteService.mutateAsync(deleteId);
      setDeleteId(null);
      toast.success('Servicio eliminado');
    } catch (error) {
      toast.error('Error al eliminar el servicio');
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
      {/* Services List */}
      <div className="grid gap-4">
        {services?.map((service) => (
          <Card key={service.id}>
            <CardContent className="p-4">
              {editingId === service.id ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea
                          value={editData.description}
                          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Precio ($)</Label>
                          <Input
                            type="number"
                            value={editData.price}
                            onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Duración</Label>
                          <Input
                            value={editData.duration}
                            onChange={(e) => setEditData({ ...editData, duration: e.target.value })}
                            placeholder="30 min"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Imagen</Label>
                      <ImageUploader
                        value={editData.image}
                        onChange={(url) => setEditData({ ...editData, image: url })}
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
                      disabled={updateService.isPending}
                    >
                      {updateService.isPending ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-1" />
                      )}
                      Guardar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                  {service.image && (
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{service.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {service.description || 'Sin descripción'}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      <span className="font-medium text-primary">${service.price}</span>
                      {service.duration && (
                        <span className="text-muted-foreground">{service.duration}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(service)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(service.id)}
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

      {/* Create New Service */}
      {isCreating ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nuevo Servicio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={newServiceData.name}
                    onChange={(e) => setNewServiceData({ ...newServiceData, name: e.target.value })}
                    placeholder="Corte Clásico"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={newServiceData.description}
                    onChange={(e) => setNewServiceData({ ...newServiceData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Precio ($)</Label>
                    <Input
                      type="number"
                      value={newServiceData.price}
                      onChange={(e) => setNewServiceData({ ...newServiceData, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duración</Label>
                    <Input
                      value={newServiceData.duration}
                      onChange={(e) => setNewServiceData({ ...newServiceData, duration: e.target.value })}
                      placeholder="30 min"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Imagen</Label>
                <ImageUploader
                  value={newServiceData.image}
                  onChange={(url) => setNewServiceData({ ...newServiceData, image: url })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewServiceData(defaultServiceData);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createService.isPending}>
                {createService.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-1" />
                )}
                Crear Servicio
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
          Agregar Servicio
        </Button>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El servicio será eliminado permanentemente.
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
