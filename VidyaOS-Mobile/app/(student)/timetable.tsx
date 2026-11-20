/**
 * Student Weekly Timetable Screen
 * Displays official institutional year-wise class timetable schedules and PDF documents.
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
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { studentService } from '../../services/studentService';
import { PdfTimetable, StudentProfile } from '../../types/student';
import { Card, Badge, EmptyState, NotificationBanner, Button } from '../../components/common';

export default function StudentTimetableScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeYearFilter, setActiveYearFilter] = useState<'MY' | 'ALL' | number>('MY');

  const [timetables, setTimetables] = useState<PdfTimetable[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [ttRes, profRes] = await Promise.allSettled([
        studentService.getPdfTimetables(),
        studentService.getProfile(),
      ]);

      if (ttRes.status === 'fulfilled') setTimetables(ttRes.value);
      if (profRes.status === 'fulfilled') setProfile(profRes.value);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load timetable documents');
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

  const studentYear = profile?.year || 1;

  const filteredTimetables = timetables.filter((tt) => {
    if (activeYearFilter === 'ALL') return true;
    if (activeYearFilter === 'MY') return Number(tt.year) === Number(studentYear);
    return Number(tt.year) === Number(activeYearFilter);
  });

  const handleOpenPdf = (item: PdfTimetable) => {
    if (!item.file_path) {
      Alert.alert('No Document Link', 'The PDF link for this timetable is not available.');
      return;
    }
    Linking.openURL(item.file_path).catch(() => {
      Alert.alert('Open Error', 'Could not open timetable document in PDF viewer.');
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Loading weekly timetable schedule...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Weekly Class Timetable</Text>
          <Text style={styles.headerSubtitle}>
            {profile?.department_name || 'Engineering'} • Year {studentYear} (Sem {profile?.semester || 1})
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

        {/* Cohort Overview Card */}
        <Card style={styles.cohortCard}>
          <View style={styles.cohortRow}>
            <View style={styles.cohortIconBox}>
              <MaterialCommunityIcons name="calendar-clock" size={28} color="#4F46E5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cohortHeading}>ACADEMIC SCHEDULE</Text>
              <Text style={styles.cohortTitle}>
                {profile?.department_name || 'Department'} • Year {studentYear}
              </Text>
              <Text style={styles.cohortSub}>
                Semester {profile?.semester || 1} • {profile?.academic_year_label || 'Current Academic Session'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Year Filter Chips */}
        <View style={styles.filterStrip}>
          <TouchableOpacity
            style={[styles.filterChip, activeYearFilter === 'MY' && styles.filterChipActive]}
            onPress={() => setActiveYearFilter('MY')}
          >
            <Text style={[styles.filterText, activeYearFilter === 'MY' && styles.filterTextActive]}>
              My Year ({studentYear === 1 ? '1st' : studentYear === 2 ? '2nd' : '3rd'} Year)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeYearFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setActiveYearFilter('ALL')}
          >
            <Text style={[styles.filterText, activeYearFilter === 'ALL' && styles.filterTextActive]}>
              All Years
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeYearFilter === 1 && styles.filterChipActive]}
            onPress={() => setActiveYearFilter(1)}
          >
            <Text style={[styles.filterText, activeYearFilter === 1 && styles.filterTextActive]}>
              1st Year
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeYearFilter === 2 && styles.filterChipActive]}
            onPress={() => setActiveYearFilter(2)}
          >
            <Text style={[styles.filterText, activeYearFilter === 2 && styles.filterTextActive]}>
              2nd Year
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeYearFilter === 3 && styles.filterChipActive]}
            onPress={() => setActiveYearFilter(3)}
          >
            <Text style={[styles.filterText, activeYearFilter === 3 && styles.filterTextActive]}>
              3rd Year
            </Text>
          </TouchableOpacity>
        </View>

        {/* Timetables List */}
        {filteredTimetables.length === 0 ? (
          <EmptyState
            title="No Timetable Available"
            description="The department has not published a timetable PDF for this cohort filter yet."
            iconName="calendar-blank-outline"
          />
        ) : (
          filteredTimetables.map((item) => (
            <Card key={item.id} style={styles.ttCard}>
              <View style={styles.ttRow}>
                <View style={styles.pdfIconBox}>
                  <MaterialCommunityIcons name="file-pdf-box" size={32} color="#DC2626" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.ttTitle}>{item.title}</Text>
                  <Text style={styles.ttMeta}>
                    Year {item.year} • {item.department_name || 'Engineering'}
                  </Text>
                  <Text style={styles.ttDate}>
                    {item.uploaded_at
                      ? `Updated: ${new Date(item.uploaded_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}`
                      : 'Active Schedule'}
                  </Text>
                </View>
              </View>

              <Button
                title="View / Download Timetable PDF"
                variant="primary"
                size="sm"
                iconName="open-in-new"
                onPress={() => handleOpenPdf(item)}
                style={{ marginTop: 12 }}
              />
            </Card>
          ))
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
  cohortCard: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1.5,
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.md,
  },
  cohortRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cohortIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cohortHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.8,
  },
  cohortTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  cohortSub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  filterStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  ttCard: {
    marginBottom: THEME.spacing.sm,
    padding: THEME.spacing.md,
  },
  ttRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pdfIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ttTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  ttMeta: {
    fontSize: 12,
    color: THEME.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  ttDate: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
});

