import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/admin/ImageUploader';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  Product,
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

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  image: string;
}

const defaultProductData: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  image: '',
};

export const ProductsEditor = () => {
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<ProductFormData>(defaultProductData);
  const [isCreating, setIsCreating] = useState(false);
  const [newProductData, setNewProductData] = useState<ProductFormData>(defaultProductData);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newProductData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      await createProduct.mutateAsync({
        name: newProductData.name,
        description: newProductData.description || null,
        price: newProductData.price,
        image: newProductData.image || null,
        order_num: (products?.length || 0) + 1,
      });
      setNewProductData(defaultProductData);
      setIsCreating(false);
      toast.success('Producto creado');
    } catch (error) {
      toast.error('Error al crear el producto');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      image: product.image || '',
    });
  };

  const handleSave = async () => {
    if (!editingId || !editData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      await updateProduct.mutateAsync({
        id: editingId,
        name: editData.name,
        description: editData.description || null,
        price: editData.price,
        image: editData.image || null,
      });
      setEditingId(null);
      toast.success('Producto actualizado');
    } catch (error) {
      toast.error('Error al actualizar el producto');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteProduct.mutateAsync(deleteId);
      setDeleteId(null);
      toast.success('Producto eliminado');
    } catch (error) {
      toast.error('Error al eliminar el producto');
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
      {/* Products List */}
      <div className="grid gap-4">
        {products?.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              {editingId === product.id ? (
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
                      <div className="space-y-2">
                        <Label>Precio ($)</Label>
                        <Input
                          type="number"
                          value={editData.price}
                          onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) || 0 })}
                        />
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
                      disabled={updateProduct.isPending}
                    >
                      {updateProduct.isPending ? (
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
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{product.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {product.description || 'Sin descripción'}
                    </p>
                    <span className="font-medium text-primary text-sm">${product.price}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(product.id)}
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

      {/* Create New Product */}
      {isCreating ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nuevo Producto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={newProductData.name}
                    onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                    placeholder="Pomada para cabello"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={newProductData.description}
                    onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio ($)</Label>
                  <Input
                    type="number"
                    value={newProductData.price}
                    onChange={(e) => setNewProductData({ ...newProductData, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Imagen</Label>
                <ImageUploader
                  value={newProductData.image}
                  onChange={(url) => setNewProductData({ ...newProductData, image: url })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewProductData(defaultProductData);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createProduct.isPending}>
                {createProduct.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-1" />
                )}
                Crear Producto
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
          Agregar Producto
        </Button>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto será eliminado permanentemente.
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
