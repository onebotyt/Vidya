/**
 * Technical Bug Reporting & Complaint Screen
 * Features:
 * - Technical issue restriction alert
 * - 12 Category selector, issue title, detailed description
 * - Mandatory screenshot upload & optional screen recording via expo-image-picker
 * - Auto-identity collection and "My Reports" tracking tab
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
  Image,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { bugReportService } from '../../services/bugReportService';
import { BugReport, BugReportCategory } from '../../types/bugReport';
import { Card, Badge, Button, EmptyState, NotificationBanner } from '../../components/common';

const BUG_CATEGORIES: BugReportCategory[] = [
  'Login / Authentication Problem',
  'Registration Problem',
  'Dashboard Error',
  'Student Management Error',
  'Faculty Management Error',
  'Attendance Error',
  'Assignment / Notes Error',
  'File Upload / Download Problem',
  'Page Not Loading',
  'Button / Functionality Not Working',
  'UI / Design Problem',
  'Other Technical Issue',
];

export default function StudentBugReportScreen() {
  const router = useRouter();
  const { reportId } = useLocalSearchParams<{ reportId?: string }>();

  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal State (for deep-linking and report inspection)
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Form State
  const [issueTitle, setIssueTitle] = useState('');
  const [issueCategory, setIssueCategory] = useState<BugReportCategory>(BUG_CATEGORIES[0]);
  const [issueDescription, setIssueDescription] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [screenshot, setScreenshot] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  const [recording, setRecording] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  // History State
  const [myReports, setMyReports] = useState<BugReport[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await bugReportService.getMyBugReports();
      setMyReports(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load report history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Deep-link to specific bug report from in-app notification
  useEffect(() => {
    if (reportId && myReports.length > 0) {
      setActiveTab('HISTORY');
      const found = myReports.find(
        (r) => String(r.id) === String(reportId) || r.report_code === reportId
      );
      if (found) {
        setSelectedReport(found);
        setDetailModalOpen(true);
      }
    }
  }, [reportId, myReports]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  /**
   * Pick screenshot image (Mandatory)
   */
  const handlePickScreenshot = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setScreenshot({
          uri: asset.uri,
          name: asset.fileName || `bug_shot_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not pick screenshot image');
    }
  };

  /**
   * Pick optional screen recording
   */
  const handlePickRecording = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setRecording({
          uri: asset.uri,
          name: asset.fileName || `bug_recording_${Date.now()}.mp4`,
          type: asset.mimeType || 'video/mp4',
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not pick screen recording');
    }
  };

  /**
   * Submit Bug Report
   */
  const handleSubmit = async () => {
    const title = issueTitle.trim();
    const desc = issueDescription.trim();

    if (!title) {
      Alert.alert('Missing Field', 'Please enter a brief Issue Title.');
      return;
    }

    if (!desc) {
      Alert.alert('Missing Field', 'Please describe the technical problem you encountered.');
      return;
    }

    if (!screenshot) {
      Alert.alert('Screenshot Required', 'Please attach at least one screenshot demonstrating the bug.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await bugReportService.submitBugReport({
        issue_title: title,
        issue_category: issueCategory,
        issue_description: desc,
        screenshot,
        recording,
      });

      setSuccessMessage('Bug report submitted! System administrators have been notified.');
      setIssueTitle('');
      setIssueDescription('');
      setScreenshot(null);
      setRecording(null);
      setActiveTab('HISTORY');
      await loadReports();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit bug report');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (st: string) => {
    switch (st) {
      case 'Resolved':
        return 'success';
      case 'In Progress':
      case 'Under Review':
        return 'warning';
      case 'Rejected':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Loading bug reporting portal...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Report Technical Issue</Text>
          <Text style={styles.headerSubtitle}>Bug tracking & feedback system</Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'NEW' && styles.tabItemActive]}
          onPress={() => setActiveTab('NEW')}
        >
          <Text style={[styles.tabText, activeTab === 'NEW' && styles.tabTextActive]}>
            Report a Bug
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'HISTORY' && styles.tabItemActive]}
          onPress={() => setActiveTab('HISTORY')}
        >
          <Text style={[styles.tabText, activeTab === 'HISTORY' && styles.tabTextActive]}>
            My Bug Reports ({myReports.length})
          </Text>
        </TouchableOpacity>
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

        {/* ─── TAB 1: NEW REPORT ────────────────────────────────────── */}
        {activeTab === 'NEW' && (
          <View>
            {/* Warning Guideline Banner */}
            <View style={styles.alertNotice}>
              <MaterialCommunityIcons name="information-outline" size={22} color="#DC2626" />
              <Text style={styles.alertNoticeText}>
                This form is strictly for reporting technical errors, malfunctions, and system bugs in VidyaOS. Never use it for marks disputes or academic queries.
              </Text>
            </View>

            <Card style={styles.formCard}>
              {/* Field 1: Issue Title */}
              <Text style={styles.fieldLabel}>Issue Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Login button unresponsive / Attendance QR scan failure"
                placeholderTextColor={THEME.colors.textMuted}
                value={issueTitle}
                onChangeText={setIssueTitle}
              />

              {/* Field 2: Issue Category Dropdown */}
              <Text style={styles.fieldLabel}>Issue Category *</Text>
              <TouchableOpacity
                style={styles.categorySelectBtn}
                activeOpacity={0.8}
                onPress={() => setShowCategoryPicker((prev) => !prev)}
              >
                <Text style={styles.categorySelectText}>{issueCategory}</Text>
                <MaterialCommunityIcons
                  name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={THEME.colors.textMuted}
                />
              </TouchableOpacity>

              {showCategoryPicker && (
                <View style={styles.categoryDropdown}>
                  {BUG_CATEGORIES.map((cat, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.categoryOption,
                        issueCategory === cat && styles.categoryOptionSelected,
                      ]}
                      onPress={() => {
                        setIssueCategory(cat);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          issueCategory === cat && styles.categoryOptionTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Field 3: Problem Description */}
              <Text style={styles.fieldLabel}>Describe the Problem *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe the technical issue, steps to reproduce, and where it happened..."
                placeholderTextColor={THEME.colors.textMuted}
                multiline
                numberOfLines={4}
                value={issueDescription}
                onChangeText={setIssueDescription}
              />

              {/* Field 4: Mandatory Screenshot */}
              <Text style={styles.fieldLabel}>Upload Screenshot (Mandatory) *</Text>
              {screenshot ? (
                <View style={styles.screenshotPreviewContainer}>
                  <Image source={{ uri: screenshot.uri }} style={styles.screenshotImg} resizeMode="cover" />
                  <View style={styles.screenshotMeta}>
                    <Text style={styles.screenshotName} numberOfLines={1}>
                      {screenshot.name}
                    </Text>
                    <TouchableOpacity onPress={() => setScreenshot(null)}>
                      <Text style={styles.removeText}>Remove Screenshot</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadBox}
                  activeOpacity={0.8}
                  onPress={handlePickScreenshot}
                >
                  <MaterialCommunityIcons name="image-plus" size={32} color={THEME.colors.primary} />
                  <Text style={styles.uploadPromptTitle}>Attach Screenshot</Text>
                  <Text style={styles.uploadPromptSub}>PNG, JPG, or JPEG up to 10MB</Text>
                </TouchableOpacity>
              )}

              {/* Field 5: Optional Screen Recording */}
              <Text style={styles.fieldLabel}>Upload Screen Recording (Optional)</Text>
              {recording ? (
                <View style={styles.recordingBox}>
                  <MaterialCommunityIcons name="video-check" size={28} color={THEME.colors.success} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.screenshotName} numberOfLines={1}>
                      {recording.name}
                    </Text>
                    <Text style={styles.uploadPromptSub}>Video attached</Text>
                  </View>
                  <TouchableOpacity onPress={() => setRecording(null)}>
                    <MaterialCommunityIcons name="close-circle" size={20} color={THEME.colors.danger} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.uploadBox, { paddingVertical: 14 }]}
                  activeOpacity={0.8}
                  onPress={handlePickRecording}
                >
                  <MaterialCommunityIcons name="video-plus-outline" size={26} color={THEME.colors.textMuted} />
                  <Text style={[styles.uploadPromptTitle, { fontSize: 13 }]}>Attach Screen Recording</Text>
                  <Text style={styles.uploadPromptSub}>MP4 or WebM format</Text>
                </TouchableOpacity>
              )}

              {/* Submit Button */}
              <Button
                title="Submit Bug Report"
                variant="primary"
                size="lg"
                loading={submitting}
                onPress={handleSubmit}
                style={{ marginTop: THEME.spacing.md }}
              />
            </Card>
          </View>
        )}

        {/* ─── TAB 2: MY BUG REPORTS ───────────────────────────────── */}
        {activeTab === 'HISTORY' && (
          <View>
            {myReports.length === 0 ? (
              <EmptyState
                title="No Bug Reports"
                description="You haven't submitted any technical bug reports yet."
                iconName="bug-check-outline"
              />
            ) : (
              myReports.map((report) => (
                <TouchableOpacity
                  key={report.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedReport(report);
                    setDetailModalOpen(true);
                  }}
                >
                  <Card style={styles.reportCard}>
                    <View style={styles.reportHeader}>
                      <Text style={styles.reportCode}>{report.report_code || `BR-${report.id}`}</Text>
                      <Badge label={report.status} variant={getStatusBadgeVariant(report.status)} />
                    </View>

                    <Text style={styles.reportTitle}>{report.issue_title}</Text>
                    <Text style={styles.reportCategory}>{report.issue_category}</Text>

                    <Text style={styles.reportDesc} numberOfLines={3}>
                      {report.issue_description}
                    </Text>

                    {report.admin_response ? (
                      <View style={styles.adminNoteBox}>
                        <Text style={styles.adminNoteTitle}>Admin Response:</Text>
                        <Text style={styles.adminNoteText}>{report.admin_response}</Text>
                      </View>
                    ) : null}

                    {report.rejection_reason ? (
                      <View style={styles.rejectNoteBox}>
                        <Text style={styles.rejectNoteTitle}>Rejection Reason:</Text>
                        <Text style={styles.rejectNoteText}>{report.rejection_reason}</Text>
                      </View>
                    ) : null}

                    <View style={styles.reportFooter}>
                      <Text style={styles.reportDate}>
                        {report.created_at
                          ? new Date(report.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recently'}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, color: THEME.colors.primary, fontWeight: '600', marginRight: 4 }}>
                          View Details
                        </Text>
                        <MaterialCommunityIcons name="chevron-right" size={16} color={THEME.colors.primary} />
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── DETAIL & RESOLUTION MODAL (Deep-linking) ─────────── */}
      <Modal
        visible={detailModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.modalCode}>
                  {selectedReport?.report_code || (selectedReport ? `BR-${selectedReport.id}` : 'Bug Report')}
                </Text>
                <Text style={styles.modalTitle}>{selectedReport?.issue_title}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDetailModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <MaterialCommunityIcons name="close" size={20} color={THEME.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              {selectedReport && (
                <>
                  <View style={styles.modalMetaRow}>
                    <Badge
                      label={selectedReport.status}
                      variant={getStatusBadgeVariant(selectedReport.status)}
                    />
                    <Text style={styles.modalCategoryBadge}>{selectedReport.issue_category}</Text>
                  </View>

                  {/* Problem Description */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Problem Description</Text>
                    <Text style={styles.modalSectionBody}>{selectedReport.issue_description}</Text>
                  </View>

                  {/* Admin Resolution / Response */}
                  {selectedReport.admin_response ? (
                    <View style={styles.adminResolutionCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <MaterialCommunityIcons name="shield-check" size={16} color={THEME.colors.success} />
                        <Text style={styles.adminResolutionHeader}> Admin Response</Text>
                      </View>
                      <Text style={styles.adminResolutionText}>{selectedReport.admin_response}</Text>
                    </View>
                  ) : null}

                  {/* Rejection Reason */}
                  {selectedReport.rejection_reason ? (
                    <View style={styles.rejectionCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <MaterialCommunityIcons name="alert-circle" size={16} color={THEME.colors.danger} />
                        <Text style={styles.rejectionHeader}> Rejection Reason</Text>
                      </View>
                      <Text style={styles.rejectionText}>{selectedReport.rejection_reason}</Text>
                    </View>
                  ) : null}

                  {/* Attachments */}
                  {(selectedReport.screenshot_url || selectedReport.recording_url) && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Attachments</Text>
                      {selectedReport.screenshot_url && (
                        <TouchableOpacity
                          style={styles.attachmentLinkBtn}
                          onPress={() => {
                            if (selectedReport.screenshot_url) Linking.openURL(selectedReport.screenshot_url);
                          }}
                        >
                          <MaterialCommunityIcons name="image" size={18} color={THEME.colors.primary} />
                          <Text style={styles.attachmentLinkText}>View Screenshot Attachment</Text>
                          <MaterialCommunityIcons name="open-in-new" size={14} color={THEME.colors.primary} />
                        </TouchableOpacity>
                      )}
                      {selectedReport.recording_url && (
                        <TouchableOpacity
                          style={[styles.attachmentLinkBtn, { marginTop: 8 }]}
                          onPress={() => {
                            if (selectedReport.recording_url) Linking.openURL(selectedReport.recording_url);
                          }}
                        >
                          <MaterialCommunityIcons name="video" size={18} color="#7C3AED" />
                          <Text style={[styles.attachmentLinkText, { color: '#7C3AED' }]}>View Screen Recording</Text>
                          <MaterialCommunityIcons name="open-in-new" size={14} color="#7C3AED" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.modalDateText}>
                      Submitted on{' '}
                      {selectedReport.created_at
                        ? new Date(selectedReport.created_at).toLocaleString('en-IN')
                        : 'Recently'}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Close"
                variant="outline"
                size="md"
                onPress={() => setDetailModalOpen(false)}
                style={{ width: '100%' }}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: THEME.colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  tabTextActive: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  alertNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    marginBottom: THEME.spacing.md,
    gap: 8,
  },
  alertNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 18,
    fontWeight: '500',
  },
  formCard: {
    padding: THEME.spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginTop: 10,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  categorySelectBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    height: 42,
  },
  categorySelectText: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    fontWeight: '500',
  },
  categoryDropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    marginTop: 4,
    maxHeight: 200,
    elevation: 3,
  },
  categoryOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryOptionSelected: {
    backgroundColor: '#EEF2FF',
  },
  categoryOptionText: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  categoryOptionTextSelected: {
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surface,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPromptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 6,
  },
  uploadPromptSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  screenshotPreviewContainer: {
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
    backgroundColor: THEME.colors.surface,
  },
  screenshotImg: {
    width: '100%',
    height: 160,
  },
  screenshotMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  screenshotName: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  removeText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.danger,
  },
  recordingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: THEME.borderRadius.md,
    padding: 10,
  },
  reportCard: {
    marginBottom: THEME.spacing.sm,
    padding: THEME.spacing.md,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reportCode: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  reportCategory: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  reportDesc: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    lineHeight: 18,
  },
  adminNoteBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: THEME.borderRadius.sm,
    padding: 8,
    marginTop: 8,
  },
  adminNoteTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.success,
  },
  adminNoteText: {
    fontSize: 12,
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  rejectNoteBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: THEME.borderRadius.sm,
    padding: 8,
    marginTop: 8,
  },
  rejectNoteTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.danger,
  },
  rejectNoteText: {
    fontSize: 12,
    color: THEME.colors.danger,
    marginTop: 2,
  },
  reportFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 10,
  },
  reportDate: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: THEME.borderRadius.lg,
    borderTopRightRadius: THEME.borderRadius.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  modalCode: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScrollContent: {
    padding: THEME.spacing.md,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalCategoryBadge: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalSection: {
    marginBottom: 14,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  modalSectionBody: {
    fontSize: 14,
    color: THEME.colors.textPrimary,
    lineHeight: 20,
  },
  adminResolutionCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    marginBottom: 14,
  },
  adminResolutionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.success,
  },
  adminResolutionText: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    lineHeight: 18,
  },
  rejectionCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    marginBottom: 14,
  },
  rejectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.danger,
  },
  rejectionText: {
    fontSize: 13,
    color: THEME.colors.danger,
    lineHeight: 18,
  },
  attachmentLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 10,
    borderRadius: THEME.borderRadius.md,
    gap: 8,
  },
  attachmentLinkText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  modalDateText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
  },
  modalFooter: {
    padding: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
});

