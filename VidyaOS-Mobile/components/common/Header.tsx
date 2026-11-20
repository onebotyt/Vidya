import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  unreadNotificationsCount?: number;
  onNotificationPress?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  unreadNotificationsCount = 0,
  onNotificationPress,
  rightAction,
}) => {
  const router = useRouter();
  const { user } = useAuth();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftBox}>
        {showBack ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.brandIconBox}>
            <MaterialCommunityIcons name="school" size={20} color="#3B82F6" />
          </View>
        )}

        <View style={styles.titleBox}>
          <Text style={styles.titleText} numberOfLines={1}>
            {title || 'VidyaOS'}
          </Text>
          {subtitle && (
            <Text style={styles.subtitleText} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightBox}>
        {rightAction ? (
          rightAction
        ) : (
          <>
            {/* Notification Bell */}
            {onNotificationPress && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={onNotificationPress}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="bell-outline" size={22} color="#FFFFFF" />
                {unreadNotificationsCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Profile Avatar */}
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(user?.full_name || user?.name || user?.username)}</Text>
              <View style={styles.statusDot} />
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 60,
    backgroundColor: THEME.colors.navyDeep,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.navyBorder,
    ...THEME.shadows.header,
  },
  leftBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: THEME.spacing.md,
  },
  backButton: {
    padding: 6,
    marginRight: 6,
    borderRadius: THEME.radii.sm,
  },
  brandIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  titleBox: {
    flex: 1,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: THEME.typography.weights.bold,
  },
  subtitleText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: THEME.typography.weights.medium,
  },
  rightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 6,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: THEME.colors.error,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: THEME.colors.navyDeep,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: THEME.colors.navyDeep,
  },
});

