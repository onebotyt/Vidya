/**
 * Initial Entry Route & Role-Based Splash Router
 */

import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { THEME } from '../constants/theme';
import { CONFIG } from '../constants/config';

export default function IndexScreen() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace('/(auth)/login');
      return;
    }

    if (user.must_change_password) {
      router.replace('/(auth)/change-password');
      return;
    }

    const roles = Array.isArray(user.roles) ? user.roles : [];
    const isAdmin =
      roles.includes('SYSTEM_ADMIN') ||
      roles.includes('ADMIN') ||
      user.role === 'SYSTEM_ADMIN' ||
      user.role === 'ADMIN' ||
      Boolean(user.is_admin);

    if (isAdmin) {
      router.replace('/(admin)/dashboard');
      return;
    }

    if (roles.includes('STUDENT') || user.role === 'STUDENT' || Boolean(user.is_student)) {
      router.replace('/(student)/dashboard');
      return;
    }

    // Faculty & HOD default
    router.replace('/(faculty)/dashboard');
  }, [isLoading, isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <View style={styles.brandBox}>
        <Text style={styles.logoText}>
          Vidya<Text style={styles.logoAccent}>OS</Text>
        </Text>
        <Text style={styles.subtitleText}>{CONFIG.INSTITUTION_NAME}</Text>
      </View>

      <ActivityIndicator size="large" color={THEME.colors.primary} style={styles.spinner} />
      <Text style={styles.loadingText}>Initializing secure mobile session…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.navyDeep,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.xl,
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xxl,
  },
  logoText: {
    fontSize: 38,
    fontWeight: THEME.typography.weights.extraBold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: '#3B82F6',
  },
  subtitleText: {
    fontSize: THEME.typography.sizes.sm,
    color: '#94A3B8',
    marginTop: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  spinner: {
    marginVertical: THEME.spacing.lg,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: THEME.typography.sizes.sm,
  },
});

