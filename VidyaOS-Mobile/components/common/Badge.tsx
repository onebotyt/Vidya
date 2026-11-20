import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { THEME } from '../../constants/theme';

export type BadgeVariant =
  | 'present'
  | 'absent'
  | 'late'
  | 'excused'
  | 'new'
  | 'under_review'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
  textStyle,
  size = 'md',
}) => {
  const getBadgeColors = (): { bg: string; text: string; border: string } => {
    switch (variant) {
      case 'present':
      case 'resolved':
      case 'success':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'absent':
      case 'rejected':
      case 'danger':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' };
      case 'late':
      case 'in_progress':
      case 'warning':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' };
      case 'under_review':
        return { bg: '#F3E8FF', text: '#6B21A8', border: '#D8B4FE' };
      case 'new':
      case 'primary':
      case 'excused':
      case 'info':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
      case 'neutral':
      default:
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
    }
  };

  const colors = getBadgeColors();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badgeBase,
        { backgroundColor: colors.bg, borderColor: colors.border },
        isSm ? styles.smBadge : styles.mdBadge,
        style,
      ]}
    >
      <Text
        style={[
          styles.textBase,
          { color: colors.text },
          isSm ? styles.smText : styles.mdText,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeBase: {
    borderRadius: THEME.radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  mdBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  textBase: {
    fontWeight: THEME.typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  smText: {
    fontSize: 10,
  },
  mdText: {
    fontSize: 11,
  },
});

