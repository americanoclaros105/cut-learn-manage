import { LandingContent } from '@/types';
import { Instagram, Facebook, Youtube } from 'lucide-react';

interface FooterProps {
  content: LandingContent;
}

export const Footer = ({ content }: FooterProps) => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container-custom mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Logo & Description */}
          <div>
            <h3 className="text-2xl font-bold mb-4">
              CLAROS <span className="text-primary">STUDIO</span>
            </h3>
            <p className="text-background/70">
              El arte del estilo masculino. Tradición y modernidad en cada corte.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-background/70">
              <li>
                <a href="#about" className="hover:text-primary transition-colors">
                  Nosotros
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-primary transition-colors">
                  Servicios
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-primary transition-colors">
                  Academia
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-primary transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="font-semibold mb-4">Síguenos</h4>
            <div className="flex gap-4">
              {content.socialLinks.instagram && (
                <a
                  href={content.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {content.socialLinks.facebook && (
                <a
                  href={content.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {content.socialLinks.youtube && (
                <a
                  href={content.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 text-center text-background/50 text-sm">
          <p>&copy; {new Date().getFullYear()} Claros Studio. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
