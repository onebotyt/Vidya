/**
 * Student Dashboard Profile Header Component
 * Matches the vibrant hero card design:
 * - Rounded-2xl avatar box ("AK")
 * - "STUDENT PORTAL" eyebrow badge with pulsing live green dot
 * - Theme toggle (sun/moon) + notification bell with indicator
 * - Roll Number & Enrollment ID identity chips with top border
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ProfileHeaderProps {
  fullName: string;
  eyebrow?: string;
  department: string;
  year: number | string;
  semester: number | string;
  rollNo: number | string | null;
  enrollmentNo: string | null;
  unreadNotificationsCount?: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onPressNotifications: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  fullName,
  eyebrow = 'STUDENT PORTAL',
  department,
  year,
  semester,
  rollNo,
  enrollmentNo,
  unreadNotificationsCount = 0,
  isDarkMode,
  onToggleTheme,
  onPressNotifications,
}) => {
  // Generate 2-letter monogram
  const monogram = (fullName || 'AK')
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.heroCard}>
      {/* Decorative ambient glowing accents */}
      <View style={styles.ambientGlowTopRight} />
      <View style={styles.ambientGlowBottomLeft} />

      {/* Top Utility Row: Portal Label + Theme Toggle & Notification Bell */}
      <View style={styles.topUtilityRow}>
        <View style={styles.eyebrowBadge}>
          <View style={styles.pulsingGreenDot} />
          <Text style={styles.eyebrowText}>{eyebrow}</Text>
        </View>

        <View style={styles.actionCluster}>
          {/* Theme Toggle Button */}
          <TouchableOpacity
            style={styles.utilityBtn}
            onPress={onToggleTheme}
            activeOpacity={0.75}
            accessibilityLabel="Toggle Light/Dark Theme"
          >
            <MaterialCommunityIcons
              name={isDarkMode ? 'weather-sunny' : 'weather-night'}
              size={18}
              color={isDarkMode ? '#FDE68A' : '#FFFFFF'}
            />
          </TouchableOpacity>

          {/* Notification Bell Button */}
          <TouchableOpacity
            style={styles.utilityBtn}
            onPress={onPressNotifications}
            activeOpacity={0.75}
            accessibilityLabel="Notifications"
          >
            <MaterialCommunityIcons name="bell-outline" size={18} color="#FFFFFF" />
            {unreadNotificationsCount > 0 && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Student Identity Row */}
      <View style={styles.identityRow}>
        {/* Rounded-2xl avatar box matching the mockup */}
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>{monogram}</Text>
        </View>

        <View style={styles.identityTextContainer}>
          <Text style={styles.studentName} numberOfLines={1}>
            {fullName || 'Aakash Kumar'}
          </Text>
          <Text style={styles.cohortText} numberOfLines={1}>
            {department} • Year {year}, Sem {semester}
          </Text>
        </View>
      </View>

      {/* Roll & Enrollment Identity Chips */}
      <View style={styles.chipsRow}>
        <View style={styles.chip}>
          <Text style={styles.chipLabel}>Roll:</Text>
          <Text style={styles.chipValue}>{rollNo !== null && rollNo !== undefined ? `${rollNo}` : '—'}</Text>
        </View>

        <View style={styles.chip}>
          <Text style={styles.chipLabel}>Enrollment:</Text>
          <Text style={styles.chipValue}>
            {enrollmentNo || 'Not Assigned'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: '#2563EB',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  ambientGlowTopRight: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  ambientGlowBottomLeft: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  topUtilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pulsingGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6EE7B7',
    marginRight: 6,
  },
  eyebrowText: {
    color: '#DBEAFE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  actionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  utilityBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FB7185',
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  identityTextContainer: {
    flex: 1,
  },
  studentName: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cohortText: {
    color: 'rgba(219, 234, 254, 0.92)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.16)',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 5,
    gap: 4,
  },
  chipLabel: {
    color: '#DBEAFE',
    fontSize: 11,
    fontWeight: '500',
  },
  chipValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
