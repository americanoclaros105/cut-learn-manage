import { Outlet } from 'react-router-dom';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { MobileStudentSidebar } from '@/components/student/MobileStudentSidebar';
import logo from '@/assets/logo.png';

export const StudentLayout = () => {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-sidebar border-b border-sidebar-border p-3 flex items-center gap-3">
        <MobileStudentSidebar />
        <img src={logo} alt="Claros Studio" className="h-8 w-auto" />
        <span className="font-semibold text-sidebar-foreground">Estudiante</span>
      </header>

      {/* Desktop Sidebar */}
      <StudentSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
