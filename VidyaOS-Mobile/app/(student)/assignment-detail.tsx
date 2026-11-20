/**
 * Student Assignment Details & Submission Screen
 * Native Google Classroom style layout:
 * - Coursework instructions, points, and teacher attachments
 * - Native file picker via expo-document-picker and expo-image-picker
 * - Multi-state "Your Work": Assigned -> Turned in -> Unsubmit with ConfirmDialog
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
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { studentService } from '../../services/studentService';
import { Assignment } from '../../types/student';
import { Card, Badge, Button, ConfirmDialog, NotificationBanner } from '../../components/common';

export default function StudentAssignmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const assignmentId = Number(id);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [unsubmitting, setUnsubmitting] = useState(false);
  const [showUnsubmitDialog, setShowUnsubmitDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [assignment, setAssignment] = useState<Assignment | null>(null);

  // Staged local file for submission
  const [stagedFile, setStagedFile] = useState<{
    uri: string;
    name: string;
    type: string;
    size?: number;
  } | null>(null);

  const loadAssignment = useCallback(async () => {
    if (!assignmentId) return;
    try {
      setErrorMessage(null);
      const data = await studentService.getAssignmentDetail(assignmentId);
      setAssignment(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load assignment details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadAssignment();
  }, [loadAssignment]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAssignment();
  };

  /**
   * Pick document/PDF file via expo-document-picker
   */
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setStagedFile({
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/pdf',
          size: file.size,
        });
      }
    } catch (err: any) {
      Alert.alert('File Picker Error', err?.message || 'Could not select document');
    }
  };

  /**
   * Pick or take photo via expo-image-picker
   */
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const img = result.assets[0];
        const name = img.fileName || `submission_${Date.now()}.jpg`;
        setStagedFile({
          uri: img.uri,
          name,
          type: img.mimeType || 'image/jpeg',
        });
      }
    } catch (err: any) {
      Alert.alert('Image Picker Error', err?.message || 'Could not select photo');
    }
  };

  /**
   * Turn in work
   */
  const handleTurnIn = async () => {
    if (!stagedFile) {
      Alert.alert('No File Attached', 'Please attach your assignment PDF or photo before turning in.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await studentService.submitAssignment(assignmentId, stagedFile);
      setSuccessMessage('Assignment turned in successfully!');
      setStagedFile(null);
      await loadAssignment();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to turn in assignment');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Unsubmit work
   */
  const handleConfirmUnsubmit = async () => {
    try {
      setUnsubmitting(true);
      setShowUnsubmitDialog(false);
      setErrorMessage(null);
      await studentService.unsubmitAssignment(assignmentId);
      setSuccessMessage('Assignment unsubmitted. You can now re-attach your updated file.');
      await loadAssignment();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to unsubmit assignment');
    } finally {
      setUnsubmitting(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Opening assignment...</Text>
      </View>
    );
  }

  const isSubmitted = Boolean(assignment?.my_submission?.is_submitted);
  const isTest = assignment?.item_kind === 'TEST';

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {assignment?.title || 'Assignment'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {assignment?.group_name || 'Classwork Course'}
          </Text>
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

        {/* Work Header Card */}
        <Card style={styles.detailCard}>
          <View style={styles.titleRow}>
            <View
              style={[
                styles.itemKindBox,
                { backgroundColor: isTest ? '#FEE2E2' : '#EEF2FF' },
              ]}
            >
              <MaterialCommunityIcons
                name={isTest ? 'alert-decagram' : 'clipboard-text-outline'}
                size={24}
                color={isTest ? THEME.colors.danger : THEME.colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.workTitle}>{assignment?.title}</Text>
              <Text style={styles.workPoints}>
                {assignment?.max_marks || (isTest ? 20 : 10)} points
              </Text>
            </View>
          </View>

          <View style={styles.dueRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={THEME.colors.textMuted} />
            <Text style={styles.dueText}>
              {assignment?.due_date
                ? `Due: ${new Date(assignment.due_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'No due date assigned'}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Description / Instructions */}
          <Text style={styles.sectionHeader}>Instructions</Text>
          <Text style={styles.descText}>
            {assignment?.description ||
              '• All questions are compulsory.\n• Please write clearly and attach your response in PDF format.\n• Late submissions will be flagged for review.'}
          </Text>

          {/* Teacher Attachment if present */}
          {(assignment?.attachment_path || assignment?.attachment_url) && (
            <View style={styles.teacherAttContainer}>
              <Text style={styles.sectionHeader}>Course Materials</Text>
              <TouchableOpacity
                style={styles.attachmentBox}
                activeOpacity={0.8}
                onPress={() => {
                  const url = assignment.attachment_path || assignment.attachment_url;
                  if (url) Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open file URL'));
                }}
              >
                <MaterialCommunityIcons name="file-pdf-box" size={32} color="#DC2626" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.attName} numberOfLines={1}>
                    {assignment.attachment_name || 'Assignment_Questions.pdf'}
                  </Text>
                  <Text style={styles.attType}>PDF Document • Tap to view</Text>
                </View>
                <MaterialCommunityIcons name="open-in-new" size={18} color={THEME.colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* ─── "YOUR WORK" SUBMISSION CONTAINER ──────────────────────── */}
        <Card style={styles.submissionCard}>
          <View style={styles.subHeader}>
            <Text style={styles.subHeading}>Your work</Text>
            <Badge
              label={isSubmitted ? 'Handed in' : 'Assigned'}
              variant={isSubmitted ? 'success' : 'neutral'}
            />
          </View>

          {isSubmitted ? (
            /* SUBMITTED STATE */
            <View style={styles.submittedContainer}>
              <View style={styles.submittedFileBox}>
                <MaterialCommunityIcons name="file-check-outline" size={28} color={THEME.colors.success} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.submittedFileName} numberOfLines={1}>
                    {assignment?.my_submission?.original_filename || 'Assignment_Submission.pdf'}
                  </Text>
                  <Text style={styles.submittedDate}>
                    {assignment?.my_submission?.submitted_at
                      ? `Turned in on ${new Date(assignment.my_submission.submitted_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : 'Turned in'}
                  </Text>
                </View>
              </View>

              <Button
                title="Unsubmit Work"
                variant="outline"
                loading={unsubmitting}
                onPress={() => setShowUnsubmitDialog(true)}
                style={{ marginTop: THEME.spacing.md }}
              />
            </View>
          ) : (
            /* NOT SUBMITTED STATE */
            <View style={styles.notSubmittedContainer}>
              {stagedFile ? (
                <View style={styles.stagedBox}>
                  <MaterialCommunityIcons name="file-document" size={28} color={THEME.colors.primary} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.stagedName} numberOfLines={1}>
                      {stagedFile.name}
                    </Text>
                    <Text style={styles.stagedSub}>Ready for turn in</Text>
                  </View>
                  <TouchableOpacity onPress={() => setStagedFile(null)}>
                    <MaterialCommunityIcons name="close-circle" size={22} color={THEME.colors.danger} />
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Action Buttons to Attach Work */}
              <View style={styles.attachBtnRow}>
                <TouchableOpacity
                  style={styles.attachChoiceBtn}
                  activeOpacity={0.8}
                  onPress={handlePickDocument}
                >
                  <MaterialCommunityIcons name="file-upload-outline" size={22} color={THEME.colors.primary} />
                  <Text style={styles.attachChoiceText}>Attach Document (PDF)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.attachChoiceBtn}
                  activeOpacity={0.8}
                  onPress={handlePickImage}
                >
                  <MaterialCommunityIcons name="camera-outline" size={22} color="#059669" />
                  <Text style={styles.attachChoiceText}>Photo / Camera</Text>
                </TouchableOpacity>
              </View>

              <Button
                title={stagedFile ? 'Turn in Assignment' : 'Attach File to Turn in'}
                variant="primary"
                size="lg"
                loading={submitting}
                disabled={!stagedFile}
                onPress={handleTurnIn}
                style={{ marginTop: THEME.spacing.md }}
              />
            </View>
          )}
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Confirm Unsubmit Dialog */}
      <ConfirmDialog
        visible={showUnsubmitDialog}
        title="Unsubmit Assignment?"
        message="Unsubmitting will remove your current submission. You can re-submit your updated coursework before the deadline."
        confirmText="Yes, Unsubmit"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmUnsubmit}
        onCancel={() => setShowUnsubmitDialog(false)}
      />
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
  detailCard: {
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemKindBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  workTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  workPoints: {
    fontSize: 13,
    color: THEME.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dueText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  descText: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    lineHeight: 20,
  },
  teacherAttContainer: {
    marginTop: 14,
  },
  attachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: 10,
    marginTop: 4,
  },
  attName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  attType: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  submissionCard: {
    padding: THEME.spacing.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  submittedContainer: {
    paddingTop: 4,
  },
  submittedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: THEME.borderRadius.md,
    padding: 12,
  },
  submittedFileName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  submittedDate: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  notSubmittedContainer: {
    paddingTop: 4,
  },
  stagedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: THEME.borderRadius.md,
    padding: 10,
    marginBottom: 12,
  },
  stagedName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  stagedSub: {
    fontSize: 11,
    color: THEME.colors.primary,
    marginTop: 2,
  },
  attachBtnRow: {
    gap: 8,
  },
  attachChoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    gap: 8,
  },
  attachChoiceText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
});

