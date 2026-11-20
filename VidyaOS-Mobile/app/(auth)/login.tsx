/**
 * Universal Mobile Login Screen
 * Supports Email, Official Enrollment No, Registration No, or Phone
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { THEME } from '../../constants/theme';
import { CONFIG } from '../../constants/config';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coldStartProgress, setColdStartProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter your username/email/enrollment and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setColdStartProgress(null);

    try {
      const data = await login(identifier, password, (attempt, max) => {
        setColdStartProgress(`Connecting to Cloud Backend (${attempt * 3}s)...`);
      });

      if (data.must_change_password) {
        router.replace('/(auth)/change-password');
        return;
      }

      // Role-based routing
      const user = data.user;
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

      router.replace('/(faculty)/dashboard');
    } catch (err: any) {
      setLoading(false);
      setColdStartProgress(null);
      if (err?.code === 'PENDING_APPROVAL') {
        setErrorMessage('Your account is awaiting department faculty approval.');
      } else if (err?.code === 'REGISTRATION_REJECTED') {
        setErrorMessage('Your registration request was rejected by institutional administration.');
      } else {
        setErrorMessage(err?.message || 'Invalid credentials. Please verify your ID and password.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header Hero */}
        <View style={styles.heroBox}>
          <View style={styles.brandBadge}>
            <MaterialCommunityIcons name="school" size={24} color="#3B82F6" />
            <Text style={styles.badgeText}>INSTITUTIONAL PORTAL</Text>
          </View>
          <Text style={styles.heroTitle}>
            Vidya<Text style={styles.heroAccent}>OS</Text>
          </Text>
          <Text style={styles.heroSubtitle}>{CONFIG.INSTITUTION_NAME}</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSubtitle}>
            Access your attendance, classes, marksheets & coursework
          </Text>

          {/* Cold Start Indicator */}
          {coldStartProgress && (
            <View style={styles.coldStartBox}>
              <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 8 }} />
              <Text style={styles.coldStartText}>{coldStartProgress}</Text>
            </View>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Identifier Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username / Email / Enrollment No.</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="account-outline"
                size={20}
                color={THEME.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 2024IT001 or name@gmail.com"
                placeholderTextColor={THEME.colors.textMuted}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={THEME.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Enter account password"
                placeholderTextColor={THEME.colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.toggleBtn}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={THEME.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Sign In</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>

          {/* Registration Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New student joining department? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Self-Register →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    padding: THEME.spacing.lg,
  },
  heroBox: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radii.full,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  heroAccent: {
    color: '#2563EB',
  },
  heroSubtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.xl,
    ...THEME.shadows.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginBottom: THEME.spacing.lg,
  },
  coldStartBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: THEME.radii.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  coldStartText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '500',
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: THEME.radii.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: THEME.spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  toggleBtn: {
    padding: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    paddingVertical: 14,
    borderRadius: THEME.radii.md,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  footerText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
});

