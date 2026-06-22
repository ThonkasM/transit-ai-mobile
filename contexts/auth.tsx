import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { api, setOnLogout } from '@/utils/api';
import * as storage from '@/utils/storage';

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: { email: string; nombre: string; password: string; telefono?: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await storage.getAccessToken();
        const stored = await storage.getUser<AuthUser>();
        if (token && stored) setUser(stored);
      } catch {}
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    setOnLogout(() => {
      storage.clearTokens();
      setUser(null);
    });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const data = await api.post<{ usuario: AuthUser; accessToken: string; refreshToken: string }>(
      '/auth/login', { email, password }, { skipAuth: true }
    );
    await storage.saveTokens(data.accessToken, data.refreshToken);
    await storage.saveUser(data.usuario);
    setUser(data.usuario);
    return data.usuario;
  }, []);

  const register = useCallback(async (regData: { email: string; nombre: string; password: string; telefono?: string }): Promise<AuthUser> => {
    const data = await api.post<{ usuario: AuthUser; accessToken: string; refreshToken: string }>(
      '/auth/register', regData, { skipAuth: true }
    );
    await storage.saveTokens(data.accessToken, data.refreshToken);
    await storage.saveUser(data.usuario);
    setUser(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout', undefined, { skipAuth: true }); } catch {}
    await storage.clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
