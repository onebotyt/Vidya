/**
 * Hardware-Backed Secure Storage Adapter
 * Wraps expo-secure-store with safe web/memory fallbacks
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

class SecureStorageService {
  private memoryCache: Map<string, string> = new Map();

  async setItem(key: string, value: string): Promise<void> {
    try {
      this.memoryCache.set(key, value);
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    } catch (err) {
      console.warn(`[SecureStore] Error writing key "${key}":`, err);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.memoryCache.has(key)) {
        return this.memoryCache.get(key) || null;
      }
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          const val = localStorage.getItem(key);
          if (val) this.memoryCache.set(key, val);
          return val;
        }
        return null;
      }
      const val = await SecureStore.getItemAsync(key);
      if (val) this.memoryCache.set(key, val);
      return val;
    } catch (err) {
      console.warn(`[SecureStore] Error reading key "${key}":`, err);
      return this.memoryCache.get(key) || null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key);
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.warn(`[SecureStore] Error deleting key "${key}":`, err);
    }
  }

  async clearAllAuth(): Promise<void> {
    const keys = [
      'vidyaos_access_token',
      'vidyaos_refresh_token',
      'vidyaos_user_data',
      'access_token',
      'refresh_token',
      'user',
    ];
    for (const k of keys) {
      await this.removeItem(k);
    }
  }
}

export const secureStorage = new SecureStorageService();

