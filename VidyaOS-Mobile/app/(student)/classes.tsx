/**
 * Enrolled Classes Screen
 * Lists all active course cohorts and teaching groups with search and instant detail access.
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { studentService } from '../../services/studentService';
import { TeachingGroup } from '../../types/student';
import { Card, EmptyState, NotificationBanner } from '../../components/common';

const CARD_COLORS = ['#4F46E5', '#059669', '#D97706', '#7C3AED', '#0284C7', '#DB2777'];

export default function StudentClassesScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<TeachingGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadClasses = useCallback(async () => {
    try {
      setErrorMessage(null);
      const res = await studentService.getMyEnrolledGroups();
      setClasses(res);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load enrolled classes');
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

  const filteredClasses = classes.filter((cls) => {
    const q = searchQuery.toLowerCase();
    const name = (cls.name || cls.subject_name || '').toLowerCase();
    const teacher = (cls.teacher_name || '').toLowerCase();
    return name.includes(q) || teacher.includes(q);
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Loading enrolled classes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Search Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={THEME.colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search classes or faculty..."
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

        {filteredClasses.length === 0 ? (
          <EmptyState
            title="No Classes Found"
            description={searchQuery ? 'No enrolled classes match your search query.' : 'You have not been assigned to any class groups yet.'}
            iconName="google-classroom"
          />
        ) : (
          filteredClasses.map((cls, idx) => {
            const bannerBg = CARD_COLORS[idx % CARD_COLORS.length];
            return (
              <TouchableOpacity
                key={cls.id}
                activeOpacity={0.9}
                onPress={() => router.push(`/(student)/class-detail?id=${cls.id}`)}
              >
                <Card style={styles.classCard}>
                  {/* Top Color Banner */}
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
                    <Text style={styles.cardTeacher} numberOfLines={1}>
                      {cls.teacher_name || 'Faculty Instructor'}
                    </Text>
                  </View>

                  {/* Card Bottom Meta */}
                  <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                      <MaterialCommunityIcons name="account-group-outline" size={16} color={THEME.colors.textMuted} />
                      <Text style={styles.footerItemText}>{cls.enrolled_count ?? 48} Students</Text>
                    </View>
                    <View style={styles.actionPrompt}>
                      <Text style={[styles.actionPromptText, { color: bannerBg }]}>Open Classroom →</Text>
                    </View>
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
  searchHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.colors.textPrimary,
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
    marginBottom: 8,
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
  cardTeacher: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
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
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionPromptText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
