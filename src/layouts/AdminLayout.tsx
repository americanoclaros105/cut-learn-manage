import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { MobileAdminSidebar } from '@/components/admin/MobileAdminSidebar';
import logo from '@/assets/logo.png';

export const AdminLayout = () => {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-sidebar border-b border-sidebar-border p-3 flex items-center gap-3">
        <MobileAdminSidebar />
        <img src={logo} alt="Claros Studio" className="h-8 w-auto" />
        <span className="font-semibold text-sidebar-foreground">Admin</span>
      </header>

      {/* Desktop Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};