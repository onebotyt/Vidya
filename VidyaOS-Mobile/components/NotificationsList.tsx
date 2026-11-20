/**
 * Reusable Notifications List Component
 * Shared across Student, Faculty, and Admin portals.
 * Features:
 * - Real-time notification feed with read/unread visual styling
 * - "Mark all as read" header action
 * - Deep-linking to Bug Reports, Attendance, and Leave
 * - Pull-to-refresh & empty states
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { useNotifications } from '../hooks/useNotifications';
import { AppNotification } from '../types/notification';
import { Card, EmptyState } from './common';

interface NotificationsListProps {
  portalRole: 'student' | 'faculty' | 'admin';
  accentColor?: string;
}

export const NotificationsList: React.FC<NotificationsListProps> = ({
  portalRole,
  accentColor = '#2563EB',
}) => {
  const router = useRouter();
  const { notifications, unreadCount, loading, refreshing, markAsRead, markAllRead, refresh } =
    useNotifications();

  const handleNotificationPress = async (item: AppNotification) => {
    // 1. Mark as read
    if (!item.is_read) {
      await markAsRead(item.id);
    }

    // 2. Deep-linking
    const isBugUpdate =
      item.type === 'BUG_UPDATE' ||
      (item.link_url && item.link_url.includes('bug-report')) ||
      item.report_id;

    if (isBugUpdate) {
      const reportId = item.report_id || '';
      if (portalRole === 'admin') {
        router.push(`/(admin)/bug-reports?reportId=${reportId}`);
      } else {
        router.push(`/(${portalRole})/bug-report?reportId=${reportId}`);
      }
      return;
    }

    if (item.type === 'ATTENDANCE') {
      if (portalRole === 'student') router.push('/(student)/attendance');
      else if (portalRole === 'faculty') router.push('/(faculty)/registers');
      return;
    }

    if (item.type === 'LEAVE_UPDATE') {
      if (portalRole === 'student') router.push('/(student)/leave');
      else if (portalRole === 'faculty') router.push('/(faculty)/leave-approvals');
      return;
    }

    // Custom link_url fallback
    if (item.link_url) {
      if (item.link_url.startsWith('/')) {
        router.push(item.link_url as any);
      }
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'BUG_UPDATE':
        return { name: 'bug-outline' as const, color: '#D97706', bg: '#FEF3C7' };
      case 'ATTENDANCE':
        return { name: 'calendar-check-outline' as const, color: '#059669', bg: '#ECFDF5' };
      case 'LEAVE_UPDATE':
        return { name: 'file-document-outline' as const, color: '#2563EB', bg: '#EFF6FF' };
      case 'ALERT':
        return { name: 'alert-circle-outline' as const, color: '#DC2626', bg: '#FEF2F2' };
      case 'SUCCESS':
        return { name: 'check-circle-outline' as const, color: '#059669', bg: '#ECFDF5' };
      default:
        return { name: 'bell-outline' as const, color: accentColor, bg: '#F1F5F9' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Controls Bar */}
      <View style={styles.controlsBar}>
        <View style={styles.badgeCountBox}>
          <Text style={styles.badgeCountText}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <MaterialCommunityIcons name="check-all" size={16} color={accentColor} />
            <Text style={[styles.markAllText, { color: accentColor }]}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[accentColor]} />}
      >
        {/* Loading Spinner */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && (
          <EmptyState
            icon="bell-sleep-outline"
            title="No Notifications"
            description="You don't have any in-app alerts or updates at this time."
          />
        )}

        {/* Notification Cards */}
        {!loading &&
          notifications.map((item) => {
            const iconConfig = getNotificationIcon(item.type);
            const isUnread = !item.is_read;

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.notificationCard, isUnread && styles.notificationCardUnread]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: iconConfig.bg }]}>
                  <MaterialCommunityIcons name={iconConfig.name} size={20} color={iconConfig.color} />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.headerRow}>
                    <Text style={[styles.titleText, isUnread && styles.titleTextUnread]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {isUnread && <View style={[styles.unreadDot, { backgroundColor: accentColor }]} />}
                  </View>

                  <Text style={styles.messageText} numberOfLines={2}>
                    {item.message}
                  </Text>

                  <View style={styles.footerRow}>
                    <Text style={styles.dateText}>{item.created_at || 'Recently'}</Text>
                    {item.type === 'BUG_UPDATE' && (
                      <View style={styles.deepLinkBadge}>
                        <Text style={styles.deepLinkText}>View Bug Report →</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  badgeCountBox: {
    flex: 1,
  },
  badgeCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 12,
    marginBottom: 8,
  },
  notificationCardUnread: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    flex: 1,
  },
  titleTextUnread: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  messageText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
    marginTop: 3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  dateText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  deepLinkBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radii.sm,
  },
  deepLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
});

