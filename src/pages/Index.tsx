import { useEffect, useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { AboutSection } from '@/components/landing/AboutSection';
import { ServicesSection } from '@/components/landing/ServicesSection';
import { CoursesSection } from '@/components/landing/CoursesSection';
import { GallerySection } from '@/components/landing/GallerySection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { Footer } from '@/components/landing/Footer';
import { getLandingContent, getCourses, initializeData } from '@/lib/storage';
import { LandingContent, Course } from '@/types';

const Index = () => {
  const [content, setContent] = useState<LandingContent | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    initializeData();
    setContent(getLandingContent());
    setCourses(getCourses());
  }, []);

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection 
        content={content.hero} 
        whatsapp={content.contact.whatsapp}
        whatsappMessage={content.contact.whatsappMessage}
      />
      <AboutSection content={content.about} />
      <ServicesSection services={content.services} />
      <CoursesSection 
        title={content.courses.title}
        subtitle={content.courses.subtitle}
        courses={courses}
      />
      <GallerySection gallery={content.gallery} />
      <TestimonialsSection testimonials={content.testimonials} />
      <ContactSection content={content.contact} />
      <Footer content={content} />
    </div>
  );
};

export default Index;