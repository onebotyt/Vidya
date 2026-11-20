/**
 * Academic KPI Bento Card Component
 * Faithfully styled after the student portal HTML template:
 * - Rounded-2xl card with subtle border & elevation
 * - Tinted icon container (or attendance ring) on top-left
 * - Color-coded status pill badge on top-right (100%, ENROLLED, CAUGHT UP, 75% MIN)
 * - 24px bold metric value
 * - Clean title and 1-line subtitle
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type KpiBadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface KpiCardProps {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  badgeLabel: string;
  badgeVariant?: KpiBadgeVariant;
  value: string | number;
  label: string;
  subtext: string;
  isDarkMode?: boolean;
  onPress?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  iconName,
  iconColor,
  iconBg,
  badgeLabel,
  badgeVariant = 'neutral',
  value,
  label,
  subtext,
  isDarkMode = false,
  onPress,
}) => {
  const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#334155' : '#E2E8F0';
  const textPrimary = isDarkMode ? '#FFFFFF' : '#0F172A';
  const textSecondary = isDarkMode ? '#E2E8F0' : '#334155';
  const textMuted = isDarkMode ? '#94A3B8' : '#94A3B8';

  const getBadgeColors = (variant: KpiBadgeVariant) => {
    switch (variant) {
      case 'success':
        return {
          bg: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
          border: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
          text: isDarkMode ? '#6EE7B7' : '#047857',
        };
      case 'warning':
        return {
          bg: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
          border: isDarkMode ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
          text: isDarkMode ? '#FCD34D' : '#B45309',
        };
      case 'danger':
        return {
          bg: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
          border: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
          text: isDarkMode ? '#FCA5A5' : '#B91C1C',
        };
      case 'info':
        return {
          bg: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
          border: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE',
          text: isDarkMode ? '#93C5FD' : '#1D4ED8',
        };
      case 'neutral':
      default:
        return {
          bg: isDarkMode ? '#334155' : '#F1F5F9',
          border: isDarkMode ? '#475569' : '#E2E8F0',
          text: isDarkMode ? '#CBD5E1' : '#475569',
        };
    }
  };

  const badgeColors = getBadgeColors(badgeVariant);

  const content = (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      {/* Top Row: Icon Box + Status Pill */}
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={iconName} size={22} color={iconColor} />
        </View>

        <View
          style={[
            styles.badgePill,
            { backgroundColor: badgeColors.bg, borderColor: badgeColors.border },
          ]}
        >
          <Text style={[styles.badgeText, { color: badgeColors.text }]}>{badgeLabel}</Text>
        </View>
      </View>

      {/* Metric Value */}
      <Text style={[styles.valueText, { color: textPrimary }]} numberOfLines={1}>
        {value}
      </Text>

      {/* Label */}
      <Text style={[styles.labelText, { color: textSecondary }]} numberOfLines={1}>
        {label}
      </Text>

      {/* Subtitle */}
      <Text style={[styles.subText, { color: textMuted }]} numberOfLines={1}>
        {subtext}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.touchableWrapper}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.touchableWrapper}>{content}</View>;
};

const styles = StyleSheet.create({
  touchableWrapper: {
    flex: 1,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    minHeight: 132,
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  valueText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  subText: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 1,
  },
});
