/**
 * Admin More Menu Screen
 * Hub for Audit Logs, Institutional Reports, Profile, and Console Settings.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Header, Card, Button, ConfirmDialog } from '../../components/common';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { THEME } from '../../constants/theme';

export default function AdminMoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const adminTools = [
    {
      title: 'Audit Logs Trail',
      subtitle: 'View immutable system action history and security events',
      route: '/(admin)/audit-logs' as const,
      icon: 'history' as const,
      color: '#2563EB',
      bgColor: '#EFF6FF',
    },
    {
      title: 'Institutional Reports & Exports',
      subtitle: 'Excel dossiers, statistical reports & accreditation tables',
      route: '/(admin)/reports' as const,
      icon: 'file-chart-outline' as const,
      color: '#059669',
      bgColor: '#ECFDF5',
      isDesktop: true,
    },
    {
      title: 'Academic Structure & Gates',
      subtitle: 'Departments, duration, and onboarding security gates',
      route: '/(admin)/academic-structure' as const,
      icon: 'domain' as const,
      color: '#7C3AED',
      bgColor: '#F5F3FF',
    },
    {
      title: 'Bug Reports Triage',
      subtitle: 'Review & resolve student and faculty technical reports',
      route: '/(admin)/bug-reports' as const,
      icon: 'bug-outline' as const,
      color: '#DC2626',
      bgColor: '#FEF2F2',
    },
    {
      title: 'Administrator Profile',
      subtitle: 'Master credentials, account details & password update',
      route: '/(admin)/profile' as const,
      icon: 'account-cog-outline' as const,
      color: '#4F46E5',
      bgColor: '#EEF2FF',
    },
  ];

  const handleLogout = async () => {
    setLogoutDialogOpen(false);
    await logout();
  };

  return (
    <View style={styles.container}>
      <Header title="Administration Tools" subtitle="Logs, Reports & Console Settings" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <Card variant="elevated" style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.full_name || 'Admin').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.userName}>{user?.full_name || 'System Administrator'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.roleTag}>System Administrator • Console Master</Text>
          </View>
        </Card>

        {/* Administration Tools List */}
        <Text style={styles.sectionHeading}>Administrative Console</Text>
        <Card variant="outlined" style={{ padding: 0, overflow: 'hidden' }}>
          {adminTools.map((tool, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.menuItem, idx < adminTools.length - 1 && styles.borderBottom]}
              onPress={() => router.push(tool.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: tool.bgColor }]}>
                <MaterialCommunityIcons name={tool.icon} size={20} color={tool.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.menuTitle}>{tool.title}</Text>
                  {tool.isDesktop && (
                    <View style={styles.desktopBadge}>
                      <MaterialCommunityIcons name="monitor" size={10} color="#475569" />
                      <Text style={styles.desktopBadgeText}>Desktop</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.menuSubtitle}>{tool.subtitle}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Sign Out Button */}
        <Button
          title="Sign Out of Admin Console"
          onPress={() => setLogoutDialogOpen(true)}
          variant="danger"
          icon="logout"
          style={{ marginTop: 24 }}
        />
      </ScrollView>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        visible={logoutDialogOpen}
        title="Sign Out"
        message="Are you sure you want to end your active administrator session?"
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
    backgroundColor: '#7C3AED',
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
    color: '#7C3AED',
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
    marginTop: 10,
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
  desktopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: THEME.radii.sm,
    gap: 3,
  },
  desktopBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#475569',
  },
});
