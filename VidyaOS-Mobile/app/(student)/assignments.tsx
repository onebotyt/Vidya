/**
 * Student Assignments & To-Do Work Hub Screen
 * 3 Filter Tabs: Assigned (Active), Missing (Overdue), and Done (Submitted).
 * Filterable across all classes or specific enrolled courses.
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { studentService } from '../../services/studentService';
import { Assignment, TeachingGroup } from '../../types/student';
import { Card, Badge, EmptyState, NotificationBanner } from '../../components/common';

export default function StudentAssignmentsScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'assigned' | 'missing' | 'done'>('assigned');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<TeachingGroup[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [assignRes, groupsRes] = await Promise.allSettled([
        studentService.getMyAssignments(activeTab),
        studentService.getMyEnrolledGroups(),
      ]);

      if (assignRes.status === 'fulfilled') setAssignments(assignRes.value);
      if (groupsRes.status === 'fulfilled') setClasses(groupsRes.value);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load coursework');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter by selected course
  const filteredAssignments = assignments.filter((a) => {
    if (selectedClassId === null) return true;
    return a.group_id === selectedClassId;
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Loading coursework assignments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Segmented Tab Strip */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'assigned' && styles.tabItemActive]}
          onPress={() => setActiveTab('assigned')}
        >
          <Text style={[styles.tabText, activeTab === 'assigned' && styles.tabTextActive]}>
            Assigned
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'missing' && styles.tabItemActive]}
          onPress={() => setActiveTab('missing')}
        >
          <Text style={[styles.tabText, activeTab === 'missing' && styles.tabTextActive]}>
            Missing
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'done' && styles.tabItemActive]}
          onPress={() => setActiveTab('done')}
        >
          <Text style={[styles.tabText, activeTab === 'done' && styles.tabTextActive]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>

      {/* Course Filter Horizontal Chips */}
      {classes.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classChipsScroll}>
          <TouchableOpacity
            style={[styles.chip, selectedClassId === null && styles.chipActive]}
            onPress={() => setSelectedClassId(null)}
          >
            <Text style={[styles.chipText, selectedClassId === null && styles.chipTextActive]}>
              All Classes
            </Text>
          </TouchableOpacity>
          {classes.map((cls) => (
            <TouchableOpacity
              key={cls.id}
              style={[styles.chip, selectedClassId === cls.id && styles.chipActive]}
              onPress={() => setSelectedClassId(cls.id)}
            >
              <Text style={[styles.chipText, selectedClassId === cls.id && styles.chipTextActive]}>
                {cls.name || cls.subject_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

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

        {filteredAssignments.length === 0 ? (
          <EmptyState
            title={activeTab === 'done' ? 'No Completed Work' : activeTab === 'missing' ? 'No Missing Work' : 'All Caught Up!'}
            description={
              activeTab === 'assigned'
                ? 'No pending coursework assignments in this view.'
                : activeTab === 'missing'
                ? 'Great job! You have no overdue assignments.'
                : 'Assignments you turn in will appear here.'
            }
            iconName="clipboard-check-outline"
          />
        ) : (
          filteredAssignments.map((item) => {
            const isSubmitted = Boolean(item.my_submission?.is_submitted);
            const isTest = item.item_kind === 'TEST';

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => router.push(`/(student)/assignment-detail?id=${item.id}`)}
              >
                <Card style={styles.assignCard}>
                  <View style={styles.cardRow}>
                    <View
                      style={[
                        styles.iconBox,
                        { backgroundColor: isTest ? '#FEE2E2' : '#EEF2FF' },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={isTest ? 'alert-decagram' : 'clipboard-text-outline'}
                        size={22}
                        color={isTest ? THEME.colors.danger : THEME.colors.primary}
                      />
                    </View>

                    <View style={styles.cardInfo}>
                      <Text style={styles.assignTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.assignCourse} numberOfLines={1}>
                        {item.group_name || 'Classroom Course'}
                      </Text>
                      <Text style={styles.assignDue}>
                        {item.due_date
                          ? `Due: ${new Date(item.due_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`
                          : 'No due date'}
                      </Text>
                    </View>

                    <Badge
                      label={
                        isSubmitted
                          ? 'Turned in'
                          : activeTab === 'missing'
                          ? 'Missing'
                          : 'Assigned'
                      }
                      variant={isSubmitted ? 'success' : activeTab === 'missing' ? 'danger' : 'neutral'}
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
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
  classChipsScroll: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  chipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  assignCard: {
    marginBottom: THEME.spacing.xs,
    padding: THEME.spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardInfo: {
    flex: 1,
    marginRight: 8,
  },
  assignTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  assignCourse: {
    fontSize: 12,
    color: THEME.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  assignDue: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
});
