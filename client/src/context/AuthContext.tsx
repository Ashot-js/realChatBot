import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi, tokenStore } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => tokenStore.get() !== null);

  const signIn = useCallback((u: User, token: string) => {
    tokenStore.set(token);
    setUser(u);
    connectSocket(token);
  }, []);

  // Restore the session from a stored token.
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;
    authApi
      .me()
      .then(({ user }) => signIn(user, token))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, [signIn]);

  const value: AuthContextType = {
    user,
    loading,
    login: async (email, password) => {
      const { user, token } = await authApi.login({ email, password });
      signIn(user, token);
    },
    register: async (username, email, password) => {
      const { user, token } = await authApi.register({ username, email, password });
      signIn(user, token);
    },
    logout: () => {
      tokenStore.clear();
      setUser(null);
      disconnectSocket();
    },
    updateUser: (patch) => setUser((u) => (u ? { ...u, ...patch } : u)),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
