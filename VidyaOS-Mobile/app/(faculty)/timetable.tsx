/**
 * Faculty Academic Timetable Screen
 * Displays official department cohort timetables and schedules.
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
import { CONFIG } from '../../constants/config';
import { facultyService } from '../../services/facultyService';
import { PdfTimetable } from '../../types/student';
import { Card, Badge, Button, EmptyState, NotificationBanner } from '../../components/common';

export default function FacultyTimetableScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<'ALL' | 1 | 2 | 3>('ALL');

  const [timetables, setTimetables] = useState<PdfTimetable[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTimetables = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await facultyService.getPdfTimetables();
      setTimetables(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load timetable documents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTimetables();
  }, [loadTimetables]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTimetables();
  };

  const handleOpenPdf = async (item: PdfTimetable) => {
    try {
      let url = item.file_path;
      if (!url.startsWith('http')) {
        url = `${CONFIG.API_URL.replace('/api/v1', '')}/${item.file_path.replace(/^\/+/, '')}`;
      }
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to Open File', 'No PDF viewer application found on device.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to open timetable document');
    }
  };

  const filteredTimetables = timetables.filter((t) => {
    if (selectedYear === 'ALL') return true;
    return Number(t.year) === selectedYear;
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 6 }}>
          <Text style={styles.headerTitle}>Academic Timetables</Text>
          <Text style={styles.headerSubtitle}>Department Schedules & Cohort Timetable PDFs</Text>
        </View>
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
            style={{ marginBottom: 12 }}
          />
        )}

        {/* Year Filter Chips */}
        <View style={styles.filterChipsRow}>
          {(['ALL', 1, 2, 3] as const).map((yr) => (
            <TouchableOpacity
              key={yr}
              style={[styles.filterChip, selectedYear === yr && styles.filterChipActive]}
              onPress={() => setSelectedYear(yr)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, selectedYear === yr && styles.filterChipTextActive]}>
                {yr === 'ALL' ? 'All Years' : yr === 1 ? '1st Year' : yr === 2 ? '2nd Year' : '3rd Year'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading Spinner */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.loadingText}>Loading timetable documents...</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && filteredTimetables.length === 0 && (
          <EmptyState
            icon="calendar-blank-outline"
            title="No Timetables Uploaded"
            description={
              selectedYear === 'ALL'
                ? 'No official timetable documents have been uploaded for the department yet.'
                : `No official timetable document found for ${selectedYear}st Year.`
            }
          />
        )}

        {/* Timetables Grid */}
        {!loading &&
          filteredTimetables.map((item) => (
            <Card key={item.id} variant="elevated" style={styles.timetableCard}>
              <View style={styles.cardHeader}>
                <View style={styles.pdfIconCircle}>
                  <MaterialCommunityIcons name="file-pdf-box" size={28} color="#DC2626" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.timetableTitle}>{item.title}</Text>
                  <Text style={styles.timetableSub}>
                    {item.department_name || 'Department'} • {item.uploaded_at ? `Uploaded ${item.uploaded_at}` : 'Official Academic Schedule'}
                  </Text>
                </View>
                <Badge label={`${item.year} Year`} variant="info" />
              </View>

              <View style={styles.cardActions}>
                <Button
                  title="View / Download PDF"
                  variant="primary"
                  icon="download"
                  onPress={() => handleOpenPdf(item)}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  content: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: THEME.spacing.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radii.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
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
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
  timetableCard: {
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pdfIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timetableTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  timetableSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
});

