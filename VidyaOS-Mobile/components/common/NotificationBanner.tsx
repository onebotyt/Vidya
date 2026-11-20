import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';

export type BannerType = 'info' | 'success' | 'warning' | 'error' | 'danger';

interface NotificationBannerProps {
  type?: BannerType;
  title?: string;
  message: string;
  onClose?: () => void;
  onDismiss?: () => void;
  actionText?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  onDismiss,
  actionText,
  onAction,
  style,
}) => {
  const handleClose = onClose || onDismiss;
  const getBannerDetails = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'check-circle' as const,
          color: '#16A34A',
          bg: '#F0FDF4',
          border: '#BBF7D0',
        };
      case 'warning':
        return {
          icon: 'alert-outline' as const,
          color: '#D97706',
          bg: '#FFFBEB',
          border: '#FDE68A',
        };
      case 'danger':
      case 'error':
        return {
          icon: 'alert-circle-outline' as const,
          color: '#DC2626',
          bg: '#FEF2F2',
          border: '#FECACA',
        };
      case 'info':
      default:
        return {
          icon: 'information-outline' as const,
          color: '#2563EB',
          bg: '#EFF6FF',
          border: '#BFDBFE',
        };
    }
  };

  const details = getBannerDetails();

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: details.bg, borderColor: details.border },
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={details.icon}
        size={22}
        color={details.color}
        style={styles.icon}
      />

      <View style={styles.textBox}>
        {title && <Text style={[styles.title, { color: details.color }]}>{title}</Text>}
        <Text style={styles.message}>{message}</Text>
        {actionText && onAction && (
          <TouchableOpacity onPress={onAction} style={styles.actionBtn}>
            <Text style={[styles.actionText, { color: details.color }]}>{actionText} →</Text>
          </TouchableOpacity>
        )}
      </View>

      {handleClose && (
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={16} color={THEME.colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: THEME.spacing.md,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    marginBottom: THEME.spacing.md,
    width: '100%',
  },
  icon: {
    marginRight: 10,
    marginTop: 1,
  },
  textBox: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: THEME.typography.weights.bold,
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
  actionBtn: {
    marginTop: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 2,
    marginLeft: 6,
  },
});

