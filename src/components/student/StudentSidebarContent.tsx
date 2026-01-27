import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

interface StudentSidebarContentProps {
  onNavigate?: () => void;
}

export const StudentSidebarContent = ({ onNavigate }: StudentSidebarContentProps) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    onNavigate?.();
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border flex flex-col items-center">
        <img src={logo} alt="Claros Studio" className="h-16 w-auto mb-2" />
        <p className="text-sm text-sidebar-foreground/60">Portal del Estudiante</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/estudiante"
              end
              onClick={handleNavClick}
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
          onClick={() => {
            navigate('/');
            onNavigate?.();
          }}
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
    </div>
  );
};
