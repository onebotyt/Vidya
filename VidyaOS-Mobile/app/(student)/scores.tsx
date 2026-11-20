/**
 * Student Scores & Assessment Dossier Screen
 * Displays decoupled academic performance, class test marks, and semester exam results.
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
import { AssessmentScore, StudentProfile } from '../../types/student';
import { Card, Badge, EmptyState, NotificationBanner } from '../../components/common';

export default function StudentScoresScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'EXAM' | 'TEST'>('ALL');

  const [scores, setScores] = useState<AssessmentScore[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadScoresData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [scoresRes, profRes] = await Promise.allSettled([
        studentService.getScores(),
        studentService.getProfile(),
      ]);

      if (scoresRes.status === 'fulfilled') setScores(scoresRes.value);
      if (profRes.status === 'fulfilled') setProfile(profRes.value);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load assessment scores');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadScoresData();
  }, [loadScoresData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadScoresData();
  };

  const filteredScores = scores.filter((s) => {
    if (activeFilter === 'ALL') return true;
    return s.type === activeFilter;
  });

  const gradedScores = scores.filter((s) => s.marks_obtained !== null && s.marks_obtained !== undefined);
  const averagePercentage =
    gradedScores.length > 0
      ? Math.round(
          gradedScores.reduce((acc, curr) => acc + ((curr.marks_obtained || 0) / (curr.max_marks || 100)) * 100, 0) /
            gradedScores.length
        )
      : 0;

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Loading academic marksheets...</Text>
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
          <Text style={styles.headerTitle}>Scores & Assessments</Text>
          <Text style={styles.headerSubtitle}>
            {profile?.department_name || 'Engineering'} • Sem {profile?.semester || 1}
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

        {/* Academic Performance Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summarySub}>CUMULATIVE PERFORMANCE</Text>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryScoreVal}>{averagePercentage}%</Text>
              <Text style={styles.summaryScoreLabel}>Aggregate Score</Text>
            </View>
            <View style={styles.summaryRightCol}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Graded Tests:</Text>
                <Text style={styles.metricVal}>{gradedScores.length}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Total Recorded:</Text>
                <Text style={styles.metricVal}>{scores.length}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Filter Tabs */}
        <View style={styles.filterStrip}>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setActiveFilter('ALL')}
          >
            <Text style={[styles.filterText, activeFilter === 'ALL' && styles.filterTextActive]}>
              All Assessments ({scores.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'EXAM' && styles.filterChipActive]}
            onPress={() => setActiveFilter('EXAM')}
          >
            <Text style={[styles.filterText, activeFilter === 'EXAM' && styles.filterTextActive]}>
              Exams
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'TEST' && styles.filterChipActive]}
            onPress={() => setActiveFilter('TEST')}
          >
            <Text style={[styles.filterText, activeFilter === 'TEST' && styles.filterTextActive]}>
              Class Tests
            </Text>
          </TouchableOpacity>
        </View>

        {/* Assessment Cards List */}
        {filteredScores.length === 0 ? (
          <EmptyState
            title="No Assessment Records"
            description="No academic marks or exam scores have been entered for this cohort yet."
            iconName="chart-box-outline"
          />
        ) : (
          filteredScores.map((sc) => {
            const hasMarks = sc.marks_obtained !== null && sc.marks_obtained !== undefined;
            const pct = hasMarks ? Math.round(((sc.marks_obtained || 0) / (sc.max_marks || 100)) * 100) : 0;

            return (
              <Card key={sc.id} style={styles.scoreCard}>
                <View style={styles.scoreTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scoreTitle}>{sc.title}</Text>
                    <Text style={styles.scoreSubject}>
                      {sc.subject_name} {sc.subject_code ? `(${sc.subject_code})` : ''}
                    </Text>
                  </View>
                  <Badge
                    label={sc.type === 'EXAM' ? 'Final Exam' : 'Class Test'}
                    variant={sc.type === 'EXAM' ? 'info' : 'neutral'}
                  />
                </View>

                <View style={styles.scoreValueRow}>
                  <View style={styles.marksBox}>
                    <Text style={styles.marksBig}>
                      {hasMarks ? `${sc.marks_obtained}` : '—'}
                    </Text>
                    <Text style={styles.marksMax}> / {sc.max_marks}</Text>
                  </View>

                  {hasMarks && (
                    <Badge
                      label={`${pct}%`}
                      variant={pct >= 60 ? 'success' : pct >= 40 ? 'warning' : 'danger'}
                    />
                  )}
                </View>

                {sc.remarks ? (
                  <Text style={styles.scoreRemarks}>Faculty Note: "{sc.remarks}"</Text>
                ) : null}

                <View style={styles.scoreFooter}>
                  <Text style={styles.scoreDate}>
                    {sc.date ? new Date(sc.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Evaluated'}
                  </Text>
                  <Text style={styles.scoreStatus}>{sc.submission_status || 'GRADED'}</Text>
                </View>
              </Card>
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
  summaryCard: {
    backgroundColor: '#059669',
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  summarySub: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  summaryScoreVal: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryScoreLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  summaryRightCol: {
    alignItems: 'flex-end',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: THEME.spacing.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  filterChipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scoreCard: {
    marginBottom: THEME.spacing.sm,
    padding: THEME.spacing.md,
  },
  scoreTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  scoreTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  scoreSubject: {
    fontSize: 12,
    color: THEME.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  scoreValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  marksBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  marksBig: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  marksMax: {
    fontSize: 14,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  scoreRemarks: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
    marginTop: 6,
  },
  scoreFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 8,
  },
  scoreDate: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  scoreStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
});

