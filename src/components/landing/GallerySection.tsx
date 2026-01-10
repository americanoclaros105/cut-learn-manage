import { useState } from 'react';
import { GalleryItem } from '@/types';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface GallerySectionProps {
  gallery: GalleryItem[];
}

export const GallerySection = ({ gallery }: GallerySectionProps) => {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  return (
    <section id="gallery" className="section-padding bg-secondary">
      <div className="container-custom mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Nuestra Galería
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Una muestra de nuestro trabajo y estilo
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {gallery.map((item, index) => (
            <div
              key={item.id}
              className={`relative overflow-hidden rounded-lg cursor-pointer group ${
                index === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
              onClick={() => setSelectedImage(item)}
            >
              <div className={`aspect-square ${index === 0 ? 'md:aspect-auto md:h-full' : ''}`}>
                <img
                  src={item.image}
                  alt={item.caption || 'Galería'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-accent/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                {item.caption && (
                  <p className="text-primary-foreground font-medium">{item.caption}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            {selectedImage && (
              <div>
                <img
                  src={selectedImage.image}
                  alt={selectedImage.caption || 'Galería'}
                  className="w-full h-auto"
                />
                {selectedImage.caption && (
                  <div className="p-4 bg-accent">
                    <p className="text-accent-foreground">{selectedImage.caption}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};
