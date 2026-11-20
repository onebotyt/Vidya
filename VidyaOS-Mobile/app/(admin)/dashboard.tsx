/**
 * System Administrator Dashboard Screen
 * Overview of institutional metrics, real-time telemetry,
 * server status, registration gates, and quick administrative actions.
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { adminService } from '../../services/adminService';
import { bugReportService } from '../../services/bugReportService';
import { AdminStats, RegistrationGates } from '../../types/admin';
import { BugReportStatistics } from '../../types/bugReport';
import { Card, Badge, NotificationBanner } from '../../components/common';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bugStats, setBugStats] = useState<BugReportStatistics | null>(null);
  const [gates, setGates] = useState<RegistrationGates | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [statsRes, bugStatsRes, gatesRes] = await Promise.allSettled([
        adminService.getStats(),
        bugReportService.getAdminStatistics(),
        adminService.getRegistrationGates(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (bugStatsRes.status === 'fulfilled') setBugStats(bugStatsRes.value);
      if (gatesRes.status === 'fulfilled') setGates(gatesRes.value);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load system dashboard statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const openBugs = (bugStats?.new_count || 0) + (bugStats?.under_review || 0) + (bugStats?.in_progress || 0);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerGreeting}>INSTITUTIONAL MASTER</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {user?.full_name || 'System Administrator'}
          </Text>
          <Text style={styles.headerSubtitle}>Central Control & Policy Console</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => router.push('/(admin)/notifications')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="bell-outline" size={20} color="#7C3AED" />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.serverStatusBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.serverStatusText}>System Online</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7C3AED']} />}
      >
        {errorMessage && (
          <NotificationBanner
            type="error"
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
            style={{ marginBottom: 12 }}
          />
        )}

        {/* Open Bugs Alert Banner */}
        {openBugs > 0 && (
          <TouchableOpacity
            style={styles.bugAlertBanner}
            onPress={() => router.push('/(admin)/bug-reports')}
            activeOpacity={0.8}
          >
            <View style={styles.bugAlertIcon}>
              <MaterialCommunityIcons name="alert-decagram" size={24} color="#DC2626" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.bugAlertTitle}>{openBugs} Technical Bug Report{openBugs > 1 ? 's' : ''} Open</Text>
              <Text style={styles.bugAlertSub}>Triage reported errors, malfunctions, and upload issues</Text>
            </View>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#DC2626" />
          </TouchableOpacity>
        )}

        {/* Loading Spinner */}
        {loading && !refreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading institutional metrics...</Text>
          </View>
        )}

        {/* 6 Real-time System KPIs */}
        {!loading && (
          <>
            <Text style={styles.sectionHeading}>System Telemetry</Text>
            <View style={styles.kpiGrid}>
              <Card variant="elevated" style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <MaterialCommunityIcons name="account-group" size={20} color="#2563EB" />
                  <Badge label="Roster" variant="info" />
                </View>
                <Text style={styles.kpiValue}>{stats?.total_students ?? 0}</Text>
                <Text style={styles.kpiLabel}>Total Students</Text>
                <Text style={styles.kpiSub}>Enrolled cohorts</Text>
              </Card>

              <Card variant="elevated" style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <MaterialCommunityIcons name="account-tie" size={20} color="#059669" />
                  <Badge label="Staff" variant="success" />
                </View>
                <Text style={[styles.kpiValue, { color: '#059669' }]}>{stats?.total_faculty ?? 0}</Text>
                <Text style={styles.kpiLabel}>Faculty Members</Text>
                <Text style={styles.kpiSub}>Teachers & HODs</Text>
              </Card>
            </View>

            <View style={styles.kpiGrid}>
              <Card variant="elevated" style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <MaterialCommunityIcons name="domain" size={20} color="#7C3AED" />
                  <Badge label="Branches" variant="info" />
                </View>
                <Text style={[styles.kpiValue, { color: '#7C3AED' }]}>{stats?.total_departments ?? 0}</Text>
                <Text style={styles.kpiLabel}>Departments</Text>
                <Text style={styles.kpiSub}>Academic divisions</Text>
              </Card>

              <Card variant="elevated" style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <MaterialCommunityIcons name="calendar-check" size={20} color="#D97706" />
                  <Badge label="Today" variant="warning" />
                </View>
                <Text style={[styles.kpiValue, { color: '#D97706' }]}>{stats?.active_sessions_today ?? 0}</Text>
                <Text style={styles.kpiLabel}>Active Sessions</Text>
                <Text style={styles.kpiSub}>Attendance roll calls</Text>
              </Card>
            </View>

            <View style={styles.kpiGrid}>
              <Card variant="elevated" style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <MaterialCommunityIcons name="account-clock" size={20} color="#4F46E5" />
                  <Badge label="Queue" variant="neutral" />
                </View>
                <Text style={styles.kpiValue}>{stats?.pending_registrations ?? 0}</Text>
                <Text style={styles.kpiLabel}>Pending Approvals</Text>
                <Text style={styles.kpiSub}>Registration requests</Text>
              </Card>

              <Card variant="elevated" style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <MaterialCommunityIcons name="bug" size={20} color="#DC2626" />
                  <Badge label={openBugs > 0 ? 'Urgent' : 'Clear'} variant={openBugs > 0 ? 'danger' : 'success'} />
                </View>
                <Text style={[styles.kpiValue, { color: openBugs > 0 ? '#DC2626' : '#059669' }]}>
                  {bugStats?.total ?? stats?.open_bug_reports ?? 0}
                </Text>
                <Text style={styles.kpiLabel}>Total Bug Reports</Text>
                <Text style={styles.kpiSub}>{openBugs} unresolved</Text>
              </Card>
            </View>

            {/* Quick Actions Hub */}
            <Text style={styles.sectionHeading}>Administrative Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(admin)/faculty-management')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <MaterialCommunityIcons name="account-multiple-plus" size={24} color="#059669" />
                </View>
                <Text style={styles.actionTitle}>Faculty Directory</Text>
                <Text style={styles.actionSub}>Manage teachers & HODs</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(admin)/academic-structure')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#F5F3FF' }]}>
                  <MaterialCommunityIcons name="domain-plus" size={24} color="#7C3AED" />
                </View>
                <Text style={styles.actionTitle}>Academics & Gates</Text>
                <Text style={styles.actionSub}>Departments & access</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(admin)/bug-reports')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#FEF2F2' }]}>
                  <MaterialCommunityIcons name="shield-bug-outline" size={24} color="#DC2626" />
                </View>
                <Text style={styles.actionTitle}>Bug Triage</Text>
                <Text style={styles.actionSub}>Review reported bugs</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(admin)/audit-logs')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <MaterialCommunityIcons name="history" size={24} color="#2563EB" />
                </View>
                <Text style={styles.actionTitle}>Audit Logs</Text>
                <Text style={styles.actionSub}>Track administrative events</Text>
              </TouchableOpacity>
            </View>

            {/* Registration Security Gates Snapshot */}
            <Text style={styles.sectionHeading}>Onboarding Security Gates</Text>
            <Card variant="outlined" style={styles.gatesCard}>
              <View style={styles.gateRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gateTitle}>Student Self-Registration</Text>
                  <Text style={styles.gateSub}>Allow new students to register on the mobile app</Text>
                </View>
                <Badge
                  label={gates?.student_registration_enabled ? 'OPEN' : 'LOCKED'}
                  variant={gates?.student_registration_enabled ? 'success' : 'danger'}
                />
              </View>

              <View style={[styles.gateRow, styles.gateBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gateTitle}>Faculty Registration</Text>
                  <Text style={styles.gateSub}>Permit instructor onboarding</Text>
                </View>
                <Badge
                  label={gates?.faculty_registration_enabled ? 'OPEN' : 'LOCKED'}
                  variant={gates?.faculty_registration_enabled ? 'success' : 'danger'}
                />
              </View>

              <TouchableOpacity
                style={styles.manageGatesLink}
                onPress={() => router.push('/(admin)/academic-structure')}
              >
                <Text style={styles.manageGatesText}>Configure Registration Gates →</Text>
              </TouchableOpacity>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.xl,
    paddingBottom: THEME.spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  headerGreeting: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellButton: {
    padding: 6,
    borderRadius: 18,
    backgroundColor: '#F5F3FF',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  serverStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radii.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  serverStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  content: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  bugAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: THEME.radii.md,
    padding: 12,
    marginBottom: THEME.spacing.md,
  },
  bugAlertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bugAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  bugAlertSub: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 1,
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
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.md,
    padding: 12,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  actionSub: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  gatesCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 10,
  },
  gateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  gateBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  gateTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  gateSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  manageGatesLink: {
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
  },
  manageGatesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
});
