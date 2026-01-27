import { StudentSidebarContent } from './StudentSidebarContent';

export const StudentSidebar = () => {
  return (
    <aside className="hidden md:flex w-64 bg-sidebar text-sidebar-foreground min-h-screen flex-col">
      <StudentSidebarContent />
    </aside>
  );
};
