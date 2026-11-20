/**
 * Faculty & HOD Dashboard Screen
 * Overview of teaching groups, student roster, pending leave approvals,
 * live attendance roll-call sessions, and quick academic actions.
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
import { facultyService } from '../../services/facultyService';
import { useNotifications } from '../../hooks/useNotifications';
import {
  FacultyProfile,
  FacultyDashboardStats,
  AttendanceSession,
} from '../../types/faculty';
import { TeachingGroup } from '../../types/student';
import { Card, Badge, Button, NotificationBanner } from '../../components/common';

export default function FacultyDashboardScreen() {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [stats, setStats] = useState<FacultyDashboardStats | null>(null);
  const [classes, setClasses] = useState<TeachingGroup[]>([]);
  const [openSessions, setOpenSessions] = useState<AttendanceSession[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [profRes, statsRes, groupsRes, sessRes] = await Promise.allSettled([
        facultyService.getProfile(),
        facultyService.getDashboardStats(),
        facultyService.getTeachingGroups(),
        facultyService.getAttendanceSessions('OPEN'),
      ]);

      if (profRes.status === 'fulfilled') setProfile(profRes.value);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (groupsRes.status === 'fulfilled') setClasses(groupsRes.value);
      if (sessRes.status === 'fulfilled') setOpenSessions(sessRes.value);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load faculty dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading faculty dashboard...</Text>
      </View>
    );
  }

  const initials = (profile?.full_name || 'FC')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const activeSession = openSessions.length > 0 ? openSessions[0] : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
    >
      {/* Faculty Hero Card */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeSubtitle}>FACULTY PORTAL</Text>
            <Text style={styles.facultyName} numberOfLines={1}>
              {profile?.full_name || 'Faculty Instructor'}
            </Text>
            <Text style={styles.deptText}>
              {profile?.department_name || 'Department of Technology'} • {profile?.is_hod ? 'Head of Department' : 'Faculty Member'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => router.push('/(faculty)/notifications')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.badgesRow}>
          <View style={styles.chip}>
            <Text style={styles.chipLabel}>Role:</Text>
            <Text style={styles.chipVal}>{profile?.is_hod ? 'HOD' : 'Teacher'}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipLabel}>Emp ID:</Text>
            <Text style={styles.chipVal}>{profile?.employee_id || 'F001'}</Text>
          </View>
        </View>
      </View>

      {errorMessage && (
        <NotificationBanner
          type="error"
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
          style={{ marginBottom: THEME.spacing.md }}
        />
      )}

      {/* Live Active Roll-Call Banner */}
      {activeSession && (
        <Card style={styles.liveBanner}>
          <View style={styles.liveHeader}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveHeading}>LIVE ATTENDANCE SESSION OPEN</Text>
          </View>
          <Text style={styles.liveSubject}>{activeSession.subject_name || 'Class Attendance'}</Text>
          <Text style={styles.liveMeta}>
            Session #{activeSession.id} • {activeSession.label || activeSession.session_type || 'Lecture'}
          </Text>
          <Button
            title="Open Live Roll-Call Studio →"
            variant="primary"
            size="sm"
            onPress={() => router.push(`/(faculty)/session-studio?id=${activeSession.id}`)}
            style={{ marginTop: 8 }}
          />
        </Card>
      )}

      {/* 4 KPI Summary Cards */}
      <View style={styles.kpiGrid}>
        <Card style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <MaterialCommunityIcons name="google-classroom" size={20} color="#059669" />
            <Badge label="Active" variant="success" />
          </View>
          <Text style={styles.kpiValue}>{stats?.active_classes_count ?? classes.length}</Text>
          <Text style={styles.kpiLabel}>Teaching Groups</Text>
          <Text style={styles.kpiSub}>Active cohorts</Text>
        </Card>

        <Card style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <MaterialCommunityIcons name="account-group" size={20} color="#4F46E5" />
            <Badge label="Roster" variant="info" />
          </View>
          <Text style={styles.kpiValue}>{stats?.total_students_enrolled ?? 0}</Text>
          <Text style={styles.kpiLabel}>Dept Students</Text>
          <Text style={styles.kpiSub}>Enrolled members</Text>
        </Card>
      </View>

      <View style={styles.kpiGrid}>
        <Card style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <MaterialCommunityIcons name="file-document-edit-outline" size={20} color="#D97706" />
            <Badge
              label={(stats?.pending_leave_approvals ?? 0) > 0 ? 'Action' : 'Clear'}
              variant={(stats?.pending_leave_approvals ?? 0) > 0 ? 'warning' : 'success'}
            />
          </View>
          <Text style={styles.kpiValue}>{stats?.pending_leave_approvals ?? 0}</Text>
          <Text style={styles.kpiLabel}>Leave Approvals</Text>
          <Text style={styles.kpiSub}>Pending student requests</Text>
        </Card>

        <Card style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <MaterialCommunityIcons name="book-open-outline" size={20} color="#7C3AED" />
            <Badge label={openSessions.length > 0 ? 'Live' : 'Closed'} variant={openSessions.length > 0 ? 'success' : 'neutral'} />
          </View>
          <Text style={styles.kpiValue}>{openSessions.length}</Text>
          <Text style={styles.kpiLabel}>Open Roll-Calls</Text>
          <Text style={styles.kpiSub}>Live classroom sessions</Text>
        </Card>
      </View>

      {/* Quick Actions Grid */}
      <Text style={styles.sectionTitle}>Faculty Quick Actions</Text>
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={styles.quickCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(faculty)/registers')}
        >
          <View style={[styles.quickIconBox, { backgroundColor: '#ECFDF5' }]}>
            <MaterialCommunityIcons name="calendar-check" size={24} color="#059669" />
          </View>
          <Text style={styles.quickTitle}>Take Attendance</Text>
          <Text style={styles.quickSub}>Registers & Roll-Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(faculty)/leave-approvals')}
        >
          <View style={[styles.quickIconBox, { backgroundColor: '#FFFBEB' }]}>
            <MaterialCommunityIcons name="check-decagram-outline" size={24} color="#D97706" />
          </View>
          <Text style={styles.quickTitle}>Leave Approvals</Text>
          <Text style={styles.quickSub}>Review applications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(faculty)/students')}
        >
          <View style={[styles.quickIconBox, { backgroundColor: '#EEF2FF' }]}>
            <MaterialCommunityIcons name="account-search-outline" size={24} color="#4F46E5" />
          </View>
          <Text style={styles.quickTitle}>Student Roster</Text>
          <Text style={styles.quickSub}>Department cohort</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(faculty)/timetable')}
        >
          <View style={[styles.quickIconBox, { backgroundColor: '#F3E8FF' }]}>
            <MaterialCommunityIcons name="calendar-month-outline" size={24} color="#7C3AED" />
          </View>
          <Text style={styles.quickTitle}>Timetable</Text>
          <Text style={styles.quickSub}>Schedule documents</Text>
        </TouchableOpacity>
      </View>

      {/* Teaching Groups Snippet */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>My Classes ({classes.length})</Text>
        <TouchableOpacity onPress={() => router.push('/(faculty)/classes')}>
          <Text style={styles.seeAllText}>View All →</Text>
        </TouchableOpacity>
      </View>

      {classes.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No teaching groups assigned yet.</Text>
        </Card>
      ) : (
        classes.slice(0, 3).map((cls) => (
          <TouchableOpacity
            key={cls.id}
            activeOpacity={0.85}
            onPress={() => router.push(`/(faculty)/class-detail?id=${cls.id}`)}
          >
            <Card style={styles.classSnippet}>
              <View style={styles.classRow}>
                <View style={styles.classIcon}>
                  <MaterialCommunityIcons name="google-classroom" size={22} color="#059669" />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.className} numberOfLines={1}>
                    {cls.name || cls.subject_name}
                  </Text>
                  <Text style={styles.classSub}>
                    Semester {cls.semester || 1} • {cls.component || 'THEORY'}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.colors.textMuted} />
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    padding: THEME.spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
  },
  loadingText: {
    marginTop: THEME.spacing.sm,
    color: THEME.colors.textMuted,
    fontSize: 14,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  bellButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#DC2626',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  welcomeSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
  },
  facultyName: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  deptText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  chipLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginRight: 4,
  },
  chipVal: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  liveBanner: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
    borderWidth: 1.5,
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.md,
  },
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
    marginRight: 6,
  },
  liveHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  liveSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  liveMeta: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  kpiCard: {
    flex: 1,
    padding: THEME.spacing.sm,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 4,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: THEME.spacing.sm,
  },
  quickCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  quickIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  quickSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  classSnippet: {
    marginBottom: 8,
    padding: 12,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  className: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  classSub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  emptyCard: {
    padding: THEME.spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
});
