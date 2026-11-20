/**
 * Student Leave Applications Screen
 * Features:
 * - Summary KPI cards (Total, Approved, Pending)
 * - Collapsible "Apply for Leave" form with quick reason presets & day calculator
 * - Real-time history tracking of submitted applications with status badges
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
import { LeaveApplication } from '../../types/student';
import { Card, Badge, Button, EmptyState, NotificationBanner } from '../../components/common';

const PRESET_REASONS = [
  'Medical Illness / Doctor Consultation',
  'Family Emergency / Urgent Domestic Affairs',
  'Inter-College Technical Competition',
  'Government Examination / Verification',
];

export default function StudentLeaveScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadLeaves = useCallback(async () => {
    try {
      setErrorMessage(null);
      const res = await studentService.getMyLeaves();
      setLeaves(res);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load leave history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaves();
  };

  /**
   * Calculate duration in days
   */
  const calculateDays = () => {
    if (!fromDate || !toDate) return 0;
    try {
      const d1 = new Date(fromDate);
      const d2 = new Date(toDate);
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : 0;
    } catch {
      return 0;
    }
  };

  const handleApply = async () => {
    const cleanFrom = fromDate.trim();
    const cleanTo = toDate.trim();
    const cleanReason = reason.trim();

    if (!cleanFrom || !cleanTo || !cleanReason) {
      Alert.alert('Incomplete Form', 'Please provide start date, end date, and reason for leave.');
      return;
    }

    if (new Date(cleanTo) < new Date(cleanFrom)) {
      Alert.alert('Invalid Date Range', 'The End Date cannot be earlier than Start Date.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await studentService.applyLeave(cleanFrom, cleanTo, cleanReason);
      setSuccessMessage('Leave application submitted successfully for faculty review!');
      setFromDate('');
      setToDate('');
      setReason('');
      setFormOpen(false);
      await loadLeaves();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Loading leave applications...</Text>
      </View>
    );
  }

  const totalLeaves = leaves.length;
  const approvedLeaves = leaves.filter((l) => l.status === 'APPROVED').length;
  const pendingLeaves = leaves.filter((l) => l.status === 'PENDING').length;
  const daysSelected = calculateDays();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Leave Applications</Text>
          <Text style={styles.headerSubtitle}>Official institutional leave portal</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.colors.primary]} />}
      >
        {errorMessage && (
          <NotificationBanner
            type="error"
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
            style={{ marginBottom: THEME.spacing.md }}
          />
        )}

        {successMessage && (
          <NotificationBanner
            type="success"
            message={successMessage}
            onDismiss={() => setSuccessMessage(null)}
            style={{ marginBottom: THEME.spacing.md }}
          />
        )}

        {/* 3 Summary KPIs */}
        <View style={styles.kpiRow}>
          <Card style={styles.kpiCard}>
            <Text style={styles.kpiVal}>{totalLeaves}</Text>
            <Text style={styles.kpiLabel}>Total Applied</Text>
          </Card>
          <Card style={styles.kpiCard}>
            <Text style={[styles.kpiVal, { color: THEME.colors.success }]}>{approvedLeaves}</Text>
            <Text style={styles.kpiLabel}>Approved</Text>
          </Card>
          <Card style={styles.kpiCard}>
            <Text style={[styles.kpiVal, { color: THEME.colors.warning }]}>{pendingLeaves}</Text>
            <Text style={styles.kpiLabel}>Pending</Text>
          </Card>
        </View>

        {/* Apply for Leave Collapsible Form Card */}
        <Card style={styles.applyCard}>
          <TouchableOpacity
            style={styles.applyToggleRow}
            activeOpacity={0.8}
            onPress={() => setFormOpen((prev) => !prev)}
          >
            <View style={styles.applyToggleLeft}>
              <MaterialCommunityIcons
                name="file-document-edit-outline"
                size={22}
                color={THEME.colors.primary}
              />
              <Text style={styles.applyToggleTitle}>
                {formOpen ? 'Cancel Application' : '+ Submit New Leave Application'}
              </Text>
            </View>
            <MaterialCommunityIcons
              name={formOpen ? 'chevron-up' : 'chevron-down'}
              size={22}
              color={THEME.colors.textMuted}
            />
          </TouchableOpacity>

          {formOpen && (
            <View style={styles.formContainer}>
              <View style={styles.dateInputsRow}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.fieldLabel}>From Date (YYYY-MM-DD):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="2026-09-15"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={fromDate}
                    onChangeText={setFromDate}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.fieldLabel}>To Date (YYYY-MM-DD):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="2026-09-17"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={toDate}
                    onChangeText={setToDate}
                  />
                </View>
              </View>

              {daysSelected > 0 && (
                <View style={styles.daysBadgeRow}>
                  <Badge
                    label={`${daysSelected} ${daysSelected === 1 ? 'Day' : 'Days'} Duration`}
                    variant="info"
                  />
                </View>
              )}

              {/* Quick Preset Reason Chips */}
              <Text style={styles.fieldLabel}>Reason Presets (Tap to fill):</Text>
              <View style={styles.presetChipsRow}>
                {PRESET_REASONS.map((p, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.presetChip}
                    onPress={() => setReason(p)}
                  >
                    <Text style={styles.presetChipText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Detailed Explanation:</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Explain the reason for taking absence in detail..."
                placeholderTextColor={THEME.colors.textMuted}
                multiline
                numberOfLines={3}
                value={reason}
                onChangeText={setReason}
              />

              <Button
                title="Submit Application"
                variant="primary"
                size="md"
                loading={submitting}
                onPress={handleApply}
                style={{ marginTop: 12 }}
              />
            </View>
          )}
        </Card>

        {/* Leave History List */}
        <Text style={styles.historyHeading}>Application History</Text>
        {leaves.length === 0 ? (
          <EmptyState
            title="No Leaves Submitted"
            description="You have not submitted any leave applications yet."
            iconName="file-document-outline"
          />
        ) : (
          leaves.map((item) => {
            const isApp = item.status === 'APPROVED';
            const isRej = item.status === 'REJECTED';
            const badgeVariant = isApp ? 'success' : isRej ? 'danger' : 'warning';

            return (
              <Card key={item.id} style={styles.leaveCard}>
                <View style={styles.leaveHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leaveDates}>
                      {item.from_date} → {item.to_date}
                    </Text>
                    <Text style={styles.leaveDays}>
                      {item.total_days ? `${item.total_days} Days` : 'Applied Period'}
                    </Text>
                  </View>
                  <Badge label={item.status} variant={badgeVariant} />
                </View>

                <Text style={styles.leaveReason}>{item.reason}</Text>

                {item.rejection_reason ? (
                  <View style={styles.rejectBox}>
                    <Text style={styles.rejectHeading}>Rejection Note:</Text>
                    <Text style={styles.rejectText}>{item.rejection_reason}</Text>
                  </View>
                ) : null}

                <View style={styles.leaveFooter}>
                  <Text style={styles.leaveFooterText}>
                    {item.reviewed_by_name ? `Reviewed by ${item.reviewed_by_name}` : 'Awaiting Faculty Advisor Review'}
                  </Text>
                </View>
              </Card>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: THEME.spacing.md,
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  kpiVal: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  kpiLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  applyCard: {
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.sm,
  },
  applyToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 6,
  },
  applyToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  applyToggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  formContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  dateInputsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 8,
    marginBottom: 4,
  },
  daysBadgeRow: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  presetChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  presetChipText: {
    fontSize: 11,
    color: THEME.colors.primary,
    fontWeight: '500',
  },
  historyHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  leaveCard: {
    marginBottom: THEME.spacing.sm,
    padding: THEME.spacing.md,
  },
  leaveHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  leaveDates: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  leaveDays: {
    fontSize: 11,
    color: THEME.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  leaveReason: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    lineHeight: 18,
    marginVertical: 4,
  },
  rejectBox: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: THEME.borderRadius.sm,
    marginTop: 6,
  },
  rejectHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.danger,
  },
  rejectText: {
    fontSize: 12,
    color: THEME.colors.danger,
    marginTop: 2,
  },
  leaveFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
    marginTop: 8,
  },
  leaveFooterText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
});

