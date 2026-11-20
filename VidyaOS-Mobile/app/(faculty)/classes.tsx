/**
 * Faculty Teaching Groups & Classes Catalog Screen
 * Features:
 * - Search by course or subject
 * - Semester filter chips
 * - "+ Create Class" modal form
 * - Direct tap to enter classroom workspace
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
import { TeachingGroup } from '../../types/student';
import { Card, Badge, Button, EmptyState, NotificationBanner } from '../../components/common';

const CARD_COLORS = ['#059669', '#4F46E5', '#D97706', '#7C3AED', '#0284C7', '#DB2777'];

export default function FacultyClassesScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<TeachingGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newSemester, setNewSemester] = useState('1');
  const [newComponent, setNewComponent] = useState<'THEORY' | 'PRACTICAL'>('THEORY');
  const [creating, setCreating] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadClasses = useCallback(async () => {
    try {
      setErrorMessage(null);
      const res = await facultyService.getTeachingGroups();
      setClasses(res);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const onRefresh = () => {
    setRefreshing(true);
    loadClasses();
  };

  const handleCreateGroup = async () => {
    const name = newClassName.trim();
    if (!name) {
      Alert.alert('Class Name Required', 'Please enter a name for the new teaching group.');
      return;
    }

    try {
      setCreating(true);
      await facultyService.createTeachingGroup({
        name,
        semester: Number(newSemester) || 1,
        component: newComponent,
      });
      setCreateModalOpen(false);
      setNewClassName('');
      await loadClasses();
    } catch (err: any) {
      Alert.alert('Creation Failed', err?.message || 'Could not create teaching group');
    } finally {
      setCreating(false);
    }
  };

  const filteredClasses = classes.filter((cls) => {
    const q = searchQuery.toLowerCase();
    const name = (cls.name || cls.subject_name || '').toLowerCase();
    const matchesSearch = name.includes(q);
    const matchesSem =
      selectedSemester === 'ALL' || String(cls.semester) === selectedSemester;
    return matchesSearch && matchesSem;
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading teaching groups...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header with Search & + Create */}
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={THEME.colors.textMuted} style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search classes..."
            placeholderTextColor={THEME.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setCreateModalOpen(true)}
        >
          <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Semester Filter Chips */}
      <View style={styles.filterStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['ALL', '1', '2', '3', '4', '5', '6'].map((sem) => (
            <TouchableOpacity
              key={sem}
              style={[styles.filterChip, selectedSemester === sem && styles.filterChipActive]}
              onPress={() => setSelectedSemester(sem)}
            >
              <Text style={[styles.filterChipText, selectedSemester === sem && styles.filterChipTextActive]}>
                {sem === 'ALL' ? 'All Semesters' : `Sem ${sem}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

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

        {filteredClasses.length === 0 ? (
          <EmptyState
            title="No Teaching Groups Found"
            description="Create a new class group or select a different semester filter."
            iconName="google-classroom"
            actionTitle="+ Create Class Group"
            onAction={() => setCreateModalOpen(true)}
          />
        ) : (
          filteredClasses.map((cls, idx) => {
            const bannerBg = CARD_COLORS[idx % CARD_COLORS.length];
            return (
              <TouchableOpacity
                key={cls.id}
                activeOpacity={0.9}
                onPress={() => router.push(`/(faculty)/class-detail?id=${cls.id}`)}
              >
                <Card style={styles.classCard}>
                  <View style={[styles.cardBanner, { backgroundColor: bannerBg }]}>
                    <View style={styles.bannerRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {cls.name || cls.subject_name}
                        </Text>
                        <Text style={styles.cardSubtitle}>
                          Semester {cls.semester || 1} • {cls.component || 'THEORY'}
                        </Text>
                      </View>
                      <View style={styles.classIconBadge}>
                        <MaterialCommunityIcons name="google-classroom" size={24} color="#FFFFFF" />
                      </View>
                    </View>
                    {cls.invite_code ? (
                      <Text style={styles.cardCode}>Invite Code: {cls.invite_code}</Text>
                    ) : null}
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                      <MaterialCommunityIcons name="account-group-outline" size={16} color={THEME.colors.textMuted} />
                      <Text style={styles.footerItemText}>{cls.enrolled_count ?? 48} Enrolled Students</Text>
                    </View>
                    <Text style={[styles.managePrompt, { color: bannerBg }]}>Open Classroom →</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create Class Modal */}
      <Modal visible={createModalOpen} transparent animationType="slide" onRequestClose={() => setCreateModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Teaching Group</Text>
              <TouchableOpacity onPress={() => setCreateModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Course / Class Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Data Structures & Algorithms - IT 2nd Year"
              placeholderTextColor={THEME.colors.textMuted}
              value={newClassName}
              onChangeText={setNewClassName}
            />

            <Text style={styles.fieldLabel}>Semester (1 - 6) *</Text>
            <View style={styles.semSelectRow}>
              {['1', '2', '3', '4', '5', '6'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.semBtn, newSemester === s && styles.semBtnActive]}
                  onPress={() => setNewSemester(s)}
                >
                  <Text style={[styles.semBtnText, newSemester === s && styles.semBtnTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Component *</Text>
            <View style={styles.compRow}>
              <TouchableOpacity
                style={[styles.compBtn, newComponent === 'THEORY' && styles.compBtnActive]}
                onPress={() => setNewComponent('THEORY')}
              >
                <Text style={[styles.compBtnText, newComponent === 'THEORY' && styles.compBtnTextActive]}>Theory</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.compBtn, newComponent === 'PRACTICAL' && styles.compBtnActive]}
                onPress={() => setNewComponent('PRACTICAL')}
              >
                <Text style={[styles.compBtnText, newComponent === 'PRACTICAL' && styles.compBtnTextActive]}>Practical / Lab</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setCreateModalOpen(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Create Group"
                variant="primary"
                loading={creating}
                onPress={handleCreateGroup}
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
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterStrip: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  filterScroll: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 8,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  filterChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  classCard: {
    marginBottom: THEME.spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  cardBanner: {
    padding: THEME.spacing.md,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  classIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  cardCode: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerItemText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  managePrompt: {
    fontSize: 12,
    fontWeight: '700',
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
    marginBottom: 14,
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
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  semSelectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  semBtn: {
    flex: 1,
    height: 38,
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  semBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  semBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  semBtnTextActive: {
    color: '#FFFFFF',
  },
  compRow: {
    flexDirection: 'row',
    gap: 8,
  },
  compBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
  },
  compBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  compBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  compBtnTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
});
