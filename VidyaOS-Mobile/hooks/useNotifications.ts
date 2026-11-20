/**
 * Custom Hook for In-App Notifications
 * Provides real-time unread count polling, list management, and read actions.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import { AppNotification } from '../types/notification';
import { useAuth } from './useAuth';
import { CONFIG } from '../constants/config';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Quiet fail on polling errors
    }
  }, [user]);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    try {
      const [list, count] = await Promise.allSettled([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);

      if (list.status === 'fulfilled') {
        setNotifications(list.value);
      }
      if (count.status === 'fulfilled') {
        setUnreadCount(count.value);
      }
    } catch {
      // Quiet fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();

    // Start background polling while logged in
    if (user) {
      pollTimerRef.current = setInterval(() => {
        fetchUnreadCount();
      }, CONFIG.NOTIFICATION_POLL_INTERVAL_MS || 20000);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [user, loadNotifications, fetchUnreadCount]);

  const markAsRead = async (id: number) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await notificationService.markAsRead(id);
  };

  const markAllRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await notificationService.markAllAsRead();
  };

  const refresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  return {
    notifications,
    unreadCount,
    loading,
    refreshing,
    markAsRead,
    markAllRead,
    refresh,
  };
}

