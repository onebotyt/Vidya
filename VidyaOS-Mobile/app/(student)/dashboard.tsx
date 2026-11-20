/**
 * Student Dashboard Screen
 * Faithfully matches the modern Student Portal HTML design:
 * - Profile Hero Card with radiant blue background, monogram avatar, "STUDENT PORTAL" pill & theme toggle
 * - 2x2 Bento Academic KPI Grid (Attendance ring, My Classes, Assigned Work, Exam Eligibility)
 * - 2x2 Quick Academic Services (Timetable, Scores, Leave, Bug Report) with chevron arrows
 * - Subject Attendance with styled dashed empty-state and progress bars
 * - Enrolled Classes horizontal carousel with course badges & colored banners
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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { studentService } from '../../services/studentService';
import { useNotifications } from '../../hooks/useNotifications';
import {
  StudentProfile,
  StudentAttendanceStats,
  SubjectAttendanceRecord,
  TeachingGroup,
  Assignment,
  AttendanceSession,
} from '../../types/student';
import {
  ProfileHeader,
  KpiCard,
  ServiceTile,
  CourseCard,
  KpiBadgeVariant,
} from '../../components/student';
import { NotificationBanner } from '../../components/common';

export default function StudentDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();

  // Dark Mode state for the dashboard
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Sample data toggle state (to preview empty vs populated attendance)
  const [showSampleAttendance, setShowSampleAttendance] = useState<boolean>(false);

  // Exam Eligibility detail modal state
  const [showEligibilityModal, setShowEligibilityModal] = useState<boolean>(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<StudentAttendanceStats | null>(null);
  const [subjects, setSubjects] = useState<SubjectAttendanceRecord[]>([]);
  const [classes, setClasses] = useState<TeachingGroup[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [profRes, statsRes, subRes, groupRes, assignRes, sessionRes] = await Promise.allSettled([
        studentService.getProfile(),
        studentService.getAttendanceStats(),
        studentService.getAttendanceSubjects(),
        studentService.getMyEnrolledGroups(),
        studentService.getMyAssignments('assigned'),
        studentService.getOpenAttendanceSessions(),
      ]);

      if (profRes.status === 'fulfilled') setProfile(profRes.value);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (subRes.status === 'fulfilled') setSubjects(subRes.value);
      if (groupRes.status === 'fulfilled') setClasses(groupRes.value);
      if (assignRes.status === 'fulfilled') setPendingAssignments(assignRes.value);
      if (sessionRes.status === 'fulfilled' && sessionRes.value.length > 0) {
        setActiveSession(sessionRes.value[0]);
      } else {
        setActiveSession(null);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not load complete dashboard data');
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

  const getAttendanceBadgeVariant = (pct: number): KpiBadgeVariant => {
    if (pct >= 75) return 'success';
    if (pct >= 65) return 'warning';
    return 'danger';
  };

  const getProgressColor = (pct: number): string => {
    if (pct >= 75) return '#2563EB'; // Royal Blue
    if (pct >= 65) return '#D97706'; // Amber
    return '#DC2626'; // Red
  };

  // Color tokens based on theme
  const colors = isDarkMode
    ? {
        bg: '#0F172A',
        cardBg: '#1E293B',
        cardBorder: '#334155',
        textPrimary: '#FFFFFF',
        textSecondary: '#E2E8F0',
        textMuted: '#94A3B8',
        accent: '#3B82F6',
        progressTrack: '#334155',
        dashedBorder: '#475569',
        emptyIconBg: '#334155',
        liveCardBg: '#1E1B4B',
        liveCardBorder: '#4338CA',
      }
    : {
        bg: '#F8FAFC',
        cardBg: '#FFFFFF',
        cardBorder: '#E2E8F0',
        textPrimary: '#0F172A',
        textSecondary: '#334155',
        textMuted: '#94A3B8',
        accent: '#2563EB',
        progressTrack: '#F1F5F9',
        dashedBorder: '#CBD5E1',
        emptyIconBg: '#F1F5F9',
        liveCardBg: '#EEF2FF',
        liveCardBorder: '#818CF8',
      };

  if (loading && !refreshing) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          Loading student portal...
        </Text>
      </View>
    );
  }

  const overallPct = stats?.current_percentage ?? stats?.percentage ?? 100;
  const totalClasses = stats?.total_classes ?? stats?.total ?? 0;
  const attendedClasses = stats?.attended_classes ?? stats?.attended ?? 0;

  // Fallback classes matching exact subjects from user's template if no teaching groups returned
  const defaultClasses = [
    { id: '1', title: 'E-Commerce', faculty: 'Rajnish Bhutani', sem: 'Sem 5', code: 'IT-501', color: '#2563EB', icon: 'cart-outline' as const },
    { id: '2', title: 'Android Development', faculty: 'Rajnish Bhutani', sem: 'Sem 5', code: 'IT-502', color: '#059669', icon: 'cellphone' as const },
    { id: '3', title: 'Minor Project', faculty: 'Rajesh Lal', sem: 'Sem 5', code: 'IT-503', color: '#7C3AED', icon: 'flask-outline' as const },
    { id: '4', title: 'Cloud Computing', faculty: 'IT Department', sem: 'Sem 5', code: 'IT-504', color: '#0284C7', icon: 'cloud-outline' as const },
    { id: '5', title: 'Software Engineering', faculty: 'IT Department', sem: 'Sem 5', code: 'IT-505', color: '#D97706', icon: 'code-braces' as const },
    { id: '6', title: 'Cyber Security', faculty: 'IT Department', sem: 'Sem 5', code: 'IT-506', color: '#E11D48', icon: 'shield-lock-outline' as const },
  ];

  // Sample attendance rows for instant preview
  const sampleAttendanceData = [
    { subject_id: 's1', subject_name: 'E-Commerce', attended_sessions: 11, total_sessions: 12, percentage: 92, component: 'THEORY' },
    { subject_id: 's2', subject_name: 'Android Development', attended_sessions: 15, total_sessions: 17, percentage: 88, component: 'LAB' },
    { subject_id: 's3', subject_name: 'Minor Project', attended_sessions: 8, total_sessions: 8, percentage: 100, component: 'PROJECT' },
  ];

  const displayedSubjects = showSampleAttendance
    ? sampleAttendanceData
    : subjects.length > 0
    ? subjects
    : [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, 10),
          paddingBottom: Math.max(insets.bottom, 16) + 40,
        },
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Profile Hero Card */}
      <ProfileHeader
        fullName={profile?.full_name || 'Aakash Kumar'}
        eyebrow="STUDENT PORTAL"
        department={profile?.department_name || profile?.branch_name || 'Information Technology'}
        year={profile?.year || 3}
        semester={profile?.semester || 5}
        rollNo={profile?.class_roll_no !== undefined && profile?.class_roll_no !== null ? profile.class_roll_no : 2}
        enrollmentNo={profile?.official_enrollment_no || profile?.registration_no || '24011120001'}
        unreadNotificationsCount={unreadCount}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        onPressNotifications={() => router.push('/(student)/notifications')}
      />

      {errorMessage && (
        <NotificationBanner
          type="error"
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Live Active Attendance Session Banner (if open) */}
      {activeSession && (
        <View
          style={[
            styles.liveSessionCard,
            { backgroundColor: colors.liveCardBg, borderColor: colors.liveCardBorder },
          ]}
        >
          <View style={styles.liveSessionHeader}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveBadgeText}>LIVE ATTENDANCE ROLL-CALL OPEN</Text>
          </View>
          <Text style={[styles.liveSubjectName, { color: colors.textPrimary }]}>
            {activeSession.subject_name}
          </Text>
          <Text style={[styles.liveTeacherName, { color: colors.textMuted }]}>
            Faculty: {activeSession.teacher_name || 'Class Teacher'} •{' '}
            {activeSession.label || activeSession.session_type || 'Lecture'}
          </Text>
          <View style={styles.liveActionButtonsRow}>
            <TouchableOpacity
              style={[styles.liveBtn, styles.liveBtnPrimary]}
              onPress={() => router.push('/(student)/attendance')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="dialpad" size={18} color="#FFFFFF" />
              <Text style={styles.liveBtnPrimaryText}>Enter PIN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.liveBtn, styles.liveBtnSecondary]}
              onPress={() => router.push('/(student)/qr-scanner')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="qrcode-scan" size={18} color="#4F46E5" />
              <Text style={styles.liveBtnSecondaryText}>Scan QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 2. Key Metrics Bento Grid (2x2) */}
      <View style={styles.kpiRow}>
        <KpiCard
          iconName="calendar-check"
          iconColor="#2563EB"
          iconBg={isDarkMode ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF'}
          badgeLabel={`${overallPct}%`}
          badgeVariant={getAttendanceBadgeVariant(overallPct)}
          value={`${overallPct}%`}
          label="Overall Attendance"
          subtext={`${attendedClasses} of ${totalClasses} classes attended`}
          isDarkMode={isDarkMode}
          onPress={() => router.push('/(student)/attendance')}
        />

        <KpiCard
          iconName="book-open-page-variant-outline"
          iconColor="#059669"
          iconBg={isDarkMode ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5'}
          badgeLabel="ENROLLED"
          badgeVariant="neutral"
          value={classes.length > 0 ? classes.length : 6}
          label="My Classes"
          subtext="Active courses in term"
          isDarkMode={isDarkMode}
          onPress={() => router.push('/(student)/classes')}
        />
      </View>

      <View style={styles.kpiRow}>
        <KpiCard
          iconName="clipboard-text-clock-outline"
          iconColor="#D97706"
          iconBg={isDarkMode ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB'}
          badgeLabel={pendingAssignments.length > 0 ? 'ACTION' : 'CAUGHT UP'}
          badgeVariant={pendingAssignments.length > 0 ? 'warning' : 'success'}
          value={pendingAssignments.length}
          label="Assigned Work"
          subtext="Pending submissions"
          isDarkMode={isDarkMode}
          onPress={() => router.push('/(student)/assignments')}
        />

        <KpiCard
          iconName="shield-check-outline"
          iconColor="#7C3AED"
          iconBg={isDarkMode ? 'rgba(124, 58, 237, 0.15)' : '#F5F3FF'}
          badgeLabel="75% MIN"
          badgeVariant="info"
          value={overallPct >= 75 ? 'ELIGIBLE' : 'SHORTAGE'}
          label="Exam Eligibility"
          subtext={overallPct >= 75 ? 'Meets threshold' : 'Attendance warning'}
          isDarkMode={isDarkMode}
          onPress={() => setShowEligibilityModal(true)}
        />
      </View>

      {/* 3. Quick Academic Services (2x2 Grid) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Quick Academic Services
        </Text>
      </View>

      <View style={styles.servicesGrid}>
        <ServiceTile
          iconName="calendar-month-outline"
          iconColor="#4F46E5"
          iconBg={isDarkMode ? 'rgba(79, 70, 229, 0.15)' : '#EEF2FF'}
          title="Timetable"
          subtitle="Weekly class PDF"
          isDarkMode={isDarkMode}
          onPress={() => router.push('/(student)/timetable')}
        />

        <ServiceTile
          iconName="chart-box-outline"
          iconColor="#059669"
          iconBg={isDarkMode ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5'}
          title="Scores & Tests"
          subtitle="Marksheet dossier"
          isDarkMode={isDarkMode}
          onPress={() => router.push('/(student)/scores')}
        />

        <ServiceTile
          iconName="file-document-edit-outline"
          iconColor="#D97706"
          iconBg={isDarkMode ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB'}
          title="Leave Request"
          subtitle="Apply & tracking"
          isDarkMode={isDarkMode}
          onPress={() => router.push('/(student)/leave')}
        />

        <ServiceTile
          iconName="bug-outline"
          iconColor="#DC2626"
          iconBg={isDarkMode ? 'rgba(220, 38, 38, 0.15)' : '#FEF2F2'}
          title="Report Bug"
          subtitle="Technical issues"
          isDarkMode={isDarkMode}
          onPress={() => router.push('/(student)/bug-report')}
        />
      </View>

      {/* 4. Subject Attendance Section */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Subject Attendance
          </Text>
          {/* Sample Data Toggle Pill (matching the HTML mockup) */}
          <TouchableOpacity
            style={[
              styles.sampleTogglePill,
              {
                borderColor: showSampleAttendance ? '#2563EB' : colors.cardBorder,
                backgroundColor: showSampleAttendance
                  ? isDarkMode
                    ? 'rgba(37, 99, 235, 0.15)'
                    : '#EFF6FF'
                  : colors.cardBg,
              },
            ]}
            onPress={() => setShowSampleAttendance((prev) => !prev)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.sampleDot,
                { backgroundColor: showSampleAttendance ? '#2563EB' : colors.textMuted },
              ]}
            />
            <Text
              style={[
                styles.sampleToggleText,
                { color: showSampleAttendance ? '#2563EB' : colors.textMuted },
              ]}
            >
              Sample Data
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(student)/attendance')}
          activeOpacity={0.7}
        >
          <Text style={[styles.seeAllText, { color: colors.accent }]}>View All →</Text>
        </TouchableOpacity>
      </View>

      {displayedSubjects.length === 0 ? (
        /* Empty State Card matching the HTML template precisely */
        <View
          style={[
            styles.emptyAttendanceCard,
            { backgroundColor: colors.cardBg, borderColor: colors.dashedBorder },
          ]}
        >
          <View style={[styles.emptyIconBox, { backgroundColor: colors.emptyIconBg }]}>
            <MaterialCommunityIcons
              name="chart-box-outline"
              size={24}
              color={colors.textMuted}
            />
          </View>
          <Text style={[styles.emptyCardTitle, { color: colors.textPrimary }]}>
            No subject attendance data available yet.
          </Text>
          <Text style={[styles.emptyCardSub, { color: colors.textMuted }]}>
            Attendance logs will appear once classes begin.
          </Text>
        </View>
      ) : (
        displayedSubjects.map((sub: any) => {
          const pct = Math.round(sub.percentage || 0);
          const progressColor = getProgressColor(pct);

          return (
            <View
              key={sub.subject_id}
              style={[
                styles.subjectCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.subjectTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subjectName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {sub.subject_name}
                  </Text>
                  <Text style={[styles.subjectCode, { color: colors.textMuted }]}>
                    {sub.attended_sessions} of {sub.total_sessions} classes attended
                  </Text>
                </View>

                <View
                  style={[
                    styles.subjectPctBadge,
                    {
                      backgroundColor:
                        pct >= 75
                          ? isDarkMode
                            ? 'rgba(16, 185, 129, 0.15)'
                            : '#ECFDF5'
                          : isDarkMode
                          ? 'rgba(239, 68, 68, 0.15)'
                          : '#FEE2E2',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.subjectPctBadgeText,
                      { color: pct >= 75 ? '#059669' : '#DC2626' },
                    ]}
                  >
                    {pct}%
                  </Text>
                </View>
              </View>

              {/* Smooth Progress Bar */}
              <View style={[styles.progressBarTrack, { backgroundColor: colors.progressTrack }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: progressColor,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })
      )}

      {/* 5. Enrolled Classes Carousel */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Enrolled Classes</Text>
        <TouchableOpacity
          onPress={() => router.push('/(student)/classes')}
          activeOpacity={0.7}
        >
          <Text style={[styles.seeAllText, { color: colors.accent }]}>
            View All ({classes.length > 0 ? classes.length : defaultClasses.length}) →
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.classesScroll}
      >
        {(classes.length > 0 ? classes : defaultClasses).map((cls: any, idx: number) => {
          const colorList = ['#2563EB', '#059669', '#7C3AED', '#0284C7', '#D97706', '#E11D48'];
          const bannerColor = cls.color || colorList[idx % colorList.length];
          const courseCode = cls.code || `IT-50${(idx % 6) + 1}`;

          return (
            <CourseCard
              key={cls.id || idx}
              courseTitle={cls.title || cls.name || cls.subject_name || 'Course'}
              facultyName={cls.faculty || cls.teacher_name || 'Faculty Member'}
              semester={cls.sem || cls.semester || 'Sem 5'}
              courseCode={courseCode}
              bannerColor={bannerColor}
              iconName={cls.icon || 'google-classroom'}
              isDarkMode={isDarkMode}
              onPress={() => router.push(`/(student)/class-detail?id=${cls.id}`)}
            />
          );
        })}
      </ScrollView>

      {/* Exam Eligibility Detail Modal */}
      <Modal
        visible={showEligibilityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEligibilityModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <MaterialCommunityIcons name="shield-check" size={24} color="#7C3AED" />
              </View>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Exam Eligibility Status
              </Text>
            </View>

            <View style={styles.modalBadgeRow}>
              <View style={styles.modalStatusBadge}>
                <Text style={styles.modalStatusBadgeText}>STATUS: ELIGIBLE</Text>
              </View>
            </View>

            <Text style={[styles.modalBodyText, { color: colors.textMuted }]}>
              Your current attendance stands at <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{overallPct}%</Text>. Maintain at least 75% attendance across all enrolled subjects to remain eligible for end-semester university examinations.
            </Text>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowEligibilityModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  liveSessionCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  liveSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginRight: 6,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.6,
  },
  liveSubjectName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  liveTeacherName: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 12,
  },
  liveActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  liveBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  liveBtnPrimary: {
    backgroundColor: '#4F46E5',
  },
  liveBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  liveBtnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  liveBtnSecondaryText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sampleTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  sampleDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  sampleToggleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  emptyAttendanceCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyCardSub: {
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 16,
  },
  subjectCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  subjectTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subjectCode: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
  subjectPctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  subjectPctBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  classesScroll: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  modalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalBadgeRow: {
    marginBottom: 12,
  },
  modalStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalStatusBadgeText: {
    color: '#6D28D9',
    fontSize: 11,
    fontWeight: '800',
  },
  modalBodyText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
  },
  modalCloseBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
