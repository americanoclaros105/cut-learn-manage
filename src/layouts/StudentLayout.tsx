import { Outlet } from 'react-router-dom';
import { StudentSidebar } from '@/components/student/StudentSidebar';

export const StudentLayout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <StudentSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};