import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, BookOpen } from 'lucide-react';
import { CourseSidebar } from './CourseSidebar';
import { Module, Lesson } from '@/hooks/useCourses';
import { useState } from 'react';

interface MobileCourseSidebarProps {
  modules: Module[];
  currentLesson: Lesson | null;
  completedLessons: string[];
  onLessonClick: (moduleIndex: number, lessonIndex: number) => void;
}

export const MobileCourseSidebar = ({
  modules,
  currentLesson,
  completedLessons,
  onLessonClick,
}: MobileCourseSidebarProps) => {
  const [open, setOpen] = useState(false);

  const handleLessonClick = (moduleIndex: number, lessonIndex: number) => {
    onLessonClick(moduleIndex, lessonIndex);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden gap-2">
          <Menu className="w-4 h-4" />
          <BookOpen className="w-4 h-4" />
          Contenido
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] sm:w-96 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Contenido del Curso</SheetTitle>
        </SheetHeader>
        <CourseSidebar
          modules={modules}
          currentLesson={currentLesson}
          completedLessons={completedLessons}
          onLessonClick={handleLessonClick}
        />
      </SheetContent>
    </Sheet>
  );
};
