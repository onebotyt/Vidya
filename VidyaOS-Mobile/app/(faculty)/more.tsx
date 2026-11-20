/**
 * Faculty More Tools & Desktop Gate Menu Screen
 * Features:
 * - Faculty Identity Profile Card
 * - Academic Tools (Leave Approvals, Timetables, Bug Reporting, Profile)
 * - 5 Desktop-Only Gates ("Please move to Desktop")
 * - Sign Out with ConfirmDialog
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Header, Card, Button, ConfirmDialog } from '../../components/common';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { THEME } from '../../constants/theme';

export default function FacultyMoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const academicTools = [
    {
      title: 'Leave Approvals',
      subtitle: 'Review & decide department student absence requests',
      route: '/(faculty)/leave-approvals' as const,
      icon: 'calendar-check-outline' as const,
      color: '#059669',
      bgColor: '#ECFDF5',
    },
    {
      title: 'Academic Timetables',
      subtitle: 'View department cohort timetables & official PDFs',
      route: '/(faculty)/timetable' as const,
      icon: 'timetable' as const,
      color: '#2563EB',
      bgColor: '#EFF6FF',
    },
    {
      title: 'Report a Technical Problem',
      subtitle: 'Submit website or app bugs & errors to developers',
      route: '/(faculty)/bug-report' as const,
      icon: 'bug-outline' as const,
      color: '#D97706',
      bgColor: '#FEF3C7',
    },
    {
      title: 'Faculty Profile & Password',
      subtitle: 'Manage credentials, security & account settings',
      route: '/(faculty)/profile' as const,
      icon: 'account-cog-outline' as const,
      color: '#4F46E5',
      bgColor: '#EEF2FF',
    },
  ];

  const desktopModules = [
    {
      title: 'Sheets & Gradebooks',
      subtitle: 'Heavy spreadsheet calculation matrix',
      route: '/(faculty)/sheets' as const,
      icon: 'table-large' as const,
    },
    {
      title: 'Course File & NBA Dossiers',
      subtitle: 'Curriculum mapping & compliance records',
      route: '/(faculty)/course-file' as const,
      icon: 'folder-text-outline' as const,
    },
    {
      title: 'Assessment Process & Outcomes',
      subtitle: 'Outcome attainments & CO-PO matrices',
      route: '/(faculty)/assessment-process' as const,
      icon: 'chart-box-outline' as const,
    },
    {
      title: 'ESP32 Hardware & Biometric Devices',
      subtitle: 'COM port baud rates & sensor pairing',
      route: '/(faculty)/esp32-devices' as const,
      icon: 'chip' as const,
    },
    {
      title: 'HOD Academic Archive & Batches',
      subtitle: 'Historical batch ledgers & HOD registers',
      route: '/(faculty)/hod-archive' as const,
      icon: 'archive-outline' as const,
    },
  ];

  const handleLogout = async () => {
    setLogoutDialogOpen(false);
    await logout();
  };

  return (
    <View style={styles.container}>
      <Header title="More Tools" subtitle="Academic Modules & Desktop Gates" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <Card variant="elevated" style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.full_name || 'Faculty').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.userName}>{user?.full_name || 'Faculty Member'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.roleTag}>
              {user?.is_hod ? 'Department HOD' : 'Subject Faculty'} • {user?.department_name || 'Information Technology'}
            </Text>
          </View>
        </Card>

        {/* Section 1: Academic Tools */}
        <Text style={styles.sectionHeading}>Academic Services</Text>
        <Card variant="outlined" style={{ padding: 0, overflow: 'hidden' }}>
          {academicTools.map((tool, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.menuItem, idx < academicTools.length - 1 && styles.borderBottom]}
              onPress={() => router.push(tool.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: tool.bgColor }]}>
                <MaterialCommunityIcons name={tool.icon} size={20} color={tool.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.menuTitle}>{tool.title}</Text>
                <Text style={styles.menuSubtitle}>{tool.subtitle}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Section 2: Desktop-Only Gated Modules */}
        <View style={styles.desktopSectionHeader}>
          <Text style={styles.sectionHeading}>Desktop-Only Modules</Text>
          <View style={styles.desktopBadge}>
            <MaterialCommunityIcons name="monitor" size={12} color="#475569" />
            <Text style={styles.desktopBadgeText}>PC / Mac Required</Text>
          </View>
        </View>

        <Card variant="outlined" style={{ padding: 0, overflow: 'hidden' }}>
          {desktopModules.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.menuItem, idx < desktopModules.length - 1 && styles.borderBottom]}
              onPress={() => router.push(item.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#F1F5F9' }]}>
                <MaterialCommunityIcons name={item.icon} size={20} color="#475569" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <View style={styles.lockBadge}>
                <MaterialCommunityIcons name="lock-outline" size={14} color={THEME.colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Sign Out Action */}
        <Button
          title="Sign Out of Faculty Session"
          onPress={() => setLogoutDialogOpen(true)}
          variant="danger"
          icon="logout"
          style={{ marginTop: 20 }}
        />
      </ScrollView>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        visible={logoutDialogOpen}
        title="Sign Out"
        message="Are you sure you want to end your active faculty session?"
        confirmText="Yes, Sign Out"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setLogoutDialogOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  userEmail: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  roleTag: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 3,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 14,
  },
  desktopSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  desktopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.radii.sm,
    gap: 4,
  },
  desktopBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  lockBadge: {
    padding: 4,
  },
});
