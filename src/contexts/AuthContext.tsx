import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import api from '../lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  initials: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,  setUser]  = useState<User | null>(() => {
    const stored = localStorage.getItem('hpe_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('hpe_token')
  );

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: t, user: u } = res.data.data;
    setToken(t);
    setUser(u);
    localStorage.setItem('hpe_token', t);
    localStorage.setItem('hpe_user', JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hpe_token');
    localStorage.removeItem('hpe_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
