/**
 * Central Authentication Context and Session State Manager
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { UserProfile, LoginResponseData, StudentRegisterPayload } from '../types/auth';
import { AuthService } from '../services/authService';
import { api } from '../services/api';
import { secureStorage } from '../services/secureStore';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, pass: string, onProgress?: (attempt: number, max: number) => void) => Promise<LoginResponseData>;
  registerStudent: (payload: StudentRegisterPayload) => Promise<{ message: string; student_id?: number }>;
  logout: (reason?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // 1. Initial Session Hydration on App Launch
  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      try {
        const storedUser = await AuthService.getStoredUser();
        const token = await AuthService.getStoredToken();

        if (storedUser && token) {
          if (isMounted) setUser(storedUser);

          // Verify with backend in background
          const freshUser = await AuthService.syncCurrentUser();
          if (freshUser && isMounted) {
            setUser(freshUser);
          }
        }
      } catch (err) {
        console.warn('[AuthProvider] Bootstrap session check error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    bootstrapAuth();

    // 2. Subscribe to Session Revocation events (Multi-Device Login Conflict)
    const unsubscribeRevoke = api.onSessionRevoked(async (reason) => {
      if (isMounted) {
        setUser(null);
        router.replace('/(auth)/login');
      }
    });

    return () => {
      isMounted = false;
      unsubscribeRevoke();
    };
  }, []);

  const login = async (
    identifier: string,
    pass: string,
    onProgress?: (attempt: number, max: number) => void
  ): Promise<LoginResponseData> => {
    const data = await AuthService.login(identifier, pass, onProgress);
    if (!data.must_change_password && data.user) {
      setUser(data.user);
    }
    return data;
  };

  const registerStudent = async (payload: StudentRegisterPayload) => {
    return await AuthService.registerStudent(payload);
  };

  const logout = async (reason = 'user_logout') => {
    try {
      await AuthService.logout();
    } finally {
      setUser(null);
      router.replace('/(auth)/login');
    }
  };

  const refreshProfile = async () => {
    const updated = await AuthService.syncCurrentUser();
    if (updated) setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        registerStudent,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

