/**
 * Faculty Leave Approvals Screen
 * Review and decide student leave applications across the department cohort.
 * Features:
 * - Summary KPI cards (Pending, Approved, Rejected)
 * - Status filter tabs
 * - Detailed leave request dossier
 * - Approve with confirmation
 * - Reject with mandatory review note modal
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
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { facultyService } from '../../services/facultyService';
import { FacultyLeaveItem } from '../../types/faculty';
import { Card, Badge, Button, EmptyState, NotificationBanner, ConfirmDialog } from '../../components/common';

export default function LeaveApprovalsScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');

  const [leaves, setLeaves] = useState<FacultyLeaveItem[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Approve Dialog State
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<FacultyLeaveItem | null>(null);
  const [approving, setApproving] = useState(false);

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const loadLeaves = useCallback(async () => {
    try {
      setErrorMessage(null);
      const res = await facultyService.getDepartmentLeaves();
      setLeaves(res.leaves || []);
      setCounts(res.counts || { pending: 0, approved: 0, rejected: 0 });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load leave requests');
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

  // Approve Action
  const handleConfirmApprove = async () => {
    if (!selectedLeave) return;
    setApproving(true);
    try {
      await facultyService.decideLeave(selectedLeave.id, 'APPROVED');
      setApproveDialogOpen(false);
      setSuccessMessage(`Approved leave for ${selectedLeave.student_name}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadLeaves();
    } catch (err: any) {
      Alert.alert('Approve Failed', err?.message || 'Failed to approve leave request');
    } finally {
      setApproving(false);
      setSelectedLeave(null);
    }
  };

  // Reject Action
  const handleConfirmReject = async () => {
    if (!selectedLeave) return;
    if (!rejectNote.trim()) {
      Alert.alert('Required Note', 'Please provide a brief reason for rejecting this leave request.');
      return;
    }
    setRejecting(true);
    try {
      await facultyService.decideLeave(selectedLeave.id, 'REJECTED', rejectNote.trim());
      setRejectModalOpen(false);
      setRejectNote('');
      setSuccessMessage(`Rejected leave request for ${selectedLeave.student_name}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadLeaves();
    } catch (err: any) {
      Alert.alert('Reject Failed', err?.message || 'Failed to reject leave request');
    } finally {
      setRejecting(false);
      setSelectedLeave(null);
    }
  };

  // Filter leaves
  const filteredLeaves = leaves.filter((item) => {
    if (activeTab === 'ALL') return true;
    return item.status === activeTab;
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 6 }}>
          <Text style={styles.headerTitle}>Leave Approvals</Text>
          <Text style={styles.headerSubtitle}>Student Absence Requests & Medical Slips</Text>
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
        {successMessage && (
          <NotificationBanner
            type="info"
            message={successMessage}
            onDismiss={() => setSuccessMessage(null)}
            style={{ marginBottom: 12 }}
          />
        )}

        {/* Telemetry KPI Cards */}
        <View style={styles.kpiRow}>
          <Card variant="elevated" style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#D97706' }]}>{counts.pending}</Text>
            <Text style={styles.kpiLabel}>Pending</Text>
          </Card>
          <Card variant="elevated" style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#059669' }]}>{counts.approved}</Text>
            <Text style={styles.kpiLabel}>Approved</Text>
          </Card>
          <Card variant="elevated" style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#DC2626' }]}>{counts.rejected}</Text>
            <Text style={styles.kpiLabel}>Rejected</Text>
          </Card>
        </View>

        {/* Status Filter Tabs */}
        <View style={styles.filterChipsRow}>
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => {
            const count =
              tab === 'PENDING'
                ? counts.pending
                : tab === 'APPROVED'
                ? counts.approved
                : tab === 'REJECTED'
                ? counts.rejected
                : leaves.length;

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterChip, activeTab === tab && styles.filterChipActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, activeTab === tab && styles.filterChipTextActive]}>
                  {tab === 'PENDING'
                    ? `Pending (${count})`
                    : tab === 'APPROVED'
                    ? `Approved (${count})`
                    : tab === 'REJECTED'
                    ? `Rejected (${count})`
                    : `All (${count})`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Loading Spinner */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.loadingText}>Loading leave applications...</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && filteredLeaves.length === 0 && (
          <EmptyState
            icon="calendar-check-outline"
            title="No Leave Requests"
            description={
              activeTab === 'PENDING'
                ? 'Great job! There are no student leave requests currently pending your approval.'
                : `No leave applications found in "${activeTab}" category.`
            }
          />
        )}

        {/* Leave Cards List */}
        {!loading &&
          filteredLeaves.map((item) => {
            const isPending = item.status === 'PENDING';
            const isApproved = item.status === 'APPROVED';

            return (
              <Card key={item.id} variant="elevated" style={styles.leaveCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.studentName}>{item.student_name}</Text>
                    <Text style={styles.studentMeta}>
                      Roll #{item.class_roll_no || '--'} • {item.official_enrollment_no || 'No Enrollment'}
                    </Text>
                  </View>
                  <Badge
                    label={item.status}
                    variant={isApproved ? 'success' : isPending ? 'warning' : 'danger'}
                  />
                </View>

                {/* Duration & Dates */}
                <View style={styles.dateRow}>
                  <MaterialCommunityIcons name="calendar-range" size={16} color={THEME.colors.primary} />
                  <Text style={styles.dateText}>
                    {item.from_date} ➔ {item.to_date}
                  </Text>
                  {item.total_days !== undefined && (
                    <View style={styles.daysBadge}>
                      <Text style={styles.daysBadgeText}>
                        {item.total_days} Day{item.total_days > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Reason */}
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonLabel}>Application Reason:</Text>
                  <Text style={styles.reasonText}>{item.reason}</Text>
                </View>

                {/* Rejection Note Display */}
                {item.status === 'REJECTED' && item.rejection_reason && (
                  <View style={styles.rejectionBox}>
                    <Text style={styles.rejectionLabel}>Faculty Review Note:</Text>
                    <Text style={styles.rejectionText}>{item.rejection_reason}</Text>
                  </View>
                )}

                {/* Decision Action Buttons */}
                {isPending && (
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => {
                        setSelectedLeave(item);
                        setApproveDialogOpen(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                      <Text style={styles.approveBtnText}>Approve Leave</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => {
                        setSelectedLeave(item);
                        setRejectNote('');
                        setRejectModalOpen(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            );
          })}
      </ScrollView>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        visible={approveDialogOpen}
        title="Approve Leave Request"
        message={`Are you sure you want to approve the leave application for ${selectedLeave?.student_name} (${selectedLeave?.from_date} to ${selectedLeave?.to_date})?`}
        confirmText={approving ? 'Approving...' : 'Yes, Approve'}
        cancelText="Cancel"
        variant="primary"
        onConfirm={handleConfirmApprove}
        onCancel={() => setApproveDialogOpen(false)}
      />

      {/* Reject Reason Modal */}
      <Modal
        visible={rejectModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRejectModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Reject Leave Request</Text>
                <Text style={styles.modalSubtitle}>Provide a feedback note for the student</Text>
              </View>
              <TouchableOpacity onPress={() => setRejectModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Reason for Rejection *</Text>
              <TextInput
                style={styles.modalTextArea}
                placeholder="e.g. Attendance is currently below 65%, exam week scheduled, or missing medical certificate."
                placeholderTextColor={THEME.colors.textMuted}
                multiline={true}
                numberOfLines={4}
                value={rejectNote}
                onChangeText={setRejectNote}
              />
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setRejectModalOpen(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={rejecting ? 'Rejecting...' : 'Confirm Rejection'}
                variant="danger"
                onPress={handleConfirmReject}
                loading={rejecting}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: THEME.spacing.md,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: THEME.spacing.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radii.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  filterChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterChipText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
  leaveCard: {
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  studentMeta: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    flex: 1,
  },
  daysBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.radii.sm,
  },
  daysBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  reasonBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: THEME.radii.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reasonLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    lineHeight: 18,
  },
  rejectionBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: THEME.radii.sm,
    padding: 10,
    marginTop: 8,
  },
  rejectionLabel: {
    fontSize: 10,
    color: '#DC2626',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  rejectionText: {
    fontSize: 12,
    color: '#991B1B',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: THEME.radii.md,
    gap: 6,
  },
  approveBtn: {
    backgroundColor: '#059669',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  rejectBtn: {
    backgroundColor: '#DC2626',
  },
  rejectBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: THEME.radii.lg,
    borderTopRightRadius: THEME.radii.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  modalBody: {
    padding: THEME.spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  modalTextArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.md,
    padding: 12,
    fontSize: 14,
    color: THEME.colors.textPrimary,
    textAlignVertical: 'top',
    height: 100,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: THEME.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
});

