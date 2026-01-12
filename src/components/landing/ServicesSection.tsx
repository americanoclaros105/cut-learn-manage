import { ServiceItem } from '@/types';
import { Clock, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { openWhatsApp } from '@/lib/whatsapp';

interface ServicesSectionProps {
  services: ServiceItem[];
  whatsapp: string;
}

export const ServicesSection = ({ services, whatsapp }: ServicesSectionProps) => {
  return (
    <section id="services" className="section-padding bg-background">
      <div className="container-custom mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Nuestros Servicios
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ofrecemos una variedad de servicios profesionales para satisfacer todas tus necesidades de estilo
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <Card
              key={service.id}
              className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col h-full"
            >
              <div className="aspect-[4/3] overflow-hidden flex-shrink-0">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold text-foreground mb-2 line-clamp-1">{service.name}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-grow">{service.description}</p>
                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-bold text-lg">
                    <DollarSign className="w-4 h-4" />
                    <span>{service.price}</span>
                  </div>
                </div>
                <Button
                  onClick={() => openWhatsApp(whatsapp, service.name, 'servicio')}
                  className="w-full h-11 bg-green-500 hover:bg-green-600 text-white gap-2 mt-auto"
                >
                  <i className="fab fa-whatsapp text-lg" />
                  Reservar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
