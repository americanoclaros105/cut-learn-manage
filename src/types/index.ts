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

// Academy operations (enrollments, payments, attendance)
export type EnrollmentStatus = 'pending' | 'active' | 'suspended' | 'cancelled';
export type EnrollmentActivationSource = 'payment' | 'manual' | 'legacy';
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'nequi' | 'daviplata' | 'other';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

/** Access state of an enrollment as seen by a student at a given moment. */
export type EffectiveAccess =
  | 'active'
  | 'pending'
  | 'suspended'
  | 'cancelled'
  | 'not_started'
  | 'expired'
  | 'account_inactive';

export interface EnrollmentLike {
  status: EnrollmentStatus;
  enabled_from: string | null;
  expires_at: string | null;
}

/** Minimal profile shape needed to decide course access. */
export interface ProfileLike {
  status: 'active' | 'inactive' | 'suspended';
}

export interface PaymentLike {
  amount: number;
  voided_at?: string | null;
}

export interface AttendanceRecordLike {
  status: AttendanceStatus;
}

export interface EnrollmentBalance {
  paid: number;
  balance: number;
  isFullyPaid: boolean;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  /** (present + late) / (total excluding excused); 0 when nothing counts. */
  rate: number;
}

// Course groups (cohorts)
export type SessionStatus = 'scheduled' | 'cancelled';
export type GroupPhase = 'upcoming' | 'in_progress' | 'finished' | 'archived';

/** Weekly class slot of a group. weekday: 0 = Sunday ... 6 = Saturday; times are 'HH:MM' or 'HH:MM:SS'. */
export interface GroupScheduleSlot {
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface CourseGroupSchedule extends GroupScheduleSlot {
  id: string;
  group_id: string;
}

export interface CourseGroup {
  id: string;
  course_id: string;
  name: string;
  /** 'YYYY-MM-DD' */
  start_date: string;
  end_date: string;
  location: string | null;
  instructor: string | null;
  capacity: number | null;
  /** Overrides the course price as the default agreed price. */
  price: number | null;
  color: string | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

/** A group with its weekly schedule and current occupancy (admin only). */
export interface CourseGroupWithStats extends CourseGroup {
  schedules: CourseGroupSchedule[];
  enrolled: number;
  /** null when the group has no capacity limit. */
  seats_left: number | null;
}
