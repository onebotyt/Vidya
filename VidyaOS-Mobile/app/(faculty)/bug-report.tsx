/**
 * Faculty Technical Bug Reporting & Complaint Screen
 * Features:
 * - Technical restriction warning banner
 * - 12 Category selector, issue title, detailed description
 * - Mandatory screenshot upload & optional screen recording via expo-image-picker
 * - Auto-collected submitter profile
 * - "My Reports" tracking tab
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
import { useAuth } from '../../hooks/useAuth';
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

export default function FacultyBugReportScreen() {
  const router = useRouter();
  const { user } = useAuth();
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

  // Pick Mandatory Screenshot
  const handlePickScreenshot = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera roll permission is required to attach a screenshot.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const filename = asset.fileName || `screenshot_${Date.now()}.jpg`;
        setScreenshot({
          uri: asset.uri,
          name: filename,
          type: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to pick screenshot');
    }
  };

  // Pick Optional Video Recording
  const handlePickRecording = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera roll permission is required to attach a video recording.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const filename = asset.fileName || `recording_${Date.now()}.mp4`;
        setRecording({
          uri: asset.uri,
          name: filename,
          type: asset.mimeType || 'video/mp4',
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to pick video recording');
    }
  };

  // Submit Bug Report
  const handleSubmitReport = async () => {
    if (!issueTitle.trim()) {
      Alert.alert('Required Field', 'Please provide an Issue Title describing the technical problem.');
      return;
    }

    if (!issueDescription.trim()) {
      Alert.alert('Required Field', 'Please describe the technical problem in detail.');
      return;
    }

    if (!screenshot) {
      Alert.alert(
        'Screenshot Mandatory',
        'At least one screenshot demonstrating the error or malfunction is required before submission.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await bugReportService.submitBugReport({
        issue_title: issueTitle.trim(),
        issue_category: issueCategory,
        issue_description: issueDescription.trim(),
        screenshot,
        recording,
      });

      // Reset form
      setIssueTitle('');
      setIssueCategory(BUG_CATEGORIES[0]);
      setIssueDescription('');
      setScreenshot(null);
      setRecording(null);

      setSuccessMessage('Bug report submitted successfully! The engineering team will review it.');
      setActiveTab('HISTORY');
      await loadReports();
    } catch (err: any) {
      Alert.alert('Submission Failed', err?.message || 'Could not submit bug report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 6 }}>
          <Text style={styles.headerTitle}>Report a Technical Problem</Text>
          <Text style={styles.headerSubtitle}>VidyaOS Bug Reporting & Issue Resolution</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'NEW' && styles.tabButtonActive]}
          onPress={() => setActiveTab('NEW')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'NEW' && styles.tabTextActive]}>
            Submit Report
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'HISTORY' && styles.tabButtonActive]}
          onPress={() => setActiveTab('HISTORY')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'HISTORY' && styles.tabTextActive]}>
            My Reports ({myReports.length})
          </Text>
        </TouchableOpacity>
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

        {/* ═══ TAB 1: NEW REPORT ═══ */}
        {activeTab === 'NEW' && (
          <View>
            {/* Strict Notice Banner */}
            <Card variant="elevated" style={styles.noticeCard}>
              <View style={styles.noticeHeader}>
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#2563EB" />
                <Text style={styles.noticeTitle}>Technical Issues Only</Text>
              </View>
              <Text style={styles.noticeText}>
                IMPORTANT: This system is exclusively for reporting technical problems, software bugs, errors,
                and malfunctions occurring within the VidyaOS application. It must not be used for general
                complaints, personal issues, academic complaints, or unrelated matters.
              </Text>
            </Card>

            {/* Auto-Collected Submitter Profile */}
            <Card variant="outlined" style={styles.profileSnippet}>
              <View style={styles.snippetRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.snippetLabel}>Reporting Account</Text>
                  <Text style={styles.snippetValue}>{user?.full_name || 'Faculty Member'}</Text>
                  <Text style={styles.snippetSub}>
                    Role: {user?.role || 'TEACHER'} • {user?.department_name || 'Department'}
                  </Text>
                </View>
                <Badge label="Auto-Collected" variant="info" />
              </View>
            </Card>

            {/* Form Fields */}
            <Text style={styles.inputLabel}>Issue Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Attendance session PIN generation failing on mobile"
              placeholderTextColor={THEME.colors.textMuted}
              value={issueTitle}
              onChangeText={setIssueTitle}
            />

            {/* Category Dropdown */}
            <Text style={styles.inputLabel}>Issue Category *</Text>
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              activeOpacity={0.7}
            >
              <Text style={styles.categorySelectorText}>{issueCategory}</Text>
              <MaterialCommunityIcons
                name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={THEME.colors.textMuted}
              />
            </TouchableOpacity>

            {showCategoryPicker && (
              <View style={styles.categoryDropdown}>
                {BUG_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryOption, issueCategory === cat && styles.categoryOptionActive]}
                    onPress={() => {
                      setIssueCategory(cat);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        issueCategory === cat && styles.categoryOptionTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Problem Description */}
            <Text style={styles.inputLabel}>Describe the Problem *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the technical issue you are experiencing in detail..."
              placeholderTextColor={THEME.colors.textMuted}
              multiline={true}
              numberOfLines={5}
              value={issueDescription}
              onChangeText={setIssueDescription}
            />

            {/* Screenshot Upload (Mandatory) */}
            <Text style={styles.inputLabel}>Upload Screenshot (Mandatory) *</Text>
            {screenshot ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: screenshot.uri }} style={styles.screenshotPreview} resizeMode="cover" />
                <View style={styles.previewActions}>
                  <Text style={styles.previewFilename} numberOfLines={1}>
                    {screenshot.name}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <TouchableOpacity style={styles.replaceBtn} onPress={handlePickScreenshot}>
                      <Text style={styles.replaceBtnText}>Replace</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeBtn} onPress={() => setScreenshot(null)}>
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadBox} onPress={handlePickScreenshot} activeOpacity={0.8}>
                <MaterialCommunityIcons name="camera-plus-outline" size={32} color="#059669" />
                <Text style={styles.uploadBoxTitle}>Attach Screenshot</Text>
                <Text style={styles.uploadBoxSubtitle}>PNG, JPG, or JPEG required before submission</Text>
              </TouchableOpacity>
            )}

            {/* Screen Recording Upload (Optional) */}
            <Text style={styles.inputLabel}>Upload Screen Recording (Optional)</Text>
            {recording ? (
              <View style={styles.recordingCard}>
                <MaterialCommunityIcons name="video" size={24} color="#2563EB" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.recordingName} numberOfLines={1}>
                    {recording.name}
                  </Text>
                  <Text style={styles.recordingSub}>Video recording attached</Text>
                </View>
                <TouchableOpacity onPress={() => setRecording(null)}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadBoxSecondary} onPress={handlePickRecording} activeOpacity={0.8}>
                <MaterialCommunityIcons name="video-plus-outline" size={24} color={THEME.colors.textMuted} />
                <Text style={styles.uploadBoxSecondaryText}>Attach Screen Recording (MP4 / WebM)</Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <Button
              title={submitting ? 'Submitting Report...' : 'Submit Bug Report'}
              variant="primary"
              icon="send"
              onPress={handleSubmitReport}
              loading={submitting}
              style={{ marginTop: 24, marginBottom: 20 }}
            />
          </View>
        )}

        {/* ═══ TAB 2: MY BUG REPORTS HISTORY ═══ */}
        {activeTab === 'HISTORY' && (
          <View>
            {loading ? (
              <ActivityIndicator size="large" color={THEME.colors.primary} style={{ marginTop: 30 }} />
            ) : myReports.length === 0 ? (
              <EmptyState
                icon="shield-bug-outline"
                title="No Reports Filed"
                description="You have not submitted any technical bug reports. If you encounter an issue, file a report using the Submit tab."
              />
            ) : (
              myReports.map((report) => {
                const isResolved = report.status === 'Resolved';
                const isClosed = report.status === 'Rejected';
                const isInReview = report.status === 'Under Review' || report.status === 'In Progress';

                return (
                  <TouchableOpacity
                    key={report.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedReport(report);
                      setDetailModalOpen(true);
                    }}
                  >
                    <Card variant="elevated" style={styles.reportCard}>
                      <View style={styles.reportHeader}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.reportTitle}>{report.issue_title}</Text>
                          <Text style={styles.reportCategory}>{report.issue_category}</Text>
                        </View>
                        <Badge
                          label={report.status}
                          variant={
                            isResolved ? 'success' : isInReview ? 'info' : isClosed ? 'danger' : 'warning'
                          }
                        />
                      </View>

                      <Text style={styles.reportDescription}>{report.issue_description}</Text>

                      {(report.admin_response || report.rejection_reason) && (
                        <View style={styles.resolutionBox}>
                          <Text style={styles.resolutionLabel}>Resolution Notes:</Text>
                          <Text style={styles.resolutionText}>
                            {report.admin_response || report.rejection_reason}
                          </Text>
                        </View>
                      )}

                      <View style={styles.reportFooter}>
                        <Text style={styles.reportDate}>
                          Submitted {report.created_at || 'Recently'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {report.screenshot_url && (
                            <View style={styles.attachmentChip}>
                              <MaterialCommunityIcons name="attachment" size={12} color="#059669" />
                              <Text style={styles.attachmentChipText}>Screenshot</Text>
                            </View>
                          )}
                          <Text style={{ fontSize: 12, color: THEME.colors.primary, fontWeight: '600' }}>
                            Details
                          </Text>
                          <MaterialCommunityIcons name="chevron-right" size={16} color={THEME.colors.primary} />
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
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
                      variant={
                        selectedReport.status === 'Resolved'
                          ? 'success'
                          : selectedReport.status === 'Under Review' || selectedReport.status === 'In Progress'
                          ? 'info'
                          : selectedReport.status === 'Rejected'
                          ? 'danger'
                          : 'warning'
                      }
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#059669',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  tabTextActive: {
    color: '#059669',
  },
  content: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  noticeCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  noticeText: {
    fontSize: 11,
    color: '#1E3A8A',
    lineHeight: 16,
  },
  profileSnippet: {
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  snippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snippetLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
  },
  snippetValue: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  snippetSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  categorySelectorText: {
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  categoryDropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.md,
    marginTop: 4,
    maxHeight: 220,
    overflow: 'hidden',
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryOptionActive: {
    backgroundColor: '#ECFDF5',
  },
  categoryOptionText: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  categoryOptionTextActive: {
    color: '#059669',
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.md,
    padding: 12,
    fontSize: 14,
    color: THEME.colors.textPrimary,
    textAlignVertical: 'top',
    height: 110,
  },
  uploadBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#D1FAE5',
    borderStyle: 'dashed',
    borderRadius: THEME.radii.md,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBoxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginTop: 6,
  },
  uploadBoxSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 8,
  },
  screenshotPreview: {
    width: 60,
    height: 60,
    borderRadius: THEME.radii.sm,
  },
  previewActions: {
    flex: 1,
    marginLeft: 10,
  },
  previewFilename: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  replaceBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radii.sm,
  },
  replaceBtnText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },
  removeBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radii.sm,
  },
  removeBtnText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  uploadBoxSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.md,
    paddingVertical: 12,
    gap: 8,
  },
  uploadBoxSecondaryText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  recordingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  recordingName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  recordingSub: {
    fontSize: 10,
    color: '#3B82F6',
  },
  reportCard: {
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  reportCategory: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  reportDescription: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    lineHeight: 18,
    marginBottom: 8,
  },
  resolutionBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: THEME.radii.sm,
    padding: 8,
    marginBottom: 8,
  },
  resolutionLabel: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  resolutionText: {
    fontSize: 12,
    color: '#065F46',
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  reportDate: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radii.sm,
    gap: 4,
  },
  attachmentChipText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: THEME.radii.lg,
    borderTopRightRadius: THEME.radii.lg,
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
    borderRadius: THEME.radii.md,
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
    borderRadius: THEME.radii.md,
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
    borderRadius: THEME.radii.md,
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
