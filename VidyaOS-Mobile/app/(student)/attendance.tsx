/**
 * Student Attendance Telemetry & Self-Check-In Screen
 * Subject-wise breakdown, historical session log, and live 6-digit PIN / QR check-in.
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
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { studentService } from '../../services/studentService';
import {
  StudentAttendanceStats,
  SubjectAttendanceRecord,
  AttendanceHistoryItem,
  AttendanceSession,
} from '../../types/student';
import { Card, Badge, Button, NotificationBanner } from '../../components/common';

export default function StudentAttendanceScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'SUBJECTS' | 'HISTORY'>('SUBJECTS');

  const [stats, setStats] = useState<StudentAttendanceStats | null>(null);
  const [subjects, setSubjects] = useState<SubjectAttendanceRecord[]>([]);
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);

  const [pinInput, setPinInput] = useState('');
  const [submittingPin, setSubmittingPin] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setFeedback(null);
      const [statsRes, subRes, histRes, sessRes] = await Promise.allSettled([
        studentService.getAttendanceStats(),
        studentService.getAttendanceSubjects(),
        studentService.getAttendanceHistory(200),
        studentService.getOpenAttendanceSessions(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (subRes.status === 'fulfilled') setSubjects(subRes.value);
      if (histRes.status === 'fulfilled') setHistory(histRes.value);
      if (sessRes.status === 'fulfilled' && sessRes.value.length > 0) {
        setActiveSession(sessRes.value[0]);
      } else {
        setActiveSession(null);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to load attendance data' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePinSubmit = async () => {
    if (!activeSession) return;
    const cleanPin = pinInput.trim();
    if (!cleanPin || cleanPin.length !== 6) {
      setFeedback({ type: 'error', message: 'Please enter a valid 6-digit session PIN' });
      return;
    }

    try {
      setSubmittingPin(true);
      setFeedback(null);
      await studentService.submitSelfAttendance(activeSession.id, 'PIN', cleanPin);
      setFeedback({ type: 'success', message: 'Attendance recorded successfully!' });
      setPinInput('');
      setActiveSession(null);
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to submit PIN attendance' });
    } finally {
      setSubmittingPin(false);
    }
  };

  const getAttendanceBadgeVariant = (pct: number) => {
    if (pct >= 75) return 'success';
    if (pct >= 65) return 'warning';
    return 'danger';
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Loading attendance ledger...</Text>
      </View>
    );
  }

  const overallPct = stats?.current_percentage ?? stats?.percentage ?? 0;
  const totalClasses = stats?.total_classes ?? stats?.total ?? 0;
  const attendedClasses = stats?.attended_classes ?? stats?.attended ?? 0;
  const absentClasses = Math.max(0, totalClasses - attendedClasses);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.colors.primary]} />}
    >
      {/* Top Telemetry Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.headerSubtitle}>ATTENDANCE TELEMETRY</Text>
          <Badge label={overallPct >= 75 ? 'ELIGIBLE' : 'SHORTAGE'} variant={overallPct >= 75 ? 'success' : 'danger'} />
        </View>

        <View style={styles.percentageRow}>
          <Text style={styles.bigPercentage}>{overallPct}%</Text>
          <View style={styles.metaCounts}>
            <Text style={styles.metaCountItem}>
              Attended: <Text style={styles.boldText}>{attendedClasses}</Text>
            </Text>
            <Text style={styles.metaCountItem}>
              Absent: <Text style={[styles.boldText, { color: THEME.colors.danger }]}>{absentClasses}</Text>
            </Text>
            <Text style={styles.metaCountItem}>
              Total Classes: <Text style={styles.boldText}>{totalClasses}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.overallProgressBarBg}>
          <View
            style={[
              styles.overallProgressBarFill,
              {
                width: `${Math.min(overallPct, 100)}%`,
                backgroundColor:
                  overallPct >= 75 ? THEME.colors.success : overallPct >= 65 ? THEME.colors.warning : THEME.colors.danger,
              },
            ]}
          />
        </View>

        <Text style={styles.thresholdNotice}>
          {overallPct >= 75
            ? '✓ You currently satisfy the mandatory 75% institutional attendance rule.'
            : `⚠️ Warning: Minimum 75% attendance required to appear in final semester examinations.`}
        </Text>
      </View>

      {feedback && (
        <NotificationBanner
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
          style={{ marginBottom: THEME.spacing.md }}
        />
      )}

      {/* Live Self-Attendance PIN & QR Check-In Box */}
      {activeSession && (
        <Card style={styles.liveBox}>
          <View style={styles.liveHeader}>
            <View style={styles.livePulse} />
            <Text style={styles.liveHeading}>LIVE ATTENDANCE ROLL-CALL IN PROGRESS</Text>
          </View>
          <Text style={styles.liveSubject}>{activeSession.subject_name}</Text>
          <Text style={styles.liveFaculty}>
            Teacher: {activeSession.teacher_name || 'Class Faculty'} • {activeSession.session_type || 'Lecture'}
          </Text>

          {/* 6-Digit PIN Submission */}
          <View style={styles.pinSection}>
            <Text style={styles.pinLabel}>Enter 6-digit Session PIN:</Text>
            <View style={styles.pinInputRow}>
              <TextInput
                style={styles.pinInput}
                placeholder="e.g. 549123"
                placeholderTextColor={THEME.colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                value={pinInput}
                onChangeText={setPinInput}
              />
              <Button
                title="Submit PIN"
                variant="primary"
                size="md"
                loading={submittingPin}
                onPress={handlePinSubmit}
                style={{ marginLeft: THEME.spacing.xs }}
              />
            </View>
          </View>

          {/* QR Code Quick Scanner Button */}
          <View style={styles.qrDividerRow}>
            <View style={styles.qrDivider} />
            <Text style={styles.qrOrText}>OR</Text>
            <View style={styles.qrDivider} />
          </View>

          <Button
            title="Scan Dynamic Roll-Call QR Code"
            variant="outline"
            iconName="qrcode-scan"
            onPress={() => router.push('/(student)/qr-scanner')}
            style={styles.qrScanBtn}
          />
        </Card>
      )}

      {/* Segmented Tab Bar */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'SUBJECTS' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('SUBJECTS')}
        >
          <MaterialCommunityIcons
            name="view-list"
            size={18}
            color={activeTab === 'SUBJECTS' ? THEME.colors.primary : THEME.colors.textMuted}
          />
          <Text style={[styles.segmentText, activeTab === 'SUBJECTS' && styles.segmentTextActive]}>
            Subject Breakdown ({subjects.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'HISTORY' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('HISTORY')}
        >
          <MaterialCommunityIcons
            name="history"
            size={18}
            color={activeTab === 'HISTORY' ? THEME.colors.primary : THEME.colors.textMuted}
          />
          <Text style={[styles.segmentText, activeTab === 'HISTORY' && styles.segmentTextActive]}>
            Session Log ({history.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: Subject-Wise Breakdown */}
      {activeTab === 'SUBJECTS' && (
        <View style={styles.tabContent}>
          {subjects.length === 0 ? (
            <Card style={styles.emptyCard}>
              <MaterialCommunityIcons name="book-open-page-variant-outline" size={36} color={THEME.colors.textMuted} />
              <Text style={styles.emptyTitle}>No Subjects Found</Text>
              <Text style={styles.emptyDesc}>No subjects have been linked to your academic cohort yet.</Text>
            </Card>
          ) : (
            subjects.map((sub) => {
              const pct = Math.round(sub.percentage || 0);
              const needed = Math.max(0, Math.ceil((0.75 * sub.total_sessions - sub.attended_sessions) / 0.25));

              return (
                <Card key={sub.subject_id} style={styles.subjectCard}>
                  <View style={styles.subjectHeader}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.subTitle} numberOfLines={1}>
                        {sub.subject_name}
                      </Text>
                      <Text style={styles.subCode}>
                        Code: {sub.subject_code || 'N/A'} • {sub.component || 'THEORY'}
                      </Text>
                    </View>
                    <Badge label={`${pct}%`} variant={getAttendanceBadgeVariant(pct)} />
                  </View>

                  <View style={styles.subProgressBg}>
                    <View
                      style={[
                        styles.subProgressFill,
                        {
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor:
                            pct >= 75 ? THEME.colors.success : pct >= 65 ? THEME.colors.warning : THEME.colors.danger,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.subFooter}>
                    <Text style={styles.subRatio}>
                      Attended {sub.attended_sessions} of {sub.total_sessions} classes
                    </Text>
                    <Text style={[styles.subStatus, { color: pct >= 75 ? THEME.colors.success : THEME.colors.danger }]}>
                      {pct >= 75 ? 'On Track' : `Shortage (${needed} more needed)`}
                    </Text>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      )}

      {/* TAB 2: Historical Session Log */}
      {activeTab === 'HISTORY' && (
        <View style={styles.tabContent}>
          {history.length === 0 ? (
            <Card style={styles.emptyCard}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={36} color={THEME.colors.textMuted} />
              <Text style={styles.emptyTitle}>No Attendance Records</Text>
              <Text style={styles.emptyDesc}>You have no recorded attendance sessions yet.</Text>
            </Card>
          ) : (
            history.map((item, idx) => {
              const isPresent = item.status === 'PRESENT';
              return (
                <View key={item.id || idx} style={styles.historyRow}>
                  <View
                    style={[
                      styles.historyIconBox,
                      { backgroundColor: isPresent ? '#ECFDF5' : '#FEF2F2' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={isPresent ? 'check-bold' : 'close-thick'}
                      size={20}
                      color={isPresent ? THEME.colors.success : THEME.colors.danger}
                    />
                  </View>

                  <View style={styles.historyInfo}>
                    <Text style={styles.historySubject} numberOfLines={1}>
                      {item.subject_name}
                    </Text>
                    <Text style={styles.historyDate}>
                      {item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent Date'} • {item.session_type || 'Lecture'}
                    </Text>
                  </View>

                  <Badge label={item.status} variant={isPresent ? 'success' : 'danger'} />
                </View>
              );
            })
          )}
        </View>
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
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.md,
    elevation: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
    letterSpacing: 0.8,
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  bigPercentage: {
    fontSize: 42,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  metaCounts: {
    alignItems: 'flex-end',
  },
  metaCountItem: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginBottom: 2,
  },
  boldText: {
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  overallProgressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginVertical: 12,
    overflow: 'hidden',
  },
  overallProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  thresholdNotice: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
  },
  liveBox: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
    borderWidth: 1.5,
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.md,
  },
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginRight: 6,
  },
  liveHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  liveSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  liveFaculty: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginBottom: 12,
  },
  pinSection: {
    marginTop: 4,
  },
  pinLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  pinInputRow: {
    flexDirection: 'row',
  },
  pinInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: THEME.colors.textPrimary,
  },
  qrDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  qrDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  qrOrText: {
    paddingHorizontal: 8,
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  qrScanBtn: {
    width: '100%',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: THEME.borderRadius.md,
    padding: 3,
    marginBottom: THEME.spacing.md,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.sm,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  segmentTextActive: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  tabContent: {
    gap: THEME.spacing.xs,
  },
  subjectCard: {
    marginBottom: THEME.spacing.xs,
    padding: THEME.spacing.sm,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  subCode: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  subProgressBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginVertical: 8,
    overflow: 'hidden',
  },
  subProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  subFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subRatio: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  subStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.xs,
  },
  historyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.spacing.sm,
  },
  historyInfo: {
    flex: 1,
  },
  historySubject: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  historyDate: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  emptyCard: {
    padding: THEME.spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
