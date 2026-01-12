import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const navItems = [
  { label: 'Inicio', href: '#hero' },
  { label: 'Nosotros', href: '#about' },
  { label: 'Servicios', href: '#services' },
  { label: 'Productos', href: '#products' },
  { label: 'Cursos', href: '#courses' },
  { label: 'Galería', href: '#gallery' },
  { label: 'Contacto', href: '#contact' },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, isSuperadmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-accent/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="container-custom mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#hero" className="text-2xl md:text-3xl font-bold text-primary-foreground">
            CLAROS <span className="text-primary">STUDIO</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className="text-primary-foreground/80 hover:text-primary transition-colors font-medium"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <Button
                onClick={() => navigate(isSuperadmin ? '/admin' : '/estudiante')}
                variant="default"
              >
                Mi Portal
              </Button>
            ) : (
              <Button onClick={() => navigate('/login')} variant="default">
                Iniciar Sesión
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-primary-foreground p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-accent/95 backdrop-blur-sm border-t border-border/20 animate-fade-in">
            <div className="flex flex-col py-4">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="text-primary-foreground/80 hover:text-primary hover:bg-accent/50 px-4 py-3 transition-colors text-left"
                >
                  {item.label}
                </button>
              ))}
              <div className="px-4 pt-4 border-t border-border/20 mt-2">
                {isAuthenticated ? (
                  <Button
                    onClick={() => navigate(isSuperadmin ? '/admin' : '/estudiante')}
                    variant="default"
                    className="w-full"
                  >
                    Mi Portal
                  </Button>
                ) : (
                  <Button onClick={() => navigate('/login')} variant="default" className="w-full">
                    Iniciar Sesión
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
