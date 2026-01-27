import { AdminSidebarContent } from './AdminSidebarContent';

export const AdminSidebar = () => {
  return (
    <aside className="hidden md:flex w-64 bg-sidebar text-sidebar-foreground min-h-screen flex-col">
      <AdminSidebarContent />
    </aside>
  );
};