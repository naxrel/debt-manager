import { authApi, usersApi } from '@/api';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Updated User type to match API response
interface User {
  userId: string;
  username: string;
  name: string;
  email: string;
  profileImage?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, name: string, email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      setError(null);
      const storedUser = await authApi.getStoredUser();
      const token = await authApi.getToken();

      if (storedUser && token) {
        // Verify token is still valid by fetching profile
        try {
          const profile = await usersApi.getProfile();
          setUser({
            userId: profile.id,
            username: profile.username,
            name: profile.name,
            email: profile.email,
            profileImage: (profile as any).profileImage || null,
          });
        } catch (err) {
          // Token invalid, clear storage
          await authApi.logout();
          setUser(null);
        }
      }
    } catch (err) {
      console.error('Error checking login status:', err);
      setError('Gagal memeriksa status login');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await authApi.login({ username, password });

      setUser({
        userId: response.user.userId,
        username: response.user.username,
        name: response.user.name,
        email: response.user.email,
        profileImage: null,
      });

      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Username atau password salah');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string,
    password: string,
    name: string,
    email: string
  ): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);

      // Register user
      await authApi.register({ username, password, name, email });

      // Auto login after registration
      const loginSuccess = await login(username, password);
      return loginSuccess;
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Gagal mendaftar. Username mungkin sudah digunakan.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setError(null);
      await authApi.logout();
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message || 'Gagal logout');
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      setError(null);
      if (user) {
        const profile = await usersApi.getProfile();
        setUser({
          userId: profile.id,
          username: profile.username,
          name: profile.name,
          email: profile.email,
        });
      }
    } catch (err: any) {
      console.error('Refresh user error:', err);
      setError(err.message || 'Gagal memperbarui data user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
