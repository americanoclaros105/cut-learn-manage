import { User, Course, StudentProgress, LandingContent } from '@/types';
import { defaultLandingContent, defaultCourses, defaultUsers } from './defaultData';

const STORAGE_KEYS = {
  USERS: 'barber_users',
  COURSES: 'barber_courses',
  PROGRESS: 'barber_progress',
  LANDING: 'barber_landing',
  AUTH: 'barber_auth',
};

// Initialize default data if not exists
export const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(defaultCourses));
  }
  if (!localStorage.getItem(STORAGE_KEYS.LANDING)) {
    localStorage.setItem(STORAGE_KEYS.LANDING, JSON.stringify(defaultLandingContent));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROGRESS)) {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify([]));
  }
};

// Users
export const getUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getUserById = (id: string): User | undefined => {
  return getUsers().find(u => u.id === id);
};

export const getUserByEmail = (email: string): User | undefined => {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
};

// Courses
export const getCourses = (): Course[] => {
  const data = localStorage.getItem(STORAGE_KEYS.COURSES);
  return data ? JSON.parse(data) : [];
};

export const saveCourses = (courses: Course[]) => {
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
};

export const getCourseById = (id: string): Course | undefined => {
  return getCourses().find(c => c.id === id);
};

// Progress
export const getProgress = (): StudentProgress[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
  return data ? JSON.parse(data) : [];
};

export const saveProgress = (progress: StudentProgress[]) => {
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
};

export const getStudentProgress = (userId: string): StudentProgress | undefined => {
  return getProgress().find(p => p.userId === userId);
};

export const updateStudentProgress = (userId: string, courseId: string, lessonId: string) => {
  const allProgress = getProgress();
  let studentProgress = allProgress.find(p => p.userId === userId);
  
  if (!studentProgress) {
    studentProgress = { userId, courses: [] };
    allProgress.push(studentProgress);
  }
  
  let courseProgress = studentProgress.courses.find(c => c.courseId === courseId);
  
  if (!courseProgress) {
    courseProgress = {
      courseId,
      lessonCompleted: [],
      startedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    };
    studentProgress.courses.push(courseProgress);
  }
  
  if (!courseProgress.lessonCompleted.includes(lessonId)) {
    courseProgress.lessonCompleted.push(lessonId);
  }
  courseProgress.lastAccessedAt = new Date().toISOString();
  
  saveProgress(allProgress);
  return studentProgress;
};

// Landing Content
export const getLandingContent = (): LandingContent => {
  const data = localStorage.getItem(STORAGE_KEYS.LANDING);
  return data ? JSON.parse(data) : defaultLandingContent;
};

export const saveLandingContent = (content: LandingContent) => {
  localStorage.setItem(STORAGE_KEYS.LANDING, JSON.stringify(content));
};

// Auth
export const getStoredAuth = () => {
  const data = localStorage.getItem(STORAGE_KEYS.AUTH);
  return data ? JSON.parse(data) : null;
};

export const setStoredAuth = (user: { id: string; email: string; name: string; role: string } | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  }
};

// Generate unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};
