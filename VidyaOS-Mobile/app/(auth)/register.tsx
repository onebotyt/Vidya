/**
 * Student Self-Registration Screen
 * Incorporates 11-digit enrollment validation & "Enrollment Number Not Available" toggle
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { AuthService } from '../../services/authService';
import { THEME } from '../../constants/theme';
import { Department } from '../../types/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const { registerStudent } = useAuth();

  const [fullName, setFullName] = useState('');
  const [enrollNo, setEnrollNo] = useState('');
  const [enrollNotAvailable, setEnrollNotAvailable] = useState(false);
  const [ubterRegNo, setUbterRegNo] = useState('');
  const [classRollNo, setClassRollNo] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    AuthService.getDepartments().then((depts) => {
      setDepartments(depts);
      if (depts.length > 0) setSelectedDeptId(depts[0].id);
    });
  }, []);

  const handleRegister = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!enrollNotAvailable) {
      const cleanEnroll = enrollNo.replace(/\D/g, '');
      if (!cleanEnroll || cleanEnroll.length !== 11) {
        setErrorMessage('Official Enrollment Number must be exactly 11 numeric digits (or check "Enrollment Number Not Available").');
        return;
      }
    }

    if (classRollNo.trim()) {
      const cleanRoll = classRollNo.replace(/\D/g, '');
      if (!/^\d{1,2}$/.test(cleanRoll)) {
        setErrorMessage('Class Roll Number must be numeric and maximum 2 digits (e.g. 01 to 99).');
        return;
      }
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!selectedDeptId) {
      setErrorMessage('Please select your department.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerStudent({
        full_name: fullName.trim(),
        official_enrollment_no: enrollNotAvailable ? null : enrollNo.replace(/\D/g, ''),
        enrollment_not_available: enrollNotAvailable,
        registration_no: ubterRegNo.trim() || null,
        class_roll_no: classRollNo.trim() ? parseInt(classRollNo.replace(/\D/g, ''), 10) : null,
        email: email.trim().toLowerCase(),
        password,
        department_id: selectedDeptId,
        semester: selectedSemester,
        phone: phone.replace(/\D/g, '') || null,
      });

      setSuccessMessage(res.message || 'Registration submitted successfully! Awaiting faculty verification.');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration submission failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Header */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={THEME.colors.textPrimary} />
          <Text style={styles.backButtonText}>Back to Sign In</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Student Registration</Text>
          <Text style={styles.cardSubtitle}>
            Submit your enrollment request to your Department Faculty
          </Text>

          {errorMessage && (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {successMessage && (
            <View style={styles.successBox}>
              <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" style={{ marginRight: 6 }} />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Aarav Sharma"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Enrollment Number & Availability Checkbox */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Official Enrollment No. (11 Digits)</Text>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => {
                  setEnrollNotAvailable(!enrollNotAvailable);
                  if (!enrollNotAvailable) setEnrollNo('');
                }}
              >
                <MaterialCommunityIcons
                  name={enrollNotAvailable ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={18}
                  color={enrollNotAvailable ? THEME.colors.primary : THEME.colors.textMuted}
                />
                <Text style={styles.checkboxLabel}>Not Available</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.textInput, enrollNotAvailable && styles.textInputDisabled]}
              placeholder={enrollNotAvailable ? 'Not Assigned' : 'e.g. 20241112001 (11 digits)'}
              value={enrollNo}
              onChangeText={(t) => setEnrollNo(t.replace(/\D/g, '').slice(0, 11))}
              keyboardType="number-pad"
              maxLength={11}
              editable={!enrollNotAvailable}
            />
          </View>

          {/* Registration No & Class Roll No */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>UBTER Reg. No.</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 24101054"
                value={ubterRegNo}
                onChangeText={setUbterRegNo}
                maxLength={8}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Class Roll No. (Max 2)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 15"
                value={classRollNo}
                onChangeText={(t) => setClassRollNo(t.replace(/\D/g, '').slice(0, 2))}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gmail / Email Address *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="student@gmail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Number (10 Digits)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 9876543210"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          {/* Password & Confirm */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Min 8 chars"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Confirm *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Registration Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: THEME.spacing.lg,
    paddingTop: 40,
    backgroundColor: THEME.colors.background,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
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
    ...THEME.shadows.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginBottom: THEME.spacing.lg,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: THEME.radii.md,
    marginBottom: THEME.spacing.md,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: THEME.radii.md,
    marginBottom: THEME.spacing.md,
  },
  successText: {
    fontSize: 12,
    color: '#16A34A',
    flex: 1,
  },
  inputGroup: {
    marginBottom: THEME.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginLeft: 4,
    fontWeight: '600',
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
  textInputDisabled: {
    backgroundColor: '#F1F5F9',
    color: THEME.colors.textMuted,
  },
  row: {
    flexDirection: 'row',
  },
  submitButton: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 14,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
    marginTop: THEME.spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

