/**
 * In-App Notification Service
 * Manages fetching notifications, tracking unread counts,
 * marking as read, and bug report deep linking.
 */

import { api } from './api';
import { AppNotification, UnreadNotificationCount } from '../types/notification';

class NotificationService {
  /**
   * Fetch all in-app notifications for the authenticated user
   */
  async getNotifications(): Promise<AppNotification[]> {
    const res = await api.get<AppNotification[]>('/notifications');
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    // Also handle { notifications: [...] } envelope
    if (res.success && Array.isArray((res.data as any)?.notifications)) {
      return (res.data as any).notifications;
    }
    return [];
  }

  /**
   * Fetch unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const res = await api.get<UnreadNotificationCount | { unread_count: number } | number>(
      '/notifications/unread-count'
    );
    if (res.success && res.data !== undefined) {
      if (typeof res.data === 'number') return res.data;
      if (typeof (res.data as any)?.unread_count === 'number') {
        return (res.data as any).unread_count;
      }
    }
    return 0;
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: number): Promise<void> {
    const res = await api.put(`/notifications/${id}/read`, {});
    if (!res.success) {
      // Non-fatal, ignore or log
      console.warn(`Failed to mark notification ${id} as read:`, res.error?.message);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    const res = await api.put('/notifications/mark-all-read', {});
    if (!res.success) {
      console.warn('Failed to mark all notifications as read:', res.error?.message);
    }
  }
}

export const notificationService = new NotificationService();

