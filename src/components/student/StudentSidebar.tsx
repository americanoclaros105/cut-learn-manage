import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const StudentSidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground min-h-screen flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold">
          BARBER<span className="text-sidebar-primary">SHOP</span>
        </h1>
        <p className="text-sm text-sidebar-foreground/60 mt-1">Portal del Estudiante</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/estudiante"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'hover:bg-sidebar-accent text-sidebar-foreground/80'
                }`
              }
            >
              <LayoutDashboard className="w-5 h-5" />
              Mis Cursos
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className="px-4 py-2">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-sidebar-foreground/60">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground"
          onClick={() => navigate('/')}
        >
          <Home className="w-5 h-5" />
          Ver Sitio
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
};