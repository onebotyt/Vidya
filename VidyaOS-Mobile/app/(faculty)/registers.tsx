/**
 * Faculty Attendance Registers & Live Sessions Screen
 * Displays active and past attendance sessions, filters by state,
 * and allows launching a new live attendance session.
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
import { AttendanceSession } from '../../types/faculty';
import { TeachingGroup } from '../../types/student';
import { Card, Badge, Button, EmptyState, NotificationBanner } from '../../components/common';

export default function FacultyRegistersScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [teachingGroups, setTeachingGroups] = useState<TeachingGroup[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Session Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionPeriod, setSessionPeriod] = useState('1');
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [sessionsRes, groupsRes] = await Promise.allSettled([
        facultyService.getAttendanceSessions(),
        facultyService.getTeachingGroups(),
      ]);

      if (sessionsRes.status === 'fulfilled') {
        setSessions(sessionsRes.value);
      }
      if (groupsRes.status === 'fulfilled') {
        setTeachingGroups(groupsRes.value);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load attendance registers');
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

  const handleOpenNewSession = async () => {
    if (!selectedGroupId) {
      Alert.alert('Required Field', 'Please select a class / teaching group for this session.');
      return;
    }

    const group = teachingGroups.find((g) => g.id === selectedGroupId);
    setCreating(true);
    try {
      const newSession = await facultyService.createAttendanceSession({
        subject_id: group?.subject_id,
        semester: group?.semester,
        topic: sessionTopic.trim() || `Period ${sessionPeriod} Lecture`,
      });

      setCreateModalVisible(false);
      setSessionTopic('');
      setSelectedGroupId(null);
      await loadData();

      // Navigate straight to Session Studio
      router.push(`/(faculty)/session-studio?id=${newSession.id}`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to launch attendance session');
    } finally {
      setCreating(false);
    }
  };

  // Filtered Sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesFilter =
      activeFilter === 'ALL'
        ? true
        : activeFilter === 'OPEN'
        ? s.state === 'OPEN'
        : s.state === 'CLOSED' || s.state === 'FINALIZED';

    const matchesSearch =
      searchQuery.trim() === '' ||
      (s.subject_name && s.subject_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.topic && s.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.label && s.label.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const openSessionsCount = sessions.filter((s) => s.state === 'OPEN').length;

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Attendance Registers</Text>
          <Text style={styles.headerSubtitle}>Live Sessions, Dynamic PIN & QR</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Open Session</Text>
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
            style={{ marginBottom: THEME.spacing.md }}
          />
        )}

        {/* Live Active Session Highlight Banner */}
        {openSessionsCount > 0 && (
          <Card variant="elevated" style={styles.liveBanner}>
            <View style={styles.livePulseRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.liveBannerTitle}>
                {openSessionsCount} Active Session{openSessionsCount > 1 ? 's' : ''} in Progress
              </Text>
            </View>
            <Text style={styles.liveBannerDesc}>
              Students can currently check in via 6-digit rolling PIN or visual QR token.
            </Text>
            {sessions
              .filter((s) => s.state === 'OPEN')
              .slice(0, 2)
              .map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.activeSessionItem}
                  onPress={() => router.push(`/(faculty)/session-studio?id=${s.id}`)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activeSessionName}>{s.subject_name || 'Active Session'}</Text>
                    <Text style={styles.activeSessionSub}>
                      {s.date || 'Today'} • {s.topic || 'Class Lecture'}
                    </Text>
                  </View>
                  <View style={styles.enterStudioBadge}>
                    <Text style={styles.enterStudioText}>Enter Studio</Text>
                    <MaterialCommunityIcons name="arrow-right" size={14} color="#059669" />
                  </View>
                </TouchableOpacity>
              ))}
          </Card>
        )}

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search registers or topics..."
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

        {/* State Filter Tabs */}
        <View style={styles.filterRow}>
          {(['ALL', 'OPEN', 'CLOSED'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}
              >
                {filter === 'ALL'
                  ? `All (${sessions.length})`
                  : filter === 'OPEN'
                  ? `Active (${openSessionsCount})`
                  : `Past Records`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.loadingText}>Loading attendance sessions...</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && filteredSessions.length === 0 && (
          <EmptyState
            icon="calendar-clock"
            title="No Sessions Found"
            description={
              searchQuery
                ? `No sessions match "${searchQuery}"`
                : activeFilter === 'OPEN'
                ? 'No active attendance sessions currently running.'
                : 'No attendance records created yet. Tap "+ Open Session" above to begin roll call.'
            }
          />
        )}

        {/* Sessions List */}
        {!loading &&
          filteredSessions.map((session) => {
            const isOpen = session.state === 'OPEN';
            return (
              <Card key={session.id} variant="elevated" style={styles.sessionCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.cardSubject}>{session.subject_name || 'Subject Register'}</Text>
                    <Text style={styles.cardTopic}>{session.topic || 'Regular Lecture'}</Text>
                  </View>
                  <Badge
                    label={isOpen ? 'LIVE OPEN' : session.state || 'CLOSED'}
                    variant={isOpen ? 'success' : 'neutral'}
                  />
                </View>

                <View style={styles.sessionMetaRow}>
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="calendar" size={14} color={THEME.colors.textMuted} />
                    <Text style={styles.metaText}>{session.date || 'Today'}</Text>
                  </View>
                  {session.period_no && (
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color={THEME.colors.textMuted} />
                      <Text style={styles.metaText}>Period {session.period_no}</Text>
                    </View>
                  )}
                  {session.present_count !== undefined && (
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="account-check-outline" size={14} color="#059669" />
                      <Text style={[styles.metaText, { color: '#059669', fontWeight: '600' }]}>
                        {session.present_count} Present
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardActions}>
                  <Button
                    title={isOpen ? 'Enter Live Studio' : 'View Session Ledger'}
                    onPress={() => router.push(`/(faculty)/session-studio?id=${session.id}`)}
                    variant={isOpen ? 'primary' : 'outline'}
                    icon={isOpen ? 'qrcode-scan' : 'eye-outline'}
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            );
          })}
      </ScrollView>

      {/* Launch New Attendance Session Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Launch Attendance Session</Text>
                <Text style={styles.modalSubtitle}>Open live PIN & QR roll call for your students</Text>
              </View>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.inputLabel}>Select Teaching Group / Class *</Text>
              {teachingGroups.length === 0 ? (
                <Text style={styles.noGroupsText}>No teaching groups found. Create a class first.</Text>
              ) : (
                <View style={styles.groupPickerContainer}>
                  {teachingGroups.map((g) => {
                    const isSelected = selectedGroupId === g.id;
                    return (
                      <TouchableOpacity
                        key={g.id}
                        style={[styles.groupOption, isSelected && styles.groupOptionSelected]}
                        onPress={() => setSelectedGroupId(g.id)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                          size={20}
                          color={isSelected ? '#059669' : THEME.colors.textMuted}
                        />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={[styles.groupOptionName, isSelected && styles.groupOptionNameActive]}>
                            {g.name}
                          </Text>
                          <Text style={styles.groupOptionSub}>
                            Sem {g.semester} • {g.component}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Text style={styles.inputLabel}>Period / Slot Number</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                placeholder="e.g. 1"
                placeholderTextColor={THEME.colors.textMuted}
                value={sessionPeriod}
                onChangeText={setSessionPeriod}
              />

              <Text style={styles.inputLabel}>Lecture Topic / Label (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Unit 3: Normalization & Keys"
                placeholderTextColor={THEME.colors.textMuted}
                value={sessionTopic}
                onChangeText={setSessionTopic}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setCreateModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={creating ? 'Launching...' : 'Start Session'}
                variant="primary"
                onPress={handleOpenNewSession}
                loading={creating}
                disabled={creating || !selectedGroupId}
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
  headerLeft: {
    flex: 1,
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radii.md,
    marginLeft: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  content: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  liveBanner: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  livePulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
    marginRight: 8,
  },
  liveBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  liveBannerDesc: {
    fontSize: 12,
    color: '#047857',
    marginBottom: 10,
  },
  activeSessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: THEME.radii.sm,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  activeSessionName: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  activeSessionSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  enterStudioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radii.sm,
  },
  enterStudioText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginRight: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 10,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.md,
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
    color: THEME.colors.textMuted,
    fontSize: 13,
  },
  sessionCard: {
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  cardTopic: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 6,
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
    maxHeight: '85%',
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
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  groupPickerContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
  },
  groupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  groupOptionSelected: {
    backgroundColor: '#ECFDF5',
  },
  groupOptionName: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  groupOptionNameActive: {
    color: '#059669',
  },
  groupOptionSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  noGroupsText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
    padding: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: THEME.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
});
