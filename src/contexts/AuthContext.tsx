import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'superadmin' | 'student';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isSuperadmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string, email: string) => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (profile && roleData) {
        // Check if user is active and within access dates
        const now = new Date();
        const enabledFrom = new Date(profile.enabled_from);
        const expiresAt = new Date(profile.expires_at);

        if (profile.status !== 'active') {
          return { error: 'Tu cuenta está inactiva. Contacta al administrador.' };
        }

        if (now < enabledFrom) {
          return { error: `Tu acceso se habilitará el ${enabledFrom.toLocaleDateString()}` };
        }

        if (now > expiresAt) {
          return { error: 'Tu acceso ha expirado. Contacta al administrador.' };
        }

        const authUser: AuthUser = {
          id: userId,
          email: email,
          name: profile.name,
          role: roleData.role as AppRole,
        };

        return { user: authUser };
      }

      return { error: 'No se pudo obtener la información del usuario' };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { error: 'Error al obtener datos del usuario' };
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(async () => {
            const result = await fetchUserData(
              currentSession.user.id,
              currentSession.user.email || ''
            );
            if (result.user) {
              setUser(result.user);
            } else {
              setUser(null);
            }
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      
      if (currentSession?.user) {
        fetchUserData(
          currentSession.user.id,
          currentSession.user.email || ''
        ).then(result => {
          if (result.user) {
            setUser(result.user);
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Credenciales inválidas' };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        const result = await fetchUserData(data.user.id, data.user.email || '');
        
        if (result.error) {
          // Log out if user data validation fails
          await supabase.auth.signOut();
          return { success: false, error: result.error };
        }

        if (result.user) {
          setUser(result.user);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
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
