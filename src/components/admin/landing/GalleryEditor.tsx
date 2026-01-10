import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/admin/ImageUploader';
import {
  useGallery,
  useCreateGalleryItem,
  useUpdateGalleryItem,
  useDeleteGalleryItem,
  GalleryItem,
} from '@/hooks/useLandingContent';
import { Plus, Trash2, Edit2, X, Check, Loader2, Image } from 'lucide-react';
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

interface GalleryFormData {
  image: string;
  caption: string;
}

const defaultGalleryData: GalleryFormData = {
  image: '',
  caption: '',
};

export const GalleryEditor = () => {
  const { data: gallery, isLoading } = useGallery();
  const createGalleryItem = useCreateGalleryItem();
  const updateGalleryItem = useUpdateGalleryItem();
  const deleteGalleryItem = useDeleteGalleryItem();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<GalleryFormData>(defaultGalleryData);
  const [isCreating, setIsCreating] = useState(false);
  const [newItemData, setNewItemData] = useState<GalleryFormData>(defaultGalleryData);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newItemData.image.trim()) {
      toast.error('La imagen es requerida');
      return;
    }

    try {
      await createGalleryItem.mutateAsync({
        image: newItemData.image,
        caption: newItemData.caption || null,
        order_num: (gallery?.length || 0) + 1,
      });
      setNewItemData(defaultGalleryData);
      setIsCreating(false);
      toast.success('Imagen agregada a la galería');
    } catch (error) {
      toast.error('Error al agregar la imagen');
    }
  };

  const handleEdit = (item: GalleryItem) => {
    setEditingId(item.id);
    setEditData({
      image: item.image,
      caption: item.caption || '',
    });
  };

  const handleSave = async () => {
    if (!editingId || !editData.image.trim()) {
      toast.error('La imagen es requerida');
      return;
    }

    try {
      await updateGalleryItem.mutateAsync({
        id: editingId,
        image: editData.image,
        caption: editData.caption || null,
      });
      setEditingId(null);
      toast.success('Imagen actualizada');
    } catch (error) {
      toast.error('Error al actualizar la imagen');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteGalleryItem.mutateAsync(deleteId);
      setDeleteId(null);
      toast.success('Imagen eliminada de la galería');
    } catch (error) {
      toast.error('Error al eliminar la imagen');
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
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {gallery?.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            {editingId === item.id ? (
              <CardContent className="p-3 space-y-3">
                <ImageUploader
                  value={editData.image}
                  onChange={(url) => setEditData({ ...editData, image: url })}
                />
                <Input
                  value={editData.caption}
                  onChange={(e) => setEditData({ ...editData, caption: e.target.value })}
                  placeholder="Descripción (opcional)"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateGalleryItem.isPending}
                  >
                    {updateGalleryItem.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            ) : (
              <>
                <div className="relative aspect-square group">
                  <img
                    src={item.image}
                    alt={item.caption || 'Galería'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {item.caption && (
                  <CardContent className="p-2">
                    <p className="text-xs text-muted-foreground truncate">{item.caption}</p>
                  </CardContent>
                )}
              </>
            )}
          </Card>
        ))}

        {/* Add New Card */}
        {isCreating ? (
          <Card>
            <CardContent className="p-3 space-y-3">
              <ImageUploader
                value={newItemData.image}
                onChange={(url) => setNewItemData({ ...newItemData, image: url })}
              />
              <Input
                value={newItemData.caption}
                onChange={(e) => setNewItemData({ ...newItemData, caption: e.target.value })}
                placeholder="Descripción (opcional)"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreating(false);
                    setNewItemData(defaultGalleryData);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={createGalleryItem.isPending}
                >
                  {createGalleryItem.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card
            className="flex items-center justify-center aspect-square cursor-pointer hover:bg-muted/50 transition-colors border-dashed"
            onClick={() => setIsCreating(true)}
          >
            <div className="text-center">
              <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Agregar imagen</span>
            </div>
          </Card>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar imagen?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La imagen será eliminada de la galería.
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
