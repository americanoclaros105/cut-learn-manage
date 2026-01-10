import { useState, useEffect } from 'react';
import { useLandingContent, useUpdateLandingContent, LandingContent, ThemeColors } from '@/hooks/useLandingContent';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Save, Loader2, Palette, Image, Users, Scissors, ShoppingBag, Images, MessageSquare, Phone, Share2 } from 'lucide-react';

// Landing Editors
import { HeroEditor } from '@/components/admin/landing/HeroEditor';
import { AboutEditor } from '@/components/admin/landing/AboutEditor';
import { ServicesEditor } from '@/components/admin/landing/ServicesEditor';
import { ProductsEditor } from '@/components/admin/landing/ProductsEditor';
import { GalleryEditor } from '@/components/admin/landing/GalleryEditor';
import { TestimonialsEditor } from '@/components/admin/landing/TestimonialsEditor';
import { ContactEditor } from '@/components/admin/landing/ContactEditor';
import { SocialEditor } from '@/components/admin/landing/SocialEditor';
import { ThemeEditor } from '@/components/admin/landing/ThemeEditor';

const defaultThemeColors: ThemeColors = {
  primary: '0 72% 51%',
  primaryForeground: '0 0% 100%',
  accent: '0 0% 10%',
  background: '0 0% 100%',
  foreground: '0 0% 5%',
  muted: '0 0% 96%',
  mutedForeground: '0 0% 45%',
};

const defaultContent = {
  hero: {
    title: 'El Arte del Estilo Masculino',
    subtitle: 'Más de 10 años transformando estilos y creando experiencias únicas en barbería',
    ctaText: 'Reservar Cita',
    ctaLink: 'whatsapp',
    backgroundImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1920',
  },
  about: {
    title: 'Quiénes Somos',
    description: 'Somos más que una barbería, somos un espacio donde el estilo se encuentra con la tradición.',
    mission: 'Ofrecer servicios de barbería de la más alta calidad.',
    vision: 'Ser reconocidos como la barbería líder en formación y servicio.',
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800',
  },
  courses_section: {
    title: 'Academia de Barbería',
    subtitle: 'Aprende de los mejores profesionales',
  },
  contact: {
    phone: '+1 234 567 8900',
    whatsapp: '+1234567890',
    whatsappMessage: 'Hola! Me gustaría reservar una cita.',
    email: 'info@clarosstudio.com',
    address: 'Calle Principal 123, Ciudad',
    hours: 'Lunes a Sábado: 9:00 AM - 8:00 PM',
  },
  social_links: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    tiktok: 'https://tiktok.com',
    youtube: '',
  },
  theme_colors: defaultThemeColors,
};

interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
}

export const LandingEditor = () => {
  const { data: landingContent, isLoading } = useLandingContent();
  const updateContent = useUpdateLandingContent();
  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    if (landingContent) {
      setContent({
        hero: landingContent.hero,
        about: landingContent.about,
        courses_section: landingContent.courses_section,
        contact: landingContent.contact,
        social_links: {
          instagram: landingContent.social_links?.instagram || '',
          facebook: landingContent.social_links?.facebook || '',
          tiktok: landingContent.social_links?.tiktok || '',
          youtube: landingContent.social_links?.youtube || '',
        },
        theme_colors: landingContent.theme_colors || defaultThemeColors,
      });
    }
  }, [landingContent]);

  const handleSave = async () => {
    try {
      await updateContent.mutateAsync(content);
      toast.success('Cambios guardados correctamente');
    } catch (error) {
      toast.error('Error al guardar los cambios');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Editor de Landing</h1>
          <p className="text-muted-foreground text-sm">Personaliza todo el contenido de tu página</p>
        </div>
        <Button onClick={handleSave} className="gap-2 w-full sm:w-auto" disabled={updateContent.isPending}>
          {updateContent.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar Cambios
        </Button>
      </div>

      <Tabs defaultValue="theme" className="space-y-6">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="bg-secondary inline-flex w-max">
            <TabsTrigger value="theme" className="gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Tema</span>
            </TabsTrigger>
            <TabsTrigger value="hero" className="gap-2">
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">Hero</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Nosotros</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Scissors className="w-4 h-4" />
              <span className="hidden sm:inline">Servicios</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Productos</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2">
              <Images className="w-4 h-4" />
              <span className="hidden sm:inline">Galería</span>
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Testimonios</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Contacto</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Redes</span>
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="theme">
          <ThemeEditor
            colors={content.theme_colors}
            onChange={(colors) => setContent({ ...content, theme_colors: colors })}
          />
        </TabsContent>

        <TabsContent value="hero">
          <HeroEditor
            content={content.hero}
            onChange={(hero) => setContent({ ...content, hero })}
          />
        </TabsContent>

        <TabsContent value="about">
          <AboutEditor
            content={content.about}
            onChange={(about) => setContent({ ...content, about })}
          />
        </TabsContent>

        <TabsContent value="services">
          <ServicesEditor />
        </TabsContent>

        <TabsContent value="products">
          <ProductsEditor />
        </TabsContent>

        <TabsContent value="gallery">
          <GalleryEditor />
        </TabsContent>

        <TabsContent value="testimonials">
          <TestimonialsEditor />
        </TabsContent>

        <TabsContent value="contact">
          <ContactEditor
            content={content.contact}
            onChange={(contact) => setContent({ ...content, contact })}
          />
        </TabsContent>

        <TabsContent value="social">
          <SocialEditor
            content={content.social_links}
            onChange={(social_links) => setContent({ ...content, social_links: {
              instagram: social_links.instagram || '',
              facebook: social_links.facebook || '',
              tiktok: social_links.tiktok || '',
              youtube: social_links.youtube || '',
            }})}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
