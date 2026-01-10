import { LandingContent } from '@/types';

interface AboutSectionProps {
  content: LandingContent['about'];
}

export const AboutSection = ({ content }: AboutSectionProps) => {
  return (
    <section id="about" className="section-padding bg-secondary">
      <div className="container-custom mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-lg overflow-hidden">
              <img
                src={content.image}
                alt="Sobre nosotros"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary rounded-lg -z-10" />
          </div>

          {/* Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {content.title}
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              {content.description}
            </p>

            <div className="space-y-6">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">Nuestra Misión</h3>
                <p className="text-muted-foreground">{content.mission}</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground mb-2">Nuestra Visión</h3>
                <p className="text-muted-foreground">{content.vision}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
