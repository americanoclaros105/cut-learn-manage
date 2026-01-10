// User types
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'superadmin' | 'student';
  status: 'active' | 'inactive' | 'suspended';
  enabledFrom: string;
  expiresAt: string;
  assignedCourses: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'student';
}

// Course types
export interface Course {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  status: 'published' | 'draft' | 'archived';
  category: string;
  tags: string[];
  modules: Module[];
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'text' | 'image' | 'link' | 'quiz';
  content: string;
  duration?: string;
  isRequired: boolean;
  order: number;
}

// Progress tracking
export interface CourseProgress {
  courseId: string;
  lessonCompleted: string[];
  startedAt: string;
  completedAt?: string;
  lastAccessedAt: string;
}

export interface StudentProgress {
  userId: string;
  courses: CourseProgress[];
}

// Landing page content
export interface LandingContent {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    backgroundImage: string;
  };
  about: {
    title: string;
    description: string;
    mission: string;
    vision: string;
    image: string;
  };
  services: ServiceItem[];
  products: ProductItem[];
  courses: {
    title: string;
    subtitle: string;
  };
  gallery: GalleryItem[];
  testimonials: TestimonialItem[];
  contact: {
    phone: string;
    whatsapp: string;
    whatsappMessage: string;
    email: string;
    address: string;
    hours: string;
    mapEmbed?: string;
  };
  socialLinks: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
  };
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  image: string;
}

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface GalleryItem {
  id: string;
  image: string;
  caption?: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  text: string;
  rating: number;
  avatar?: string;
}
