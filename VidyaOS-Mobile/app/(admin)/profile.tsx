/**
 * Admin Profile & Security Screen
 * View institutional credentials, system privileges,
 * change password, and sign out with ConfirmDialog.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { Card, Badge, Button, ConfirmDialog } from '../../components/common';

export default function AdminProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogout = async () => {
    setLogoutDialogOpen(false);
    await logout();
  };

  const displayName = user?.full_name || 'System Administrator';

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 6 }}>
          <Text style={styles.headerTitle}>Administrator Profile</Text>
          <Text style={styles.headerSubtitle}>Institutional Master & Root Security</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero Card */}
        <Card variant="elevated" style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.heroName}>{displayName}</Text>
          <Text style={styles.heroEmail}>{user?.email}</Text>
          <View style={styles.badgeContainer}>
            <Badge label="SYSTEM ADMINISTRATOR" variant="info" />
          </View>
        </Card>

        {/* System Credentials Dossier */}
        <Text style={styles.sectionHeading}>System Privileges</Text>
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Console Access</Text>
            <Text style={styles.infoValue}>Full Superuser Privileges</Text>
          </View>

          <View style={[styles.infoRow, styles.borderTop]}>
            <Text style={styles.infoLabel}>Account Status</Text>
            <Badge label="ACTIVE" variant="success" />
          </View>

          <View style={[styles.infoRow, styles.borderTop]}>
            <Text style={styles.infoLabel}>Role Identifier</Text>
            <Text style={styles.infoValueMono}>SYSTEM_ADMIN</Text>
          </View>
        </Card>

        {/* Security & Quick Actions */}
        <Text style={styles.sectionHeading}>Security & Console Settings</Text>
        <Card variant="outlined" style={{ padding: 0, overflow: 'hidden' }}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(auth)/change-password')}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="lock-reset" size={20} color="#7C3AED" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.menuTitle}>Change Password</Text>
              <Text style={styles.menuSubtitle}>Update administrator master credentials</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.borderTop]}
            onPress={() => router.push('/(admin)/audit-logs')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
              <MaterialCommunityIcons name="history" size={20} color="#2563EB" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.menuTitle}>Audit Logs Trail</Text>
              <Text style={styles.menuSubtitle}>View immutable record of system events</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Sign Out Button */}
        <Button
          title="Sign Out of Administrator Session"
          variant="danger"
          icon="logout"
          onPress={() => setLogoutDialogOpen(true)}
          style={{ marginTop: 20 }}
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
  header: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.xl,
    paddingBottom: THEME.spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  content: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: THEME.spacing.md,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroName: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  heroEmail: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  badgeContainer: {
    marginTop: 10,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 8,
  },
  infoCard: {
    padding: 0,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  infoValueMono: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    fontFamily: 'monospace',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
});

