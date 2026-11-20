/**
 * Faculty Live Session Studio Screen
 * Dual roll-call studio:
 * 1. Rolling 6-digit PIN generator with expiration timer
 * 2. Dynamic QR token generation
 * 3. Live student claims adjudication feed (Accept / Reject)
 * 4. Manual roll-call roster with 3-way toggle (Present / Absent / Late)
 * 5. Close / Finalize session workflow
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { facultyService } from '../../services/facultyService';
import { AttendanceSession, LiveCheckInClaim } from '../../types/faculty';
import { Card, Badge, Button, EmptyState, NotificationBanner, ConfirmDialog } from '../../components/common';

export default function SessionStudioScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = id ? parseInt(id, 10) : 0;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'PIN_QR' | 'CLAIMS' | 'ROSTER'>('PIN_QR');

  // Session & Roster
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [roster, setRoster] = useState<
    Array<{
      student_id: number;
      full_name: string;
      class_roll_no?: number | string | null;
      official_enrollment_no?: string | null;
      status: 'PRESENT' | 'ABSENT' | 'LATE';
    }>
  >([]);

  // PIN & QR State
  const [currentPin, setCurrentPin] = useState<string | null>(null);
  const [pinCountdown, setPinCountdown] = useState<number>(0);
  const [generatingPin, setGeneratingPin] = useState(false);

  const [currentQrToken, setCurrentQrToken] = useState<string | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);

  // Live Claims Feed
  const [claims, setClaims] = useState<LiveCheckInClaim[]>([]);
  const [adjudicatingId, setAdjudicatingId] = useState<number | null>(null);

  // Manual Roster Search & Saving
  const [rosterSearch, setRosterSearch] = useState('');
  const [savingRoster, setSavingRoster] = useState(false);

  // Close Session Dialog
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closingSession, setClosingSession] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      setErrorMessage(null);
      const [detailsRes, claimsRes] = await Promise.allSettled([
        facultyService.getSessionDetails(sessionId),
        facultyService.getSelfAttendanceClaims(sessionId),
      ]);

      if (detailsRes.status === 'fulfilled') {
        setSession(detailsRes.value.session);
        setRoster(detailsRes.value.roster || []);
        if (detailsRes.value.session.pin_code) {
          setCurrentPin(detailsRes.value.session.pin_code);
        }
        if (detailsRes.value.session.qr_token) {
          setCurrentQrToken(detailsRes.value.session.qr_token);
        }
      }

      if (claimsRes.status === 'fulfilled') {
        setClaims(claimsRes.value);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load session details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Countdown timer for PIN
  useEffect(() => {
    if (pinCountdown > 0) {
      timerRef.current = setTimeout(() => {
        setPinCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pinCountdown]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSession();
  };

  // Generate Rolling PIN
  const handleGeneratePin = async () => {
    if (!sessionId) return;
    setGeneratingPin(true);
    try {
      const res = await facultyService.generatePin(sessionId);
      setCurrentPin(res.pin_code);
      setPinCountdown(res.expires_in || 60);
      setSuccessMessage(`New PIN ${res.pin_code} active!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      Alert.alert('PIN Generation Error', err?.message || 'Could not generate PIN code');
    } finally {
      setGeneratingPin(false);
    }
  };

  // Generate QR Token
  const handleGenerateQr = async () => {
    if (!sessionId) return;
    setGeneratingQr(true);
    try {
      const res = await facultyService.generateQr(sessionId);
      setCurrentQrToken(res.qr_token);
      setSuccessMessage('Dynamic QR Token regenerated!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      Alert.alert('QR Token Error', err?.message || 'Could not generate QR token');
    } finally {
      setGeneratingQr(false);
    }
  };

  // Adjudicate Live Claim
  const handleAdjudicate = async (reqId: number, action: 'ACCEPT' | 'REJECT') => {
    if (!sessionId) return;
    setAdjudicatingId(reqId);
    try {
      await facultyService.adjudicateClaim(sessionId, reqId, action);
      // Update local state
      setClaims((prev) =>
        prev.map((c) => (c.id === reqId ? { ...c, status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED' } : c))
      );
      // If accepted, mark present in roster
      if (action === 'ACCEPT') {
        const claim = claims.find((c) => c.id === reqId);
        if (claim) {
          setRoster((prev) =>
            prev.map((st) => (st.student_id === claim.student_id ? { ...st, status: 'PRESENT' } : st))
          );
        }
      }
    } catch (err: any) {
      Alert.alert('Adjudication Error', err?.message || 'Could not process claim');
    } finally {
      setAdjudicatingId(null);
    }
  };

  // Toggle student status in manual roster
  const toggleStudentStatus = (studentId: number, newStatus: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setRoster((prev) =>
      prev.map((st) => (st.student_id === studentId ? { ...st, status: newStatus } : st))
    );
  };

  // Bulk mark present/absent
  const handleBulkMark = (status: 'PRESENT' | 'ABSENT') => {
    setRoster((prev) => prev.map((st) => ({ ...st, status })));
  };

  // Save verified attendance records
  const handleSaveAttendance = async () => {
    if (!sessionId) return;
    setSavingRoster(true);
    try {
      const records = roster.map((r) => ({
        student_id: r.student_id,
        status: r.status,
      }));
      await facultyService.saveAttendanceRecords(sessionId, records);
      setSuccessMessage('Attendance records verified & saved!');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      Alert.alert('Save Error', err?.message || 'Failed to save attendance records');
    } finally {
      setSavingRoster(false);
    }
  };

  // Finalize / Close Session
  const handleCloseSession = async () => {
    if (!sessionId) return;
    setClosingSession(true);
    try {
      await facultyService.transitionSessionState(sessionId, 'CLOSED');
      setCloseDialogOpen(false);
      setSession((prev) => (prev ? { ...prev, state: 'CLOSED' } : null));
      Alert.alert('Session Closed', 'Attendance session finalized successfully.', [
        { text: 'Back to Registers', onPress: () => router.replace('/(faculty)/registers') },
        { text: 'View Summary', style: 'cancel' },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to close session');
    } finally {
      setClosingSession(false);
    }
  };

  // Filtered Roster
  const filteredRoster = roster.filter((st) => {
    if (!rosterSearch.trim()) return true;
    const query = rosterSearch.toLowerCase();
    return (
      st.full_name.toLowerCase().includes(query) ||
      (st.class_roll_no && String(st.class_roll_no).includes(query)) ||
      (st.official_enrollment_no && st.official_enrollment_no.toLowerCase().includes(query))
    );
  });

  const presentCount = roster.filter((st) => st.status === 'PRESENT').length;
  const lateCount = roster.filter((st) => st.status === 'LATE').length;
  const absentCount = roster.filter((st) => st.status === 'ABSENT').length;
  const isOpen = session?.state === 'OPEN';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Initializing Live Session Studio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Studio Top Navigation Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 8 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {session?.subject_name || 'Live Attendance Studio'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {session?.date || 'Today'} • Period {session?.period_no || 1} • {session?.topic || 'Lecture'}
          </Text>
        </View>
        <Badge label={isOpen ? 'LIVE' : session?.state || 'CLOSED'} variant={isOpen ? 'success' : 'neutral'} />
      </View>

      {/* Real-time Telemetry Bar */}
      <View style={styles.telemetryBar}>
        <View style={styles.telemetryItem}>
          <Text style={[styles.telemetryValue, { color: '#059669' }]}>{presentCount}</Text>
          <Text style={styles.telemetryLabel}>Present</Text>
        </View>
        <View style={styles.telemetryDivider} />
        <View style={styles.telemetryItem}>
          <Text style={[styles.telemetryValue, { color: '#D97706' }]}>{lateCount}</Text>
          <Text style={styles.telemetryLabel}>Late</Text>
        </View>
        <View style={styles.telemetryDivider} />
        <View style={styles.telemetryItem}>
          <Text style={[styles.telemetryValue, { color: '#DC2626' }]}>{absentCount}</Text>
          <Text style={styles.telemetryLabel}>Absent</Text>
        </View>
        <View style={styles.telemetryDivider} />
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryValue}>{roster.length}</Text>
          <Text style={styles.telemetryLabel}>Enrolled</Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'PIN_QR' && styles.tabButtonActive]}
          onPress={() => setActiveTab('PIN_QR')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={16}
            color={activeTab === 'PIN_QR' ? '#059669' : THEME.colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'PIN_QR' && styles.tabTextActive]}>
            Roll-Call Studio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'CLAIMS' && styles.tabButtonActive]}
          onPress={() => setActiveTab('CLAIMS')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="bell-ring-outline"
            size={16}
            color={activeTab === 'CLAIMS' ? '#059669' : THEME.colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'CLAIMS' && styles.tabTextActive]}>
            Claims Feed ({claims.filter((c) => c.status === 'PENDING').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'ROSTER' && styles.tabButtonActive]}
          onPress={() => setActiveTab('ROSTER')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="format-list-checks"
            size={16}
            color={activeTab === 'ROSTER' ? '#059669' : THEME.colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'ROSTER' && styles.tabTextActive]}>
            Roster Ledger
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Contents */}
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

        {/* ═══ TAB 1: PIN & QR ROLL-CALL STUDIO ═══ */}
        {activeTab === 'PIN_QR' && (
          <View>
            {/* Rolling 6-Digit PIN Card */}
            <Card variant="elevated" style={styles.toolCard}>
              <View style={styles.toolHeader}>
                <View style={styles.toolIconCircle}>
                  <MaterialCommunityIcons name="numeric" size={24} color="#059669" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.toolTitle}>Dynamic 6-Digit PIN</Text>
                  <Text style={styles.toolSubtitle}>Students enter this code in their mobile app</Text>
                </View>
                {pinCountdown > 0 && (
                  <View style={styles.countdownBadge}>
                    <Text style={styles.countdownText}>{pinCountdown}s</Text>
                  </View>
                )}
              </View>

              {currentPin ? (
                <View style={styles.pinDisplayBox}>
                  <Text style={styles.pinCodeText}>{currentPin.split('').join('  ')}</Text>
                  <Text style={styles.pinStatusText}>
                    {pinCountdown > 0 ? `Refreshes automatically in ${pinCountdown} seconds` : 'Active Code'}
                  </Text>
                </View>
              ) : (
                <View style={styles.pinEmptyBox}>
                  <Text style={styles.pinEmptyText}>No PIN currently active for this session</Text>
                </View>
              )}

              {isOpen && (
                <Button
                  title={generatingPin ? 'Generating PIN...' : currentPin ? 'Rotate / Refresh PIN' : 'Generate 6-Digit PIN'}
                  variant="primary"
                  onPress={handleGeneratePin}
                  loading={generatingPin}
                  icon="refresh"
                  style={{ marginTop: 12 }}
                />
              )}
            </Card>

            {/* Dynamic Visual QR Code Card */}
            <Card variant="elevated" style={styles.toolCard}>
              <View style={styles.toolHeader}>
                <View style={styles.toolIconCircle}>
                  <MaterialCommunityIcons name="qrcode" size={24} color="#2563EB" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.toolTitle}>Dynamic QR Attendance Token</Text>
                  <Text style={styles.toolSubtitle}>Display on projector or phone screen for students to scan</Text>
                </View>
              </View>

              {currentQrToken ? (
                <View style={styles.qrDisplayBox}>
                  <View style={styles.qrVisualPlaceholder}>
                    <MaterialCommunityIcons name="qrcode" size={140} color="#1E293B" />
                  </View>
                  <Text style={styles.qrTokenText} numberOfLines={1} ellipsizeMode="middle">
                    Token: {currentQrToken}
                  </Text>
                </View>
              ) : (
                <View style={styles.pinEmptyBox}>
                  <Text style={styles.pinEmptyText}>QR attendance token has not been generated</Text>
                </View>
              )}

              {isOpen && (
                <Button
                  title={generatingQr ? 'Generating Token...' : currentQrToken ? 'Rotate QR Token' : 'Generate QR Token'}
                  variant="secondary"
                  onPress={handleGenerateQr}
                  loading={generatingQr}
                  icon="qrcode-scan"
                  style={{ marginTop: 12 }}
                />
              )}
            </Card>

            {/* Session Actions Footer */}
            {isOpen ? (
              <Button
                title="Close & Finalize Attendance Session"
                variant="danger"
                onPress={() => setCloseDialogOpen(true)}
                icon="lock-check"
                style={{ marginTop: 8 }}
              />
            ) : (
              <View style={styles.closedBanner}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#059669" />
                <Text style={styles.closedBannerText}>
                  This attendance session has been finalized. Records are saved in the ledger.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ═══ TAB 2: LIVE CLAIMS ADJUDICATION FEED ═══ */}
        {activeTab === 'CLAIMS' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Incoming Check-In Claims</Text>
              <TouchableOpacity onPress={onRefresh} style={styles.refreshFeedButton}>
                <MaterialCommunityIcons name="refresh" size={16} color="#059669" />
                <Text style={styles.refreshFeedText}>Refresh Feed</Text>
              </TouchableOpacity>
            </View>

            {claims.length === 0 ? (
              <EmptyState
                icon="bell-sleep-outline"
                title="No Student Claims Yet"
                description="When students submit their 6-digit PIN or scan your QR code, their claims will appear here for live review."
              />
            ) : (
              claims.map((claim) => {
                const isPending = claim.status === 'PENDING';
                const isAccepted = claim.status === 'ACCEPTED';
                return (
                  <Card key={claim.id} variant="elevated" style={styles.claimCard}>
                    <View style={styles.claimHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.claimName}>{claim.student_name}</Text>
                        <Text style={styles.claimMeta}>
                          Roll #{claim.class_roll_no || 'N/A'} • {claim.method} Check-in • {claim.submitted_at}
                        </Text>
                      </View>
                      <Badge
                        label={claim.status}
                        variant={isAccepted ? 'success' : isPending ? 'warning' : 'danger'}
                      />
                    </View>

                    {isPending && isOpen && (
                      <View style={styles.adjudicateActions}>
                        <TouchableOpacity
                          style={[styles.adjudicateBtn, styles.acceptBtn]}
                          onPress={() => handleAdjudicate(claim.id, 'ACCEPT')}
                          disabled={adjudicatingId === claim.id}
                        >
                          <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                          <Text style={styles.adjudicateBtnText}>Accept</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.adjudicateBtn, styles.rejectBtn]}
                          onPress={() => handleAdjudicate(claim.id, 'REJECT')}
                          disabled={adjudicatingId === claim.id}
                        >
                          <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                          <Text style={styles.adjudicateBtnText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* ═══ TAB 3: MANUAL ROSTER LEDGER ═══ */}
        {activeTab === 'ROSTER' && (
          <View>
            {/* Quick Bulk Actions */}
            <View style={styles.bulkActionsRow}>
              <TouchableOpacity
                style={styles.bulkBtn}
                onPress={() => handleBulkMark('PRESENT')}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="check-all" size={16} color="#059669" />
                <Text style={[styles.bulkBtnText, { color: '#059669' }]}>All Present</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bulkBtn}
                onPress={() => handleBulkMark('ABSENT')}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="close" size={16} color="#DC2626" />
                <Text style={[styles.bulkBtnText, { color: '#DC2626' }]}>All Absent</Text>
              </TouchableOpacity>
            </View>

            {/* Student Search */}
            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" size={18} color={THEME.colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search students by name or roll number..."
                placeholderTextColor={THEME.colors.textMuted}
                value={rosterSearch}
                onChangeText={setRosterSearch}
              />
            </View>

            {/* Students List */}
            {filteredRoster.map((student) => {
              return (
                <View key={student.student_id} style={styles.rosterRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.rosterStudentName}>{student.full_name}</Text>
                    <Text style={styles.rosterStudentMeta}>
                      Roll #{student.class_roll_no || '--'} • {student.official_enrollment_no || 'No Enrollment'}
                    </Text>
                  </View>

                  {/* 3-State Toggle Group */}
                  <View style={styles.statusToggleGroup}>
                    <TouchableOpacity
                      style={[
                        styles.toggleOption,
                        student.status === 'PRESENT' && styles.togglePresentActive,
                      ]}
                      onPress={() => toggleStudentStatus(student.student_id, 'PRESENT')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.toggleOptionText,
                          student.status === 'PRESENT' && styles.toggleTextActive,
                        ]}
                      >
                        P
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.toggleOption,
                        student.status === 'LATE' && styles.toggleLateActive,
                      ]}
                      onPress={() => toggleStudentStatus(student.student_id, 'LATE')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.toggleOptionText,
                          student.status === 'LATE' && styles.toggleTextActive,
                        ]}
                      >
                        L
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.toggleOption,
                        student.status === 'ABSENT' && styles.toggleAbsentActive,
                      ]}
                      onPress={() => toggleStudentStatus(student.student_id, 'ABSENT')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.toggleOptionText,
                          student.status === 'ABSENT' && styles.toggleTextActive,
                        ]}
                      >
                        A
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <Button
              title={savingRoster ? 'Saving Roster Records...' : 'Save Verified Attendance'}
              variant="primary"
              onPress={handleSaveAttendance}
              loading={savingRoster}
              icon="content-save-outline"
              style={{ marginTop: 16 }}
            />
          </View>
        )}
      </ScrollView>

      {/* Close Session Confirmation Dialog */}
      <ConfirmDialog
        visible={closeDialogOpen}
        title="Finalize Attendance Session"
        message="Are you sure you want to close this attendance session? Students will no longer be able to check in with PIN or QR code."
        confirmText={closingSession ? 'Closing...' : 'Close & Finalize'}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleCloseSession}
        onCancel={() => setCloseDialogOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: THEME.colors.textMuted,
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
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  telemetryBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.lg,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  telemetryItem: {
    alignItems: 'center',
  },
  telemetryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  telemetryLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  telemetryDivider: {
    width: 1,
    height: 24,
    backgroundColor: THEME.colors.border,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabButtonActive: {
    borderBottomColor: '#059669',
  },
  tabText: {
    fontSize: 12,
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
  toolCard: {
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  toolSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  countdownBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radii.full,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  pinDisplayBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 2,
    borderRadius: THEME.radii.md,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCodeText: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 6,
    color: '#065F46',
    fontFamily: 'monospace',
  },
  pinStatusText: {
    fontSize: 11,
    color: '#047857',
    marginTop: 6,
  },
  pinEmptyBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.md,
    paddingVertical: 20,
    alignItems: 'center',
  },
  pinEmptyText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
  },
  qrDisplayBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  qrVisualPlaceholder: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  qrTokenText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 8,
    gap: 8,
  },
  closedBannerText: {
    fontSize: 12,
    color: '#065F46',
    flex: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  refreshFeedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshFeedText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  claimCard: {
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  claimHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  claimName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  claimMeta: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  adjudicateActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  adjudicateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: THEME.radii.sm,
    gap: 4,
    flex: 1,
  },
  acceptBtn: {
    backgroundColor: '#059669',
  },
  rejectBtn: {
    backgroundColor: '#DC2626',
  },
  adjudicateBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  bulkActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  bulkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radii.md,
    gap: 6,
  },
  bulkBtnText: {
    fontSize: 12,
    fontWeight: '600',
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
    marginLeft: 6,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 6,
  },
  rosterStudentName: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  rosterStudentMeta: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  statusToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: THEME.radii.sm,
    padding: 2,
    gap: 2,
  },
  toggleOption: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: THEME.radii.sm,
  },
  togglePresentActive: {
    backgroundColor: '#059669',
  },
  toggleLateActive: {
    backgroundColor: '#D97706',
  },
  toggleAbsentActive: {
    backgroundColor: '#DC2626',
  },
  toggleOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
});

