/**
 * First-Time Activation & Mandatory Password Change Screen
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { THEME } from '../../constants/theme';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChangePassword = async () => {
    setErrorMessage(null);
    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ new_password: newPassword }),
      });
      router.replace('/(auth)/login');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="shield-key-outline" size={36} color={THEME.colors.primary} />
        </View>
        <Text style={styles.title}>Activate Account</Text>
        <Text style={styles.subtitle}>
          Please set your permanent password before accessing your VidyaOS dashboard.
        </Text>

        {errorMessage && (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>New Password (Min 8 Chars)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Confirm New Password</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.btnDisabled]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Set Password & Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    padding: THEME.spacing.lg,
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
  },
  subtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: THEME.radii.md,
    marginBottom: THEME.spacing.md,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
  inputGroup: {
    width: '100%',
    marginBottom: THEME.spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  primaryButton: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 14,
    borderRadius: THEME.radii.md,
    width: '100%',
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

