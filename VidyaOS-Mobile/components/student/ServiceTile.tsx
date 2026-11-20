/**
 * Quick Academic Service Action Card Component
 * Styled after the HTML template:
 * - Rounded-2xl card with 1px border
 * - Top row: tinted icon box (left) + right chevron icon (right)
 * - Title (14px bold) + 1-line subtitle (11px)
 * - Smooth active press opacity
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ServiceTileProps {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  isDarkMode?: boolean;
  onPress: () => void;
}

export const ServiceTile: React.FC<ServiceTileProps> = ({
  iconName,
  iconColor,
  iconBg,
  title,
  subtitle,
  isDarkMode = false,
  onPress,
}) => {
  const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#334155' : '#E2E8F0';
  const textPrimary = isDarkMode ? '#FFFFFF' : '#0F172A';
  const textMuted = isDarkMode ? '#94A3B8' : '#64748B';
  const chevronColor = isDarkMode ? '#475569' : '#CBD5E1';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.tile,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
        },
      ]}
    >
      {/* Top Row: Icon Box + Chevron Arrow */}
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={iconName} size={22} color={iconColor} />
        </View>

        <MaterialCommunityIcons name="chevron-right" size={18} color={chevronColor} />
      </View>

      {/* Text Hierarchy */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tile: {
    width: '48.2%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    justifyContent: 'space-between',
    minHeight: 116,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginTop: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
});
