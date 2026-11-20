/**
 * VidyaOS Central Native API Client
 * Features:
 * - Transparent Bearer Token Injection
 * - Hardware / Persistent Device Fingerprint (`X-Device-Id`)
 * - Render Cold-Start Sleep Recovery (~30s retry)
 * - Automatic 401 Silent Token Refresh
 * - Session Revocation (`SESSION_REVOKED`) Listener
 */

import { CONFIG } from '../constants/config';
import { secureStorage } from './secureStore';
import { ApiResponse } from '../types/auth';

type SessionRevocationCallback = (reason: 'session_transferred' | 'session_expired') => void;

class ApiClient {
  private revocationListeners: Set<SessionRevocationCallback> = new Set();
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;
  private deviceId: string | null = null;

  onSessionRevoked(cb: SessionRevocationCallback): () => void {
    this.revocationListeners.add(cb);
    return () => this.revocationListeners.delete(cb);
  }

  private notifyRevoked(reason: 'session_transferred' | 'session_expired') {
    this.revocationListeners.forEach((cb) => cb(reason));
  }

  async getDeviceId(): Promise<string> {
    if (this.deviceId) return this.deviceId;
    let storedId = await secureStorage.getItem(CONFIG.DEVICE_ID_KEY);
    if (!storedId) {
      storedId = 'dev_mob_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
      await secureStorage.setItem(CONFIG.DEVICE_ID_KEY, storedId);
    }
    this.deviceId = storedId;
    return storedId;
  }

  /**
   * Primary network request method with automatic retry for cold-start wake-up
   */
  async request<T = any>(
    endpoint: string,
    options: RequestInit & {
      suppressAuth?: boolean;
      retryCount?: number;
      onColdStartProgress?: (attempt: number, max: number) => void;
    } = {}
  ): Promise<ApiResponse<T>> {
    const { suppressAuth = false, retryCount = CONFIG.MAX_COLD_START_ATTEMPTS, onColdStartProgress, ...fetchOptions } = options;

    let cleanEndpoint = endpoint;
    if (cleanEndpoint.startsWith(CONFIG.API_BASE_URL)) {
      cleanEndpoint = cleanEndpoint.slice(CONFIG.API_BASE_URL.length);
    }
    if (!cleanEndpoint.startsWith('/')) {
      cleanEndpoint = '/' + cleanEndpoint;
    }
    const fullUrl = `${CONFIG.API_BASE_URL}${cleanEndpoint}`;

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const headers: Record<string, string> = {
          Accept: 'application/json',
          ...(fetchOptions.headers as Record<string, string> || {}),
        };

        if (!(fetchOptions.body instanceof FormData) && !headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }

        if (!suppressAuth) {
          const token = await secureStorage.getItem(CONFIG.ACCESS_TOKEN_KEY);
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        }

        const devId = await this.getDeviceId();
        if (devId) {
          headers['X-Device-Id'] = devId;
        }

        const response = await fetch(fullUrl, {
          ...fetchOptions,
          headers,
        });

        // 1. Handle Render Cloud Cold Start / Idle Sleep
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          if (attempt < retryCount) {
            if (onColdStartProgress) onColdStartProgress(attempt, retryCount);
            await new Promise((r) => setTimeout(r, CONFIG.COLD_START_INTERVAL_MS));
            continue;
          }
          throw {
            success: false,
            message: 'Cloud server is waking up from sleep. Please try again in a few moments.',
            status: response.status,
          };
        }

        const data: ApiResponse<T> = await response.json().catch(() => ({
          success: response.ok,
          data: {} as T,
          message: response.statusText,
        }));

        // 2. Handle HTTP 401 Unauthorized
        if (response.status === 401) {
          if (data?.error?.code === 'SESSION_REVOKED') {
            await secureStorage.clearAllAuth();
            this.notifyRevoked('session_transferred');
            throw {
              success: false,
              code: 'SESSION_REVOKED',
              message: 'Your session has ended because this account was signed in from another device.',
              status: 401,
            };
          }

          // If not in auth routes, attempt silent token refresh
          if (!cleanEndpoint.includes('/auth/login') && !cleanEndpoint.includes('/auth/refresh')) {
            const refreshed = await this.attemptTokenRefresh();
            if (refreshed) {
              return this.request<T>(endpoint, { ...options, retryCount: 1 });
            } else {
              await secureStorage.clearAllAuth();
              this.notifyRevoked('session_expired');
              throw {
                success: false,
                code: 'SESSION_EXPIRED',
                message: 'Your session expired. Please sign in again.',
                status: 401,
              };
            }
          }
        }

        if (!response.ok || data.success === false) {
          throw {
            success: false,
            message: data?.error?.message || data?.message || `Request failed with status ${response.status}`,
            code: data?.error?.code || 'API_ERROR',
            status: response.status,
            details: data?.error?.details,
          };
        }

        return data;
      } catch (err: any) {
        // Network failure (Render spin-up or internet drop)
        const isNetworkErr =
          err?.message?.includes('Network request failed') ||
          err?.message?.includes('Failed to fetch') ||
          err?.status === 502 ||
          err?.status === 503 ||
          err?.status === 504;

        if (isNetworkErr && attempt < retryCount) {
          if (onColdStartProgress) onColdStartProgress(attempt, retryCount);
          await new Promise((r) => setTimeout(r, CONFIG.COLD_START_INTERVAL_MS));
          continue;
        }

        throw err;
      }
    }

    throw {
      success: false,
      message: 'Network request timed out or server unavailable.',
      status: 0,
    };
  }

  /**
   * Silent Token Refresh
   */
  async attemptTokenRefresh(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = await secureStorage.getItem(CONFIG.REFRESH_TOKEN_KEY);
        if (!refreshToken) return false;

        const devId = await this.getDeviceId();
        let res = await fetch(`${CONFIG.API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Device-Id': devId,
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        // Backward compatibility fallback if legacy router prefix
        if (res.status === 404) {
          res = await fetch(`${CONFIG.API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Device-Id': devId,
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
        }

        if (!res.ok) return false;
        const data = await res.json();
        if (data && data.success && data.data?.access_token) {
          await secureStorage.setItem(CONFIG.ACCESS_TOKEN_KEY, data.data.access_token);
          if (data.data.refresh_token) {
            await secureStorage.setItem(CONFIG.REFRESH_TOKEN_KEY, data.data.refresh_token);
          }
          return true;
        }
        return false;
      } catch (_) {
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  get<T = any>(endpoint: string, options: Omit<RequestInit, 'method'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any, options: Omit<RequestInit, 'method' | 'body'> = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T = any>(endpoint: string, body?: any, options: Omit<RequestInit, 'method' | 'body'> = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T = any>(endpoint: string, options: Omit<RequestInit, 'method'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();

