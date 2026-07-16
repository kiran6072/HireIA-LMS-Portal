import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, Role } from '@/types';
import * as authService from '@/api/authService';
import { getErrorMessage } from '@/api/axios';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: Role) => Promise<User>;
  registerStudent: (payload: Parameters<typeof authService.registerStudent>[0]) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (u) localStorage.setItem('hireia_user', JSON.stringify(u));
    else localStorage.removeItem('hireia_user');
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('hireia_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const { user: freshUser } = await authService.getMe();
        setUser(freshUser);
      } catch {
        localStorage.removeItem('hireia_token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string, role: Role) => {
    const data = await authService.login(email, password, role);
    localStorage.setItem('hireia_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const registerStudent: AuthContextValue['registerStudent'] = async (payload) => {
    const data = await authService.registerStudent(payload);
    localStorage.setItem('hireia_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      /* ignore network errors on logout */
    }
    localStorage.removeItem('hireia_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { user: freshUser } = await authService.getMe();
      setUser(freshUser);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, registerStudent, logout, refreshUser, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
