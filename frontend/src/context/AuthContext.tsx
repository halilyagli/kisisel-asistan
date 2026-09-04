import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiClient } from '../services/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: string;
  subscriptionTier: 'FREE' | 'PRO' | 'ENTERPRISE';
  subscriptionStatus: string;
  subscriptionEndsAt?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  updateTier: (tier: 'FREE' | 'PRO' | 'ENTERPRISE') => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const data = await ApiClient.auth.me();
      setUser(data);
    } catch {
      setUser(null);
      ApiClient.clearToken();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('asistan_token');
    if (token) {
      refreshProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await ApiClient.auth.login({ email, password: pass });
    ApiClient.setToken(res.accessToken);
    setUser(res.user);
  };

  const register = async (email: string, pass: string, name: string) => {
    const res = await ApiClient.auth.register({ email, password: pass, fullName: name });
    ApiClient.setToken(res.accessToken);
    setUser(res.user);
  };

  const logout = () => {
    ApiClient.clearToken();
    setUser(null);
  };

  const updateTier = async (tier: 'FREE' | 'PRO' | 'ENTERPRISE') => {
    const updated = await ApiClient.auth.changeTier(tier);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateTier, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
