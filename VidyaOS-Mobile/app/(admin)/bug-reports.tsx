/**
 * Admin Bug Reports & Complaints Management Screen
 * Complete institutional triage console for technical issues.
 * Features:
 * - 6 KPI cards (Total, New, Under Review, In Progress, Resolved, Rejected)
 * - Multi-criteria filtering (Status, Role, Category, Search)
 * - Report cards with attachment badges
 * - Full Report Detail & Triage Modal:
 *   - Submitter KYC details
 *   - Problem description
 *   - Screenshot viewer with full-size launch
 *   - Video screen recording viewer with native playback launch
 *   - Status update dropdown (`New`, `Under Review`, `In Progress`, `Resolved`, `Rejected`)
 *   - Admin resolution note & conditional mandatory rejection reason
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
  Image,
  Linking,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { CONFIG } from '../../constants/config';
import { bugReportService } from '../../services/bugReportService';
import { BugReport, BugReportCategory, BugReportStatus, BugReportStatistics } from '../../types/bugReport';
import { Card, Badge, Button, EmptyState, NotificationBanner } from '../../components/common';

const STATUS_OPTIONS: BugReportStatus[] = [
  'New',
  'Under Review',
  'In Progress',
  'Resolved',
  'Rejected',
];

export default function AdminBugReportsScreen() {
  const router = useRouter();
  const { reportId } = useLocalSearchParams<{ reportId?: string }>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<'ALL' | 'STUDENT' | 'FACULTY'>('ALL');

  const [stats, setStats] = useState<BugReportStatistics>({
    total: 0,
    new_count: 0,
    under_review: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0,
  });

  const [reports, setReports] = useState<BugReport[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Detail & Triage Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<BugReport | null>(null);
  const [actionStatus, setActionStatus] = useState<BugReportStatus>('New');
  const [adminResponse, setAdminResponse] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [savingAction, setSavingAction] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [statsRes, reportsRes] = await Promise.allSettled([
        bugReportService.getAdminStatistics(),
        bugReportService.getAllBugReports({
          status: selectedStatus,
          role: selectedRole,
          search: searchQuery.trim() || undefined,
        }),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load bug reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStatus, selectedRole, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Deep-link to specific bug report from in-app notification
  useEffect(() => {
    if (reportId && reports.length > 0) {
      const found = reports.find(
        (r) => String(r.id) === String(reportId) || r.report_code === reportId
      );
      if (found) {
        handleOpenDetail(found);
      }
    }
  }, [reportId, reports]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Open Manage Detail Modal
  const handleOpenDetail = (report: BugReport) => {
    setActiveReport(report);
    setActionStatus(report.status);
    setAdminResponse(report.admin_response || '');
    setRejectionReason(report.rejection_reason || '');
    setDetailModalOpen(true);
  };

  // Save Status & Admin Notes
  const handleSaveReportStatus = async () => {
    if (!activeReport) return;

    if (actionStatus === 'Rejected' && !rejectionReason.trim()) {
      Alert.alert(
        'Rejection Reason Required',
        'Please enter a reason for rejecting this technical bug report.'
      );
      return;
    }

    setSavingAction(true);
    try {
      await bugReportService.updateReportStatus(activeReport.id, {
        status: actionStatus,
        admin_response: adminResponse.trim() || undefined,
        rejection_reason: actionStatus === 'Rejected' ? rejectionReason.trim() : undefined,
      });

      setDetailModalOpen(false);
      setSuccessMessage(`Updated report ${activeReport.report_code || `#${activeReport.id}`} to ${actionStatus}!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadData();
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not update bug report');
    } finally {
      setSavingAction(false);
    }
  };

  // Open Attachment in Browser / Native Viewer
  const handleOpenUrl = async (rawUrl: string) => {
    try {
      let url = rawUrl;
      if (!url.startsWith('http')) {
        url = `${CONFIG.API_BASE_URL.replace('/api/v1', '')}/${rawUrl.replace(/^\/+/, '')}`;
      }
      await Linking.openURL(url);
    } catch (err: any) {
      Alert.alert('Cannot Open File', err?.message || 'Unable to open attachment link');
    }
  };

  const getStatusBadgeVariant = (status: BugReportStatus) => {
    switch (status) {
      case 'Resolved':
        return 'success';
      case 'New':
        return 'danger';
      case 'Under Review':
      case 'In Progress':
        return 'warning';
      case 'Rejected':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Bug Reports & Triage</Text>
          <Text style={styles.headerSubtitle}>Technical Errors & Malfunctions Console</Text>
        </View>
        <TouchableOpacity style={styles.refreshIconBtn} onPress={onRefresh}>
          <MaterialCommunityIcons name="refresh" size={20} color="#7C3AED" />
        </TouchableOpacity>
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
        {successMessage && (
          <NotificationBanner
            type="info"
            message={successMessage}
            onDismiss={() => setSuccessMessage(null)}
            style={{ marginBottom: 12 }}
          />
        )}

        {/* 6 KPI Cards Row */}
        <Text style={styles.sectionHeading}>Report Telemetry</Text>
        <View style={styles.kpiRow}>
          <Card variant="elevated" style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{stats.total}</Text>
            <Text style={styles.kpiLabel}>Total</Text>
          </Card>
          <Card variant="elevated" style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#DC2626' }]}>{stats.new_count}</Text>
            <Text style={styles.kpiLabel}>New</Text>
          </Card>
          <Card variant="elevated" style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#D97706' }]}>{stats.under_review + stats.in_progress}</Text>
            <Text style={styles.kpiLabel}>In Progress</Text>
          </Card>
          <Card variant="elevated" style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#059669' }]}>{stats.resolved}</Text>
            <Text style={styles.kpiLabel}>Resolved</Text>
          </Card>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports by title, submitter, ID..."
            placeholderTextColor={THEME.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {['ALL', 'New', 'Under Review', 'In Progress', 'Resolved', 'Rejected'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, selectedStatus === status && styles.filterChipActive]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={[styles.filterChipText, selectedStatus === status && styles.filterChipTextActive]}>
                {status === 'ALL' ? 'All Statuses' : status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Role Filter Chips */}
        <View style={styles.roleChipsRow}>
          {(['ALL', 'STUDENT', 'FACULTY'] as const).map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.roleChip, selectedRole === role && styles.roleChipActive]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={[styles.roleChipText, selectedRole === role && styles.roleChipTextActive]}>
                {role === 'ALL' ? 'All Submitter Roles' : `${role} Reports`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading Spinner */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading bug reports feed...</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && reports.length === 0 && (
          <EmptyState
            icon="shield-bug-outline"
            title="No Bug Reports Found"
            description={
              searchQuery
                ? `No reports match "${searchQuery}".`
                : 'No unresolved technical issues found in this category.'
            }
          />
        )}

        {/* Reports Feed */}
        {!loading &&
          reports.map((report) => {
            const hasScreenshot = Boolean(report.screenshot_url);
            const hasVideo = Boolean(report.recording_url);

            return (
              <Card key={report.id} variant="elevated" style={styles.reportCard}>
                <View style={styles.reportCardHeader}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      {report.report_code && (
                        <View style={styles.codeBadge}>
                          <Text style={styles.codeBadgeText}>{report.report_code}</Text>
                        </View>
                      )}
                      <Text style={styles.reportCategory}>{report.issue_category}</Text>
                    </View>
                    <Text style={styles.reportTitle}>{report.issue_title}</Text>
                  </View>
                  <Badge label={report.status} variant={getStatusBadgeVariant(report.status)} />
                </View>

                {/* Submitter Info */}
                <View style={styles.submitterRow}>
                  <MaterialCommunityIcons name="account-outline" size={14} color={THEME.colors.textMuted} />
                  <Text style={styles.submitterText}>
                    {report.user_name} ({report.user_role}) • {report.department_name || 'General'}
                  </Text>
                </View>

                {/* Problem snippet */}
                <Text style={styles.descriptionSnippet} numberOfLines={2}>
                  {report.issue_description}
                </Text>

                {/* Attachments & Action Footer */}
                <View style={styles.reportFooter}>
                  <View style={styles.attachmentsRow}>
                    {hasScreenshot && (
                      <View style={styles.attachBadge}>
                        <MaterialCommunityIcons name="camera" size={12} color="#059669" />
                        <Text style={styles.attachBadgeText}>Screenshot</Text>
                      </View>
                    )}
                    {hasVideo && (
                      <View style={[styles.attachBadge, { backgroundColor: '#EFF6FF' }]}>
                        <MaterialCommunityIcons name="video" size={12} color="#2563EB" />
                        <Text style={[styles.attachBadgeText, { color: '#2563EB' }]}>Video</Text>
                      </View>
                    )}
                  </View>

                  <Button
                    title="Review & Triage →"
                    size="sm"
                    variant="primary"
                    onPress={() => handleOpenDetail(report)}
                  />
                </View>
              </Card>
            );
          })}
      </ScrollView>

      {/* Full Report Detail & Triage Modal */}
      <Modal
        visible={detailModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Bug Report Triage</Text>
                <Text style={styles.modalSubtitle}>
                  {activeReport?.report_code || `#${activeReport?.id}`} • {activeReport?.issue_category}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              {activeReport && (
                <>
                  {/* Submitter Dossier */}
                  <Card variant="outlined" style={styles.dossierCard}>
                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierLabel}>Submitter:</Text>
                      <Text style={styles.dossierVal}>{activeReport.user_name}</Text>
                    </View>
                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierLabel}>Role / Email:</Text>
                      <Text style={styles.dossierVal}>
                        {activeReport.user_role} • {activeReport.user_email}
                      </Text>
                    </View>
                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierLabel}>Department:</Text>
                      <Text style={styles.dossierVal}>{activeReport.department_name || 'N/A'}</Text>
                    </View>
                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierLabel}>Submitted At:</Text>
                      <Text style={styles.dossierVal}>{activeReport.created_at}</Text>
                    </View>
                  </Card>

                  {/* Title & Description */}
                  <Text style={styles.detailSectionHeading}>Issue Title</Text>
                  <Text style={styles.detailTitleText}>{activeReport.issue_title}</Text>

                  <Text style={styles.detailSectionHeading}>Problem Description</Text>
                  <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionFull}>{activeReport.issue_description}</Text>
                  </View>

                  {/* Screenshot Preview */}
                  {activeReport.screenshot_url && (
                    <View style={styles.attachmentSection}>
                      <Text style={styles.detailSectionHeading}>Mandatory Screenshot Attachment</Text>
                      <TouchableOpacity
                        style={styles.imagePreviewWrap}
                        onPress={() => handleOpenUrl(activeReport.screenshot_url)}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{
                            uri: activeReport.screenshot_url.startsWith('http')
                              ? activeReport.screenshot_url
                              : `${CONFIG.API_BASE_URL.replace('/api/v1', '')}/${activeReport.screenshot_url.replace(/^\/+/, '')}`,
                          }}
                          style={styles.screenshotImage}
                          resizeMode="contain"
                        />
                        <View style={styles.expandOverlay}>
                          <MaterialCommunityIcons name="arrow-expand" size={16} color="#FFFFFF" />
                          <Text style={styles.expandText}>Tap to Open Full Size</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Screen Recording Preview */}
                  {activeReport.recording_url && (
                    <View style={styles.attachmentSection}>
                      <Text style={styles.detailSectionHeading}>Screen Recording (Video)</Text>
                      <TouchableOpacity
                        style={styles.videoCard}
                        onPress={() => handleOpenUrl(activeReport.recording_url!)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="play-circle" size={36} color="#2563EB" />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.videoTitle}>Watch Screen Recording</Text>
                          <Text style={styles.videoSub}>Tap to launch video player in browser</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Triage Decision Section */}
                  <Text style={[styles.detailSectionHeading, { marginTop: 16 }]}>Update Status</Text>
                  <View style={styles.statusOptionsRow}>
                    {STATUS_OPTIONS.map((opt) => {
                      const isSelected = actionStatus === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.statusOptionChip, isSelected && styles.statusOptionChipSelected]}
                          onPress={() => setActionStatus(opt)}
                        >
                          <Text style={[styles.statusOptionText, isSelected && styles.statusOptionTextActive]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Admin Resolution Note */}
                  <Text style={styles.detailSectionHeading}>Admin Response / Resolution Note</Text>
                  <TextInput
                    style={styles.modalTextArea}
                    placeholder="Provide details on how the issue was fixed, or steps taken..."
                    placeholderTextColor={THEME.colors.textMuted}
                    multiline={true}
                    numberOfLines={4}
                    value={adminResponse}
                    onChangeText={setAdminResponse}
                  />

                  {/* Rejection Reason (Mandatory if Rejected) */}
                  {actionStatus === 'Rejected' && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={[styles.detailSectionHeading, { color: '#DC2626' }]}>
                        Rejection Reason *
                      </Text>
                      <TextInput
                        style={[styles.modalTextArea, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}
                        placeholder="State why this report was rejected (e.g. invalid report, non-technical query, not reproducible)..."
                        placeholderTextColor={THEME.colors.textMuted}
                        multiline={true}
                        numberOfLines={3}
                        value={rejectionReason}
                        onChangeText={setRejectionReason}
                      />
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setDetailModalOpen(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={savingAction ? 'Saving Changes...' : 'Save & Update'}
                variant="primary"
                onPress={handleSaveReportStatus}
                loading={savingAction}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  refreshIconBtn: {
    padding: 8,
  },
  content: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: THEME.spacing.md,
  },
  kpiCard: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  kpiLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radii.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
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
  roleChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: THEME.spacing.md,
  },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radii.sm,
    backgroundColor: '#F1F5F9',
  },
  roleChipActive: {
    backgroundColor: '#DDD6FE',
  },
  roleChipText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  roleChipTextActive: {
    color: '#7C3AED',
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
  reportCard: {
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  codeBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radii.sm,
  },
  codeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
  },
  reportCategory: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  submitterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 6,
  },
  submitterText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  descriptionSnippet: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
    marginBottom: 10,
  },
  reportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  attachmentsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  attachBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radii.sm,
    gap: 4,
  },
  attachBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
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
    maxHeight: '92%',
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
  dossierCard: {
    padding: 10,
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },
  dossierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  dossierLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  dossierVal: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  detailSectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 10,
    marginBottom: 4,
  },
  detailTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  descriptionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.radii.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  descriptionFull: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    lineHeight: 18,
  },
  attachmentSection: {
    marginTop: 10,
  },
  imagePreviewWrap: {
    borderRadius: THEME.radii.md,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenshotImage: {
    width: '100%',
    height: '100%',
  },
  expandOverlay: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radii.sm,
    gap: 4,
  },
  expandText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  videoSub: {
    fontSize: 10,
    color: '#3B82F6',
  },
  statusOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  statusOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radii.full,
    backgroundColor: '#F1F5F9',
  },
  statusOptionChipSelected: {
    backgroundColor: '#7C3AED',
  },
  statusOptionText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  statusOptionTextActive: {
    color: '#FFFFFF',
  },
  modalTextArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.md,
    padding: 10,
    fontSize: 13,
    color: THEME.colors.textPrimary,
    textAlignVertical: 'top',
    height: 80,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: THEME.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
});
