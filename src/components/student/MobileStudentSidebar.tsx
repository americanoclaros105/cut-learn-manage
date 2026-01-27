import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { StudentSidebarContent } from './StudentSidebarContent';

export const MobileStudentSidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-sidebar-foreground">
          <Menu className="w-6 h-6" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 bg-sidebar">
        <SheetHeader className="sr-only">
          <SheetTitle>Menú del Estudiante</SheetTitle>
        </SheetHeader>
        <StudentSidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
};
