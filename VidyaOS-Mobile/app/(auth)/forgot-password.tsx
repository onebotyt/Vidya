/**
 * Password Recovery & Reset Instructions Screen
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <MaterialCommunityIcons name="arrow-left" size={20} color={THEME.colors.textPrimary} />
        <Text style={styles.backButtonText}>Back to Sign In</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="lock-reset" size={36} color={THEME.colors.primary} />
        </View>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          In accordance with institutional security guidelines, password resets for faculty and students are handled by your Department HOD or System Administrator.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Self-Assisted Instructions:</Text>
          <Text style={styles.infoText}>
            1. Contact your branch faculty or HOD.{'\n'}
            2. Faculty can reset your password directly from the Department Students Roster.{'\n'}
            3. Upon next login, you will be prompted to set a new password.
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Return to Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    padding: THEME.spacing.lg,
    paddingTop: 60,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  backButtonText: {
    fontSize: 14,
    color: THEME.colors.textPrimary,
    fontWeight: '600',
    marginLeft: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    ...THEME.shadows.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: THEME.spacing.lg,
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.xl,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 14,
    borderRadius: THEME.radii.md,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

