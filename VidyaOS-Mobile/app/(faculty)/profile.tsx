/**
 * Faculty Profile & Security Screen
 * View institutional credentials, department info,
 * change password, and sign out with ConfirmDialog.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { facultyService } from '../../services/facultyService';
import { FacultyProfile } from '../../types/faculty';
import { Card, Badge, Button, ConfirmDialog, NotificationBanner } from '../../components/common';

export default function FacultyProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await facultyService.getProfile();
      setProfile(data);
    } catch (err: any) {
      // Fallback to auth user
      if (user) {
        setProfile({
          id: user.id,
          full_name: user.full_name || user.name || 'Faculty Member',
          email: user.email,
          role: (user.role as any) || 'TEACHER',
          is_hod: user.is_hod,
          department_name: user.department_name,
        });
      } else {
        setErrorMessage(err?.message || 'Failed to load faculty profile');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleLogout = async () => {
    setLogoutDialogOpen(false);
    await logout();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Loading profile details...</Text>
      </View>
    );
  }

  const displayName = profile?.full_name || user?.full_name || 'Faculty Member';
  const displayRole = profile?.is_hod || user?.is_hod ? 'Head of Department (HOD)' : 'Department Faculty';
  const displayDept = profile?.department_name || user?.department_name || 'Information Technology';

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 6 }}>
          <Text style={styles.headerTitle}>Faculty Profile</Text>
          <Text style={styles.headerSubtitle}>Institutional Identity & Account Security</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {errorMessage && (
          <NotificationBanner
            type="danger"
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
            style={{ marginBottom: 12 }}
          />
        )}

        {/* Hero Card */}
        <Card variant="elevated" style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.heroName}>{displayName}</Text>
          <Text style={styles.heroEmail}>{profile?.email || user?.email}</Text>
          <View style={styles.roleBadgeContainer}>
            <Badge label={displayRole} variant="success" />
          </View>
        </Card>

        {/* Institutional Dossier */}
        <Text style={styles.sectionHeading}>Institutional Details</Text>
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{displayDept}</Text>
          </View>

          {profile?.employee_id && (
            <View style={[styles.infoRow, styles.borderTop]}>
              <Text style={styles.infoLabel}>Employee ID</Text>
              <Text style={styles.infoValueMono}>{profile.employee_id}</Text>
            </View>
          )}

          <View style={[styles.infoRow, styles.borderTop]}>
            <Text style={styles.infoLabel}>System Role</Text>
            <Text style={styles.infoValue}>{profile?.role || user?.role || 'TEACHER'}</Text>
          </View>

          {profile?.phone && (
            <View style={[styles.infoRow, styles.borderTop]}>
              <Text style={styles.infoLabel}>Mobile Contact</Text>
              <Text style={styles.infoValue}>{profile.phone}</Text>
            </View>
          )}
        </Card>

        {/* Account Security & Tools */}
        <Text style={styles.sectionHeading}>Account Settings & Actions</Text>
        <Card variant="outlined" style={{ padding: 0, overflow: 'hidden' }}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(auth)/change-password')}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="lock-reset" size={20} color="#2563EB" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.menuTitle}>Change Password</Text>
              <Text style={styles.menuSubtitle}>Update login credentials & account security</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.borderTop]}
            onPress={() => router.push('/(faculty)/bug-report')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="bug-outline" size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.menuTitle}>Report a Technical Problem</Text>
              <Text style={styles.menuSubtitle}>Submit software bugs or malfunctions to admin</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Sign Out Button */}
        <Button
          title="Sign Out of Faculty Session"
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: THEME.colors.textMuted,
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
    backgroundColor: '#059669',
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
  roleBadgeContainer: {
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
    fontSize: 13,
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
    backgroundColor: '#EFF6FF',
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
