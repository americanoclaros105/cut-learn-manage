import { Button } from "@/components/ui/button";
import { LandingContent } from "@/types";
import { MessageCircle } from "lucide-react";

interface HeroSectionProps {
  content: LandingContent["hero"];
  whatsapp: string;
  whatsappMessage: string;
}

export const HeroSection = ({ content, whatsapp, whatsappMessage }: HeroSectionProps) => {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(whatsappMessage);
    const phone = whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${content.backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-accent/80 via-accent/60 to-accent/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 container-custom mx-auto px-4 text-center pt-20">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 animate-fade-in">
          {content.title.split(" ").map((word, index) => (
            <span key={index}>
              {index === content.title.split(" ").length - 1 ? (
                <span className="text-primary">{word}</span>
              ) : (
                word + " "
              )}
            </span>
          ))}
        </h1>

        <p
          className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          {content.subtitle}
        </p>

        <div
          className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          <Button
            size="lg"
            onClick={handleWhatsAppClick}
            className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            {content.ctaText}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" })}
            className="text-lg px-8 py-6 border-primary-foreground/50 text-secondary-foreground hover:bg-primary-foreground/10"
          >
            Ver Servicios
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary-foreground/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary-foreground/50 rounded-full mt-2" />
        </div>
      </div>
    </section>
  );
};
