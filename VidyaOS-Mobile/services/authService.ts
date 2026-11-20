/**
 * Authentication Service Module
 */

import { api } from './api';
import { secureStorage } from './secureStore';
import { CONFIG } from '../constants/config';
import { LoginResponseData, StudentRegisterPayload, UserProfile, Department } from '../types/auth';

export class AuthService {
  /**
   * Universal Login supporting Email, Phone, Enrollment No, or Registration No
   */
  static async login(
    identifier: string,
    password: string,
    onProgress?: (attempt: number, max: number) => void
  ): Promise<LoginResponseData> {
    const cleanId = identifier.trim();
    const deviceId = await api.getDeviceId();

    const payload = {
      email: cleanId,
      phone: cleanId,
      credential: cleanId,
      identifier: cleanId,
      username: cleanId,
      enrollment_no: cleanId,
      official_enrollment_no: cleanId,
      registration_no: cleanId,
      password,
      device_id: deviceId,
    };

    const res = await api.request<LoginResponseData>('/auth/login', {
      method: 'POST',
      suppressAuth: true,
      body: JSON.stringify(payload),
      onColdStartProgress: onProgress,
    });

    if (res.success && res.data) {
      if (!res.data.must_change_password) {
        if (res.data.access_token) {
          await secureStorage.setItem(CONFIG.ACCESS_TOKEN_KEY, res.data.access_token);
        }
        if (res.data.refresh_token) {
          await secureStorage.setItem(CONFIG.REFRESH_TOKEN_KEY, res.data.refresh_token);
        }
        if (res.data.user) {
          await secureStorage.setItem(CONFIG.USER_DATA_KEY, JSON.stringify(res.data.user));
        }
      }
      return res.data;
    }

    throw new Error(res.message || 'Login failed');
  }

  /**
   * Student Self-Registration
   */
  static async registerStudent(payload: StudentRegisterPayload): Promise<{ message: string; student_id?: number }> {
    const res = await api.request<{ message: string; student_id?: number }>('/auth/student/register', {
      method: 'POST',
      suppressAuth: true,
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  /**
   * Fetch Active Departments List for Registration
   */
  static async getDepartments(): Promise<Department[]> {
    try {
      const res = await api.request<Department[]>('/departments', {
        method: 'GET',
        suppressAuth: true,
      });
      return Array.isArray(res.data) ? res.data : [];
    } catch (_) {
      try {
        const fallback = await api.request<Department[]>('/auth/departments', {
          method: 'GET',
          suppressAuth: true,
        });
        return Array.isArray(fallback.data) ? fallback.data : [];
      } catch (err) {
        console.warn('Could not load departments:', err);
        return [];
      }
    }
  }

  /**
   * Synchronize authenticated user profile with backend
   */
  static async syncCurrentUser(): Promise<UserProfile | null> {
    try {
      const res = await api.request<UserProfile>('/auth/me', {
        method: 'GET',
      });
      if (res.success && res.data) {
        await secureStorage.setItem(CONFIG.USER_DATA_KEY, JSON.stringify(res.data));
        return res.data;
      }
      return null;
    } catch (err) {
      return this.getStoredUser();
    }
  }

  /**
   * Retrieve cached user profile from SecureStore
   */
  static async getStoredUser(): Promise<UserProfile | null> {
    const raw = await secureStorage.getItem(CONFIG.USER_DATA_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  /**
   * Retrieve stored access token
   */
  static async getStoredToken(): Promise<string | null> {
    return secureStorage.getItem(CONFIG.ACCESS_TOKEN_KEY);
  }

  /**
   * Logout session and revoke tokens
   */
  static async logout(): Promise<void> {
    try {
      const refreshToken = await secureStorage.getItem(CONFIG.REFRESH_TOKEN_KEY);
      const deviceId = await api.getDeviceId();
      await api.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ device_id: deviceId, refresh_token: refreshToken }),
        retryCount: 1,
      }).catch(() => {});
    } finally {
      await secureStorage.clearAllAuth();
    }
  }
}

