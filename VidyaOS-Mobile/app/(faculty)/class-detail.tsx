/**
 * Faculty Classroom Workspace Screen
 * 4 Tabs: Stream (Announcements & Posts), Classwork (Create & View Assignments),
 * Sheets (MANDATORY GATE: Please move to Desktop), and People (Faculty & Enrolled Students).
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { facultyService } from '../../services/facultyService';
import { TeachingGroup, StreamPost, Assignment, ClassMember } from '../../types/student';
import { Card, Badge, Button, EmptyState, NotificationBanner } from '../../components/common';
import { DesktopOnlyNotice } from '../../components/DesktopOnlyNotice';

export default function FacultyClassDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = Number(id);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'STREAM' | 'CLASSWORK' | 'SHEETS' | 'PEOPLE'>('STREAM');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [group, setGroup] = useState<TeachingGroup | null>(null);
  const [posts, setPosts] = useState<StreamPost[]>([]);
  const [classwork, setClasswork] = useState<Assignment[]>([]);
  const [members, setMembers] = useState<{ teachers: ClassMember[]; students: ClassMember[] }>({
    teachers: [],
    students: [],
  });

  // Announcement Composer
  const [composerOpen, setComposerOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  // Create Assignment Modal
  const [createAssignModalOpen, setCreateAssignModalOpen] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignMaxMarks, setAssignMaxMarks] = useState('10');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [creatingAssign, setCreatingAssign] = useState(false);

  const loadData = useCallback(async () => {
    if (!groupId) return;
    try {
      setErrorMessage(null);
      const [groupRes, postsRes, workRes, membersRes] = await Promise.allSettled([
        facultyService.getGroupDetail(groupId),
        facultyService.getGroupPosts(groupId),
        facultyService.getGroupClasswork(groupId),
        facultyService.getGroupMembers(groupId),
      ]);

      if (groupRes.status === 'fulfilled') setGroup(groupRes.value);
      if (postsRes.status === 'fulfilled') setPosts(postsRes.value);
      if (workRes.status === 'fulfilled') setClasswork(workRes.value);
      if (membersRes.status === 'fulfilled') setMembers(membersRes.value);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load classroom details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePostAnnouncement = async () => {
    const text = newPostContent.trim();
    if (!text) {
      Alert.alert('Empty Notice', 'Please write a message to broadcast to your students.');
      return;
    }

    try {
      setPosting(true);
      await facultyService.createGroupPost(groupId, text);
      setNewPostContent('');
      setComposerOpen(false);
      const updated = await facultyService.getGroupPosts(groupId);
      setPosts(updated);
    } catch (err: any) {
      Alert.alert('Post Error', err?.message || 'Could not post announcement.');
    } finally {
      setPosting(false);
    }
  };

  const handleCreateAssignment = async () => {
    const title = assignTitle.trim();
    if (!title) {
      Alert.alert('Title Required', 'Please enter an assignment title.');
      return;
    }

    try {
      setCreatingAssign(true);
      await facultyService.createAssignment({
        group_id: groupId,
        title,
        description: assignDesc.trim(),
        max_marks: Number(assignMaxMarks) || 10,
        due_date: assignDueDate.trim() || undefined,
      });

      setCreateAssignModalOpen(false);
      setAssignTitle('');
      setAssignDesc('');
      setAssignDueDate('');
      const updated = await facultyService.getGroupClasswork(groupId);
      setClasswork(updated);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create assignment');
    } finally {
      setCreatingAssign(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Opening classroom workspace...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {group?.name || group?.subject_name || 'Classroom'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            Semester {group?.semester || 1} • {group?.component || 'THEORY'}
          </Text>
        </View>
      </View>

      {/* Segmented Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'STREAM' && styles.tabItemActive]}
          onPress={() => setActiveTab('STREAM')}
        >
          <Text style={[styles.tabText, activeTab === 'STREAM' && styles.tabTextActive]}>Stream</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'CLASSWORK' && styles.tabItemActive]}
          onPress={() => setActiveTab('CLASSWORK')}
        >
          <Text style={[styles.tabText, activeTab === 'CLASSWORK' && styles.tabTextActive]}>
            Classwork ({classwork.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'SHEETS' && styles.tabItemActive]}
          onPress={() => setActiveTab('SHEETS')}
        >
          <Text style={[styles.tabText, activeTab === 'SHEETS' && styles.tabTextActive]}>Sheets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'PEOPLE' && styles.tabItemActive]}
          onPress={() => setActiveTab('PEOPLE')}
        >
          <Text style={[styles.tabText, activeTab === 'PEOPLE' && styles.tabTextActive]}>People</Text>
        </TouchableOpacity>
      </View>

      {/* ─── TAB 3: SHEETS (MANDATORY GATE TO DESKTOP) ──────────────── */}
      {activeTab === 'SHEETS' ? (
        <DesktopOnlyNotice
          moduleName="Evaluation & Marks Spreadsheet Editor"
          description="Detailed marks matrices, continuous internal assessments (CIE), and spreadsheet ledgers require desktop screen precision."
          webPath="/faculty/sheets/index.html"
          onGoBack={() => setActiveTab('STREAM')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
        >
          {errorMessage && (
            <NotificationBanner
              type="error"
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
              style={{ marginBottom: THEME.spacing.md }}
            />
          )}

          {/* ─── TAB 1: STREAM ────────────────────────────────────────── */}
          {activeTab === 'STREAM' && (
            <View>
              {/* Class Banner Hero */}
              <View style={styles.streamHero}>
                <Text style={styles.streamHeroTitle}>{group?.name || group?.subject_name}</Text>
                <Text style={styles.streamHeroSub}>Semester {group?.semester || 1} • {group?.component || 'THEORY'}</Text>
                {group?.invite_code ? (
                  <View style={styles.inviteBadge}>
                    <Text style={styles.inviteBadgeText}>Student Invite Code: {group.invite_code}</Text>
                  </View>
                ) : null}
              </View>

              {/* Announcement Composer */}
              <Card style={styles.composerCard}>
                {!composerOpen ? (
                  <TouchableOpacity
                    style={styles.composerClosedRow}
                    activeOpacity={0.8}
                    onPress={() => setComposerOpen(true)}
                  >
                    <View style={styles.composerAvatar}>
                      <MaterialCommunityIcons name="bullhorn-outline" size={20} color="#059669" />
                    </View>
                    <Text style={styles.composerPlaceholder}>Share announcement with your students...</Text>
                  </TouchableOpacity>
                ) : (
                  <View>
                    <Text style={styles.composerHeading}>Broadcast to Class</Text>
                    <TextInput
                      style={styles.composerInput}
                      placeholder="Write instructions, announcement, or exam updates..."
                      placeholderTextColor={THEME.colors.textMuted}
                      multiline
                      numberOfLines={4}
                      value={newPostContent}
                      onChangeText={setNewPostContent}
                    />
                    <View style={styles.composerActions}>
                      <Button
                        title="Cancel"
                        variant="ghost"
                        size="sm"
                        onPress={() => {
                          setComposerOpen(false);
                          setNewPostContent('');
                        }}
                        style={{ marginRight: 8 }}
                      />
                      <Button
                        title="Publish Announcement"
                        variant="primary"
                        size="sm"
                        loading={posting}
                        onPress={handlePostAnnouncement}
                      />
                    </View>
                  </View>
                )}
              </Card>

              {/* Stream Feed */}
              {posts.length === 0 ? (
                <EmptyState
                  title="No Announcements Yet"
                  description="Share your first classroom notice or lecture update with students."
                  iconName="bullhorn-outline"
                />
              ) : (
                posts.map((post) => (
                  <Card key={post.id} style={styles.postCard}>
                    <View style={styles.postHeader}>
                      <View style={styles.postAvatarCircle}>
                        <Text style={styles.postAvatarText}>
                          {(post.author_name || 'FC')
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.postAuthor}>{post.author_name}</Text>
                        <Text style={styles.postDate}>
                          {post.created_at
                            ? new Date(post.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Recently'}
                        </Text>
                      </View>
                      <Badge label="Faculty Notice" variant="success" />
                    </View>

                    <Text style={styles.postContent}>{post.content}</Text>
                  </Card>
                ))
              )}
            </View>
          )}

          {/* ─── TAB 2: CLASSWORK ─────────────────────────────────────── */}
          {activeTab === 'CLASSWORK' && (
            <View>
              <View style={styles.classworkTopRow}>
                <Text style={styles.classworkTitle}>Coursework & Tests</Text>
                <Button
                  title="+ New Assignment"
                  variant="primary"
                  size="sm"
                  onPress={() => setCreateAssignModalOpen(true)}
                />
              </View>

              {classwork.length === 0 ? (
                <EmptyState
                  title="No Assignments Created"
                  description="Add your first assignment, lab practical, or class test."
                  iconName="clipboard-text-outline"
                  actionTitle="+ Create Assignment"
                  onAction={() => setCreateAssignModalOpen(true)}
                />
              ) : (
                classwork.map((item) => {
                  const isTest = item.item_kind === 'TEST';
                  return (
                    <Card key={item.id} style={styles.workCard}>
                      <View style={styles.workCardRow}>
                        <View
                          style={[
                            styles.workIconBox,
                            { backgroundColor: isTest ? '#FEE2E2' : '#ECFDF5' },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={isTest ? 'alert-decagram' : 'clipboard-text-outline'}
                            size={22}
                            color={isTest ? THEME.colors.danger : '#059669'}
                          />
                        </View>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.workTitle}>{item.title}</Text>
                          <Text style={styles.workDue}>
                            {item.due_date
                              ? `Due: ${new Date(item.due_date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                })}`
                              : 'No deadline'}
                          </Text>
                          <Text style={styles.workPoints}>
                            {item.max_marks || (isTest ? 20 : 10)} points
                          </Text>
                        </View>
                        <Badge label={isTest ? 'Class Test' : 'Assignment'} variant="neutral" />
                      </View>
                    </Card>
                  );
                })
              )}
            </View>
          )}

          {/* ─── TAB 4: PEOPLE ────────────────────────────────────────── */}
          {activeTab === 'PEOPLE' && (
            <View>
              <Text style={styles.peopleTitle}>Faculty Instructors</Text>
              {members.teachers.length === 0 ? (
                <Text style={styles.noPeopleText}>Instructor details not populated.</Text>
              ) : (
                members.teachers.map((t) => (
                  <View key={t.id} style={styles.personRow}>
                    <View style={[styles.personAvatar, { backgroundColor: '#059669' }]}>
                      <Text style={styles.personAvatarText}>
                        {(t.full_name || 'FC').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.personName}>{t.full_name}</Text>
                      <Text style={styles.personEmail}>{t.email || 'Instructor'}</Text>
                    </View>
                    <Badge label="Faculty" variant="success" />
                  </View>
                ))
              )}

              <View style={styles.peopleHeaderRow}>
                <Text style={styles.peopleTitle}>Enrolled Students</Text>
                <Text style={styles.countText}>{members.students.length} students</Text>
              </View>

              {members.students.length === 0 ? (
                <EmptyState
                  title="No Students Enrolled"
                  description="Students who enroll using this class code will appear here."
                  iconName="account-group-outline"
                />
              ) : (
                members.students.map((st) => (
                  <View key={st.id} style={styles.personRow}>
                    <View style={[styles.personAvatar, { backgroundColor: '#4F46E5' }]}>
                      <Text style={styles.personAvatarText}>
                        {(st.full_name || 'ST').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.personName}>{st.full_name}</Text>
                      <Text style={styles.personSub}>
                        Roll: {st.class_roll_no ? `${st.class_roll_no}` : '—'} • {st.official_enrollment_no || 'UBTER'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Create Assignment Modal */}
      <Modal visible={createAssignModalOpen} transparent animationType="slide" onRequestClose={() => setCreateAssignModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Coursework Assignment</Text>
              <TouchableOpacity onPress={() => setCreateAssignModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Assignment Title *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Unit 3 Programming Assignment"
              placeholderTextColor={THEME.colors.textMuted}
              value={assignTitle}
              onChangeText={setAssignTitle}
            />

            <View style={styles.formRow}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={styles.fieldLabel}>Total Points *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="10"
                  keyboardType="numeric"
                  value={assignMaxMarks}
                  onChangeText={setAssignMaxMarks}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.fieldLabel}>Due Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="2026-09-30"
                  value={assignDueDate}
                  onChangeText={setAssignDueDate}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Instructions & Description</Text>
            <TextInput
              style={[styles.modalInput, { height: 70, textAlignVertical: 'top', paddingTop: 8 }]}
              placeholder="Provide assignment questions or guidelines..."
              placeholderTextColor={THEME.colors.textMuted}
              multiline
              value={assignDesc}
              onChangeText={setAssignDesc}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setCreateAssignModalOpen(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Create"
                variant="primary"
                loading={creatingAssign}
                onPress={handleCreateAssignment}
                style={{ flex: 1, marginLeft: 8 }}
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
    paddingVertical: 10,
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
    borderBottomColor: '#059669',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  tabTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  streamHero: {
    backgroundColor: '#059669',
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  streamHeroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  streamHeroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  inviteBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  inviteBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  composerCard: {
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.sm,
  },
  composerClosedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  composerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  composerPlaceholder: {
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
  composerHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  composerInput: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: 10,
    fontSize: 13,
    color: THEME.colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  composerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  postCard: {
    marginBottom: THEME.spacing.sm,
    padding: THEME.spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  postAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  postAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  postDate: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  postContent: {
    fontSize: 14,
    color: THEME.colors.textPrimary,
    lineHeight: 20,
  },
  classworkTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  classworkTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  workCard: {
    marginBottom: THEME.spacing.xs,
    padding: THEME.spacing.sm,
  },
  workCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  workTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  workDue: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  workPoints: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  peopleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
    marginTop: 4,
  },
  peopleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  countText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 6,
  },
  personAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  personAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  personName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  personEmail: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  personSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  noPeopleText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: THEME.borderRadius.xl,
    borderTopRightRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  formRow: {
    flexDirection: 'row',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 18,
  },
});

