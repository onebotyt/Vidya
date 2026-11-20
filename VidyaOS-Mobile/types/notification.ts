/**
 * In-App Notification Domain Types
 */

export type NotificationType =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'ALERT'
  | 'BUG_UPDATE'
  | 'LEAVE_UPDATE'
  | 'ATTENDANCE'
  | string;

export interface AppNotification {
  id: number;
  user_id?: number;
  title: string;
  message: string;
  type?: NotificationType;
  link_url?: string | null;
  report_id?: number | null;
  is_read: boolean;
  created_at: string;
}

export interface UnreadNotificationCount {
  unread_count: number;
}

