/**
 * Enrolled Course Card Component (Carousel)
 * Styled precisely after the HTML template:
 * - Width ~188px with rounded-2xl border
 * - Top banner (h-20) with subject gradient/color, glowing overlay, icon box & code badge
 * - Body with course title, faculty name, divider, semester badge, and chevron
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CourseCardProps {
  courseTitle: string;
  facultyName: string;
  semester: number | string;
  courseCode?: string;
  bannerColor?: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  isDarkMode?: boolean;
  onPress: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  courseTitle,
  facultyName,
  semester,
  courseCode = 'COURSE',
  bannerColor = '#2563EB',
  iconName = 'google-classroom',
  isDarkMode = false,
  onPress,
}) => {
  const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#334155' : '#E2E8F0';
  const textPrimary = isDarkMode ? '#FFFFFF' : '#0F172A';
  const textMuted = isDarkMode ? '#94A3B8' : '#64748B';
  const dividerColor = isDarkMode ? '#334155' : '#F1F5F9';
  const semBadgeBg = isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
  const semBadgeText = isDarkMode ? '#93C5FD' : '#1D4ED8';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
        },
      ]}
    >
      {/* Top Banner (Height: 76px) */}
      <View style={[styles.banner, { backgroundColor: bannerColor }]}>
        {/* Ambient background circle */}
        <View style={styles.bannerCircleAccent} />

        <View style={styles.bannerIconBox}>
          <MaterialCommunityIcons name={iconName} size={22} color="#FFFFFF" />
        </View>

        <View style={styles.codeBadge}>
          <Text style={styles.codeBadgeText}>{courseCode}</Text>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.body}>
        <View>
          <Text style={[styles.title, { color: textPrimary }]} numberOfLines={1}>
            {courseTitle}
          </Text>
          <Text style={[styles.facultyText, { color: textMuted }]} numberOfLines={1}>
            {facultyName || 'Faculty Member'}
          </Text>
        </View>

        {/* Bottom Footer Row */}
        <View style={[styles.footerRow, { borderTopColor: dividerColor }]}>
          <View style={[styles.semBadge, { backgroundColor: semBadgeBg }]}>
            <Text style={[styles.semBadgeText, { color: semBadgeText }]}>
              {typeof semester === 'number' ? `Sem ${semester}` : semester}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={16} color={isDarkMode ? '#64748B' : '#CBD5E1'} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 188,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 12,
  },
  banner: {
    height: 76,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerCircleAccent: {
    position: 'absolute',
    right: -14,
    bottom: -14,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  bannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
  },
  codeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  body: {
    padding: 12,
    justifyContent: 'space-between',
    minHeight: 88,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  facultyText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  semBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  semBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
