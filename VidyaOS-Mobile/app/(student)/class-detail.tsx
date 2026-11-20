/**
 * Student Classroom Workspace Screen
 * 4 Full Tabs: Stream (Announcements & Comments), Classwork (Assignments & Tests),
 * Attendance (Class-Specific Rate), and People (Faculty & Classmates).
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { studentService } from '../../services/studentService';
import {
  TeachingGroup,
  StreamPost,
  StreamComment,
  Assignment,
  ClassMember,
} from '../../types/student';
import { Card, Badge, Button, NotificationBanner, EmptyState } from '../../components/common';

export default function StudentClassDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = Number(id);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'STREAM' | 'CLASSWORK' | 'ATTENDANCE' | 'PEOPLE'>('STREAM');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [group, setGroup] = useState<TeachingGroup | null>(null);
  const [posts, setPosts] = useState<StreamPost[]>([]);
  const [classwork, setClasswork] = useState<Assignment[]>([]);
  const [members, setMembers] = useState<{ teachers: ClassMember[]; students: ClassMember[] }>({
    teachers: [],
    students: [],
  });

  // Composer State
  const [composerOpen, setComposerOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  // Expanded Post Comments
  const [expandedComments, setExpandedComments] = useState<Record<number, StreamComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<number, boolean>>({});

  const loadAllClassData = useCallback(async () => {
    if (!groupId) return;
    try {
      setErrorMessage(null);
      const [groupRes, postsRes, workRes, membersRes] = await Promise.allSettled([
        studentService.getGroupDetail(groupId),
        studentService.getGroupPosts(groupId),
        studentService.getGroupClasswork(groupId),
        studentService.getGroupMembers(groupId),
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
    loadAllClassData();
  }, [loadAllClassData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAllClassData();
  };

  const handleCreatePost = async () => {
    const text = newPostContent.trim();
    if (!text) {
      Alert.alert('Empty Post', 'Please write a message to share with your class.');
      return;
    }

    try {
      setPosting(true);
      await studentService.createGroupPost(groupId, text);
      setNewPostContent('');
      setComposerOpen(false);
      const updatedPosts = await studentService.getGroupPosts(groupId);
      setPosts(updatedPosts);
    } catch (err: any) {
      Alert.alert('Post Failed', err?.message || 'Could not post announcement.');
    } finally {
      setPosting(false);
    }
  };

  const toggleComments = async (postId: number) => {
    if (expandedComments[postId]) {
      const next = { ...expandedComments };
      delete next[postId];
      setExpandedComments(next);
      return;
    }

    try {
      const comms = await studentService.getPostComments(groupId, postId);
      setExpandedComments((prev) => ({ ...prev, [postId]: comms }));
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load comments');
    }
  };

  const handleAddComment = async (postId: number) => {
    const commentText = (commentInputs[postId] || '').trim();
    if (!commentText) return;

    try {
      setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
      await studentService.addPostComment(groupId, postId, commentText);
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      const updated = await studentService.getPostComments(groupId, postId);
      setExpandedComments((prev) => ({ ...prev, [postId]: updated }));
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit comment');
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Opening classroom...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {group?.name || group?.subject_name || 'Classroom'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {group?.teacher_name || 'Faculty Instructor'} • Semester {group?.semester || 1}
          </Text>
        </View>
      </View>

      {/* Classroom Segmented Tabs */}
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
          style={[styles.tabItem, activeTab === 'PEOPLE' && styles.tabItemActive]}
          onPress={() => setActiveTab('PEOPLE')}
        >
          <Text style={[styles.tabText, activeTab === 'PEOPLE' && styles.tabTextActive]}>People</Text>
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

        {/* ─── TAB 1: STREAM ────────────────────────────────────────── */}
        {activeTab === 'STREAM' && (
          <View>
            {/* Class Banner Hero */}
            <View style={styles.streamHero}>
              <Text style={styles.streamHeroTitle}>{group?.name || group?.subject_name}</Text>
              <Text style={styles.streamHeroSub}>
                {group?.teacher_name || 'Instructor'} • Semester {group?.semester || 1}
              </Text>
              <View style={styles.streamHeroChips}>
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipText}>{group?.component || 'THEORY'}</Text>
                </View>
                {group?.invite_code && (
                  <View style={styles.heroChip}>
                    <Text style={styles.heroChipText}>Code: {group.invite_code}</Text>
                  </View>
                )}
              </View>
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
                    <MaterialCommunityIcons name="bullhorn-outline" size={20} color={THEME.colors.primary} />
                  </View>
                  <Text style={styles.composerPlaceholder}>Announce something to your class...</Text>
                </TouchableOpacity>
              ) : (
                <View>
                  <Text style={styles.composerHeading}>Share with class</Text>
                  <TextInput
                    style={styles.composerInput}
                    placeholder="Share an update, question, or note..."
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
                      title="Post"
                      variant="primary"
                      size="sm"
                      loading={posting}
                      onPress={handleCreatePost}
                    />
                  </View>
                </View>
              )}
            </Card>

            {/* Posts Feed */}
            {posts.length === 0 ? (
              <EmptyState
                title="Class Stream is Quiet"
                description="No announcements or posts have been shared in this class yet."
                iconName="message-text-outline"
              />
            ) : (
              posts.map((post) => {
                const isExpanded = Boolean(expandedComments[post.id]);
                const comments = expandedComments[post.id] || [];

                return (
                  <Card key={post.id} style={styles.postCard}>
                    <View style={styles.postHeader}>
                      <View style={styles.postAvatarCircle}>
                        <Text style={styles.postAvatarText}>
                          {(post.author_name || 'AU')
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
                      {post.author_role === 'TEACHER' && (
                        <Badge label="Faculty" variant="info" />
                      )}
                    </View>

                    <Text style={styles.postContent}>{post.content}</Text>

                    {/* Post Comments Toggle */}
                    <View style={styles.postFooter}>
                      <TouchableOpacity
                        style={styles.commentToggleBtn}
                        onPress={() => toggleComments(post.id)}
                      >
                        <MaterialCommunityIcons
                          name="comment-text-outline"
                          size={18}
                          color={THEME.colors.primary}
                        />
                        <Text style={styles.commentToggleText}>
                          {isExpanded
                            ? 'Hide Comments'
                            : `Class comments (${post.comments_count ?? comments.length})`}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Comments Drawer */}
                    {isExpanded && (
                      <View style={styles.commentsContainer}>
                        {comments.length === 0 ? (
                          <Text style={styles.noCommentsText}>No comments yet. Be the first to reply!</Text>
                        ) : (
                          comments.map((cm) => (
                            <View key={cm.id} style={styles.commentItem}>
                              <Text style={styles.commentAuthor}>{cm.user_name}</Text>
                              <Text style={styles.commentContent}>{cm.content}</Text>
                              <Text style={styles.commentDate}>
                                {cm.created_at
                                  ? new Date(cm.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : ''}
                              </Text>
                            </View>
                          ))
                        )}

                        {/* Add Comment Input */}
                        <View style={styles.addCommentRow}>
                          <TextInput
                            style={styles.commentInput}
                            placeholder="Add a class comment..."
                            placeholderTextColor={THEME.colors.textMuted}
                            value={commentInputs[post.id] || ''}
                            onChangeText={(val) =>
                              setCommentInputs((prev) => ({ ...prev, [post.id]: val }))
                            }
                          />
                          <TouchableOpacity
                            style={styles.commentSendBtn}
                            disabled={submittingComment[post.id]}
                            onPress={() => handleAddComment(post.id)}
                          >
                            {submittingComment[post.id] ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* ─── TAB 2: CLASSWORK ─────────────────────────────────────── */}
        {activeTab === 'CLASSWORK' && (
          <View>
            {classwork.length === 0 ? (
              <EmptyState
                title="No Assignments Yet"
                description="Your instructor hasn't scheduled any coursework or class tests for this group."
                iconName="clipboard-text-outline"
              />
            ) : (
              classwork.map((item) => {
                const isSubmitted = Boolean(item.my_submission?.is_submitted);
                const isTest = item.item_kind === 'TEST';

                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/(student)/assignment-detail?id=${item.id}`)}
                  >
                    <Card style={styles.workCard}>
                      <View style={styles.workCardRow}>
                        <View
                          style={[
                            styles.workIconBox,
                            { backgroundColor: isTest ? '#FEE2E2' : '#EEF2FF' },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={isTest ? 'alert-decagram' : 'clipboard-text-outline'}
                            size={22}
                            color={isTest ? THEME.colors.danger : THEME.colors.primary}
                          />
                        </View>

                        <View style={styles.workInfo}>
                          <Text style={styles.workTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <Text style={styles.workDue}>
                            {item.due_date
                              ? `Due: ${new Date(item.due_date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}`
                              : 'No due date'}
                          </Text>
                          <Text style={styles.workPoints}>
                            {item.max_marks || (isTest ? 20 : 100)} points • {item.unit_name || 'General Unit'}
                          </Text>
                        </View>

                        <Badge
                          label={isSubmitted ? 'Turned in' : 'Assigned'}
                          variant={isSubmitted ? 'success' : 'neutral'}
                        />
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* ─── TAB 3: PEOPLE ────────────────────────────────────────── */}
        {activeTab === 'PEOPLE' && (
          <View>
            {/* Teachers Section */}
            <Text style={styles.peopleSectionTitle}>Teachers</Text>
            {members.teachers.length === 0 ? (
              <Text style={styles.noPeopleText}>No faculty instructor linked.</Text>
            ) : (
              members.teachers.map((t) => (
                <View key={t.id} style={styles.personRow}>
                  <View style={[styles.personAvatar, { backgroundColor: '#4F46E5' }]}>
                    <Text style={styles.personAvatarText}>
                      {(t.full_name || 'TE')
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personName}>{t.full_name}</Text>
                    <Text style={styles.personEmail}>{t.email || 'Faculty Member'}</Text>
                  </View>
                  <Badge label="Faculty" variant="info" />
                </View>
              ))
            )}

            {/* Classmates Section */}
            <View style={styles.peopleHeaderRow}>
              <Text style={styles.peopleSectionTitle}>Classmates</Text>
              <Text style={styles.classmateCountText}>
                {members.students.length} students enrolled
              </Text>
            </View>

            {members.students.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.noPeopleText}>No classmates roster registered in this section yet.</Text>
              </Card>
            ) : (
              members.students.map((st) => (
                <View key={st.id} style={styles.personRow}>
                  <View style={[styles.personAvatar, { backgroundColor: '#059669' }]}>
                    <Text style={styles.personAvatarText}>
                      {(st.full_name || 'ST')
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
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
  streamHero: {
    backgroundColor: '#4F46E5',
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
  streamHeroChips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  heroChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  heroChipText: {
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
    backgroundColor: '#EEF2FF',
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
    fontSize: 14,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.primary,
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
    marginBottom: 10,
  },
  postFooter: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 8,
  },
  commentToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  commentsContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  noCommentsText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  commentItem: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.sm,
    padding: 8,
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  commentContent: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  commentDate: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  addCommentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  commentInput: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 38,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  commentSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  workInfo: {
    flex: 1,
    marginRight: 8,
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
    color: THEME.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  peopleSectionTitle: {
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
  classmateCountText: {
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
  emptyCard: {
    padding: THEME.spacing.md,
    alignItems: 'center',
  },
});

