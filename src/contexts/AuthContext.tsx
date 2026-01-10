import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser } from '@/types';
import { getUserByEmail, getStoredAuth, setStoredAuth, initializeData } from '@/lib/storage';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isSuperadmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeData();
    const storedUser = getStoredAuth();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const foundUser = getUserByEmail(email);
    
    if (!foundUser) {
      return { success: false, error: 'Usuario no encontrado' };
    }
    
    if (foundUser.password !== password) {
      return { success: false, error: 'Contraseña incorrecta' };
    }
    
    if (foundUser.status !== 'active') {
      return { success: false, error: 'Tu cuenta está inactiva. Contacta al administrador.' };
    }
    
    const now = new Date();
    const enabledFrom = new Date(foundUser.enabledFrom);
    const expiresAt = new Date(foundUser.expiresAt);
    
    if (now < enabledFrom) {
      return { success: false, error: `Tu acceso se habilitará el ${enabledFrom.toLocaleDateString()}` };
    }
    
    if (now > expiresAt) {
      return { success: false, error: 'Tu acceso ha expirado. Contacta al administrador.' };
    }
    
    const authUser: AuthUser = {
      id: foundUser.id,
      email: foundUser.email,
      name: foundUser.name,
      role: foundUser.role,
    };
    
    setUser(authUser);
    setStoredAuth(authUser);
    
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setStoredAuth(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
        isSuperadmin: user?.role === 'superadmin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
