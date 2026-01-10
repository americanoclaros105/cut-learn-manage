import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { AboutSection } from '@/components/landing/AboutSection';
import { ServicesSection } from '@/components/landing/ServicesSection';
import { CoursesSection } from '@/components/landing/CoursesSection';
import { GallerySection } from '@/components/landing/GallerySection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { Footer } from '@/components/landing/Footer';
import { useLandingContent, useServices, useGallery, useTestimonials } from '@/hooks/useLandingContent';
import { useCourses } from '@/hooks/useCourses';
import { Loader2 } from 'lucide-react';

// Default content for when database is empty
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
    email: 'info@barbershop.com',
    address: 'Calle Principal 123, Ciudad',
    hours: 'Lunes a Sábado: 9:00 AM - 8:00 PM',
  },
  social_links: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    tiktok: 'https://tiktok.com',
  },
};

const Index = () => {
  const { data: landingContent, isLoading: loadingContent } = useLandingContent();
  const { data: services = [], isLoading: loadingServices } = useServices();
  const { data: gallery = [], isLoading: loadingGallery } = useGallery();
  const { data: testimonials = [], isLoading: loadingTestimonials } = useTestimonials();
  const { data: courses = [], isLoading: loadingCourses } = useCourses({ status: 'published' });

  const isLoading = loadingContent || loadingServices || loadingGallery || loadingTestimonials || loadingCourses;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const content = landingContent || defaultContent;

  // Transform data for components
  const heroContent = {
    title: content.hero?.title || defaultContent.hero.title,
    subtitle: content.hero?.subtitle || defaultContent.hero.subtitle,
    ctaText: content.hero?.ctaText || defaultContent.hero.ctaText,
    ctaLink: content.hero?.ctaLink || defaultContent.hero.ctaLink,
    backgroundImage: content.hero?.backgroundImage || defaultContent.hero.backgroundImage,
  };

  const aboutContent = {
    title: content.about?.title || defaultContent.about.title,
    description: content.about?.description || defaultContent.about.description,
    mission: content.about?.mission || defaultContent.about.mission,
    vision: content.about?.vision || defaultContent.about.vision,
    image: content.about?.image || defaultContent.about.image,
  };

  const contactContent = {
    phone: content.contact?.phone || defaultContent.contact.phone,
    whatsapp: content.contact?.whatsapp || defaultContent.contact.whatsapp,
    whatsappMessage: content.contact?.whatsappMessage || defaultContent.contact.whatsappMessage,
    email: content.contact?.email || defaultContent.contact.email,
    address: content.contact?.address || defaultContent.contact.address,
    hours: content.contact?.hours || defaultContent.contact.hours,
  };

  // Transform services for component
  const servicesForComponent = services.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description || '',
    price: Number(s.price),
    duration: s.duration || '',
    image: s.image || '',
  }));

  // Transform gallery for component
  const galleryForComponent = gallery.map(g => ({
    id: g.id,
    image: g.image,
    caption: g.caption || undefined,
  }));

  // Transform testimonials for component
  const testimonialsForComponent = testimonials.map(t => ({
    id: t.id,
    name: t.name,
    text: t.content,
    rating: t.rating,
    avatar: t.avatar || undefined,
  }));

  // Transform courses for component
  const coursesForComponent = courses.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description || '',
    coverImage: c.cover_image || '',
    duration: c.duration || '',
    level: c.level,
    price: Number(c.price),
    status: c.status,
    category: c.category || '',
    tags: c.tags || [],
    modules: [],
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));

  const footerContent = {
    hero: heroContent,
    about: aboutContent,
    services: servicesForComponent,
    products: [],
    courses: {
      title: content.courses_section?.title || defaultContent.courses_section.title,
      subtitle: content.courses_section?.subtitle || defaultContent.courses_section.subtitle,
    },
    gallery: galleryForComponent,
    testimonials: testimonialsForComponent,
    contact: contactContent,
    socialLinks: content.social_links || defaultContent.social_links,
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection 
        content={heroContent} 
        whatsapp={contactContent.whatsapp}
        whatsappMessage={contactContent.whatsappMessage}
      />
      <AboutSection content={aboutContent} />
      <ServicesSection services={servicesForComponent} />
      <CoursesSection 
        title={content.courses_section?.title || defaultContent.courses_section.title}
        subtitle={content.courses_section?.subtitle || defaultContent.courses_section.subtitle}
        courses={coursesForComponent}
      />
      <GallerySection gallery={galleryForComponent} />
      <TestimonialsSection testimonials={testimonialsForComponent} />
      <ContactSection content={contactContent} />
      <Footer content={footerContent} />
    </div>
  );
};

export default Index;
