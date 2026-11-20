/**
 * Admin System Audit Logs Screen
 * Track institutional administrative events, security logins, and record mutations.
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
import { adminService } from '../../services/adminService';
import { AuditLogItem } from '../../types/admin';
import { Card, Badge, EmptyState, NotificationBanner } from '../../components/common';

export default function AdminAuditLogsScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await adminService.getAuditLogs(100);
      setLogs(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLogs();
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      (log.user_name && log.user_name.toLowerCase().includes(q)) ||
      (log.ip_address && log.ip_address.includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q))
    );
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 6 }}>
          <Text style={styles.headerTitle}>System Audit Logs</Text>
          <Text style={styles.headerSubtitle}>Institutional Security & Action Trail</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7C3AED']} />}
      >
        {errorMessage && (
          <NotificationBanner
            type="error"
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
            style={{ marginBottom: 12 }}
          />
        )}

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search actions, users, IPs..."
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

        {/* Loading Spinner */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading audit logs trail...</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && filteredLogs.length === 0 && (
          <EmptyState
            icon="history"
            title="No Audit Records"
            description={
              searchQuery
                ? `No audit events match "${searchQuery}".`
                : 'No security actions recorded in the audit log yet.'
            }
          />
        )}

        {/* Logs List */}
        {!loading &&
          filteredLogs.map((log) => (
            <Card key={log.id} variant="elevated" style={styles.logCard}>
              <View style={styles.cardHeader}>
                <View style={styles.actionIconBox}>
                  <MaterialCommunityIcons name="shield-check-outline" size={18} color="#7C3AED" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.actionName}>{log.action}</Text>
                  <Text style={styles.actionMeta}>
                    {log.user_name || 'System'} {log.user_role ? `(${log.user_role})` : ''} • {log.created_at}
                  </Text>
                </View>
                {log.ip_address && (
                  <Badge label={log.ip_address} variant="neutral" />
                )}
              </View>

              {log.details && (
                <View style={styles.detailsBox}>
                  <Text style={styles.detailsText}>{log.details}</Text>
                </View>
              )}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: THEME.colors.textPrimary,
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
  logCard: {
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  actionMeta: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  detailsBox: {
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: THEME.radii.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontFamily: 'monospace',
  },
});

