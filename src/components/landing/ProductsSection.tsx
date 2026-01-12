import { ProductItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';
import { openWhatsApp } from '@/lib/whatsapp';

interface ProductsSectionProps {
  products: ProductItem[];
  whatsapp: string;
}

export const ProductsSection = ({ products, whatsapp }: ProductsSectionProps) => {
  if (products.length === 0) return null;

  return (
    <section id="products" className="section-padding bg-secondary">
      <div className="container-custom mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-foreground mb-4">
            Nuestros Productos
          </h2>
          <p className="text-secondary-foreground/70 max-w-2xl mx-auto">
            Productos profesionales de alta calidad para mantener tu estilo impecable
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card
              key={product.id}
              className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card flex flex-col h-full"
            >
              <div className="aspect-square overflow-hidden flex-shrink-0">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-5 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-card-foreground mb-1 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2 flex-grow">
                  {product.description}
                </p>
                <div className="flex items-center gap-1 text-primary font-bold text-xl mb-4">
                  <DollarSign className="w-5 h-5" />
                  <span>{product.price}</span>
                </div>
                <Button
                  onClick={() => openWhatsApp(whatsapp, product.name, 'producto')}
                  className="w-full h-11 bg-green-500 hover:bg-green-600 text-white gap-2 mt-auto"
                >
                  <i className="fab fa-whatsapp text-lg" />
                  Más Info
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
