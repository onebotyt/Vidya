/**
 * Student Profile & KYC Dossier Screen
 * Features:
 * - Academic identity & cohort badges
 * - Demographic KYC details view/edit (Aadhar, DOB, Father's Name, Category, Address)
 * - Security settings (Change Password) and Logout with ConfirmDialog
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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { studentService } from '../../services/studentService';
import { StudentProfile } from '../../types/student';
import { useAuth } from '../../hooks/useAuth';
import { Card, Badge, Button, ConfirmDialog, NotificationBanner } from '../../components/common';

export default function StudentProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingKyc, setEditingKyc] = useState(false);
  const [savingKyc, setSavingKyc] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editable KYC fields
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [category, setCategory] = useState('');
  const [aadhar, setAadhar] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await studentService.getProfile();
      setProfile(data);

      setFatherName(data.father_name || '');
      setMotherName(data.mother_name || '');
      setDob(data.dob || '');
      setGender(data.gender || '');
      setCategory(data.category || '');
      setAadhar(data.aadhar_number || '');
      setPhone(data.phone || data.student_phone || '');
      setAddress(data.address || '');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleSaveKyc = async () => {
    try {
      setSavingKyc(true);
      setErrorMessage(null);
      await studentService.updateProfile({
        father_name: fatherName,
        mother_name: motherName,
        dob,
        gender,
        category,
        aadhar_number: aadhar,
        phone,
        address,
      });
      setSuccessMessage('KYC dossier updated successfully!');
      setEditingKyc(false);
      await loadProfile();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update KYC profile');
    } finally {
      setSavingKyc(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    await logout();
    router.replace('/(auth)/login');
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Loading profile dossier...</Text>
      </View>
    );
  }

  const initials = (profile?.full_name || 'ST')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Identity & Dossier</Text>
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

        {successMessage && (
          <NotificationBanner
            type="success"
            message={successMessage}
            onDismiss={() => setSuccessMessage(null)}
            style={{ marginBottom: THEME.spacing.md }}
          />
        )}

        {/* Hero Identity Card */}
        <Card style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName} numberOfLines={1}>
                {profile?.full_name}
              </Text>
              <Text style={styles.heroEmail} numberOfLines={1}>
                {profile?.email}
              </Text>
              <View style={styles.heroBadges}>
                <Badge
                  label={profile?.department_name || 'Department'}
                  variant="info"
                />
                <Badge
                  label={`Sem ${profile?.semester || 1}`}
                  variant="neutral"
                />
              </View>
            </View>
          </View>
        </Card>

        {/* ─── SECTION 1: ACADEMIC CREDENTIALS ─────────────────────── */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Academic Credentials</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Official Enrollment No:</Text>
            <Text style={styles.infoValue}>
              {profile?.official_enrollment_no || 'Not Assigned'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Class Roll Number:</Text>
            <Text style={styles.infoValue}>
              {profile?.class_roll_no ? `${profile.class_roll_no}` : '—'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>UBTER Registration No:</Text>
            <Text style={styles.infoValue}>{profile?.registration_no || '—'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department / Branch:</Text>
            <Text style={styles.infoValue}>
              {profile?.department_name || profile?.branch_name || 'Engineering'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Year & Term:</Text>
            <Text style={styles.infoValue}>
              Year {profile?.year || 1} • Semester {profile?.semester || 1}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Academic Cohort:</Text>
            <Text style={styles.infoValue}>
              {profile?.academic_year_label || 'Current Academic Session'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Faculty Advisor / Class Teacher:</Text>
            <Text style={styles.infoValue}>
              {profile?.class_teacher_name || 'Department Faculty'}
            </Text>
          </View>
        </Card>

        {/* ─── SECTION 2: DEMOGRAPHIC & KYC DOSSIER ─────────────────── */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Demographic & KYC Dossier</Text>
            <TouchableOpacity
              onPress={() => {
                if (editingKyc) {
                  setEditingKyc(false);
                } else {
                  setEditingKyc(true);
                }
              }}
            >
              <Text style={styles.editToggleText}>
                {editingKyc ? 'Cancel' : 'Edit KYC'}
              </Text>
            </TouchableOpacity>
          </View>

          {editingKyc ? (
            /* EDITABLE KYC FORM */
            <View style={styles.kycEditForm}>
              <Text style={styles.fieldLabel}>Father's Full Name:</Text>
              <TextInput
                style={styles.fieldInput}
                value={fatherName}
                onChangeText={setFatherName}
                placeholder="Father's Name"
              />

              <Text style={styles.fieldLabel}>Mother's Full Name:</Text>
              <TextInput
                style={styles.fieldInput}
                value={motherName}
                onChangeText={setMotherName}
                placeholder="Mother's Name"
              />

              <Text style={styles.fieldLabel}>Date of Birth (YYYY-MM-DD):</Text>
              <TextInput
                style={styles.fieldInput}
                value={dob}
                onChangeText={setDob}
                placeholder="2004-06-21"
              />

              <Text style={styles.fieldLabel}>Gender:</Text>
              <TextInput
                style={styles.fieldInput}
                value={gender}
                onChangeText={setGender}
                placeholder="Male / Female / Other"
              />

              <Text style={styles.fieldLabel}>Social Category:</Text>
              <TextInput
                style={styles.fieldInput}
                value={category}
                onChangeText={setCategory}
                placeholder="GEN / OBC / SC / ST / EWS"
              />

              <Text style={styles.fieldLabel}>Aadhar UID (12 digits):</Text>
              <TextInput
                style={styles.fieldInput}
                value={aadhar}
                onChangeText={setAadhar}
                placeholder="XXXX-XXXX-XXXX"
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Contact Mobile Number:</Text>
              <TextInput
                style={styles.fieldInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="10-digit mobile"
                keyboardType="phone-pad"
              />

              <Text style={styles.fieldLabel}>Permanent Residential Address:</Text>
              <TextInput
                style={[styles.fieldInput, { height: 60, textAlignVertical: 'top' }]}
                value={address}
                onChangeText={setAddress}
                placeholder="Full address"
                multiline
              />

              <Button
                title="Save KYC Details"
                variant="primary"
                loading={savingKyc}
                onPress={handleSaveKyc}
                style={{ marginTop: 10 }}
              />
            </View>
          ) : (
            /* READ-ONLY KYC DISPLAY */
            <View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Father's Name:</Text>
                <Text style={styles.infoValue}>{profile?.father_name || '—'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mother's Name:</Text>
                <Text style={styles.infoValue}>{profile?.mother_name || '—'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date of Birth:</Text>
                <Text style={styles.infoValue}>{profile?.dob || '—'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Gender:</Text>
                <Text style={styles.infoValue}>{profile?.gender || '—'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Category:</Text>
                <Text style={styles.infoValue}>{profile?.category || 'General'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Aadhar Number:</Text>
                <Text style={styles.infoValue}>
                  {profile?.aadhar_number
                    ? `•••• •••• ${profile.aadhar_number.slice(-4)}`
                    : '—'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>
                  {profile?.phone || profile?.student_phone || '—'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={styles.infoValue}>{profile?.address || '—'}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* ─── SECTION 3: ACCOUNT SECURITY & ACTIONS ───────────────── */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Account & Security</Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/(auth)/change-password')}
          >
            <MaterialCommunityIcons name="lock-reset" size={22} color={THEME.colors.primary} />
            <Text style={styles.actionRowText}>Change Account Password</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/(student)/bug-report')}
          >
            <MaterialCommunityIcons name="bug-outline" size={22} color={THEME.colors.danger} />
            <Text style={styles.actionRowText}>Report a Technical Problem</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { borderBottomWidth: 0 }]}
            onPress={() => setShowLogoutDialog(true)}
          >
            <MaterialCommunityIcons name="logout" size={22} color={THEME.colors.danger} />
            <Text style={[styles.actionRowText, { color: THEME.colors.danger, fontWeight: '700' }]}>
              Sign Out of VidyaOS
            </Text>
          </TouchableOpacity>
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        visible={showLogoutDialog}
        title="Sign Out of VidyaOS?"
        message="Are you sure you want to log out? You will need to sign in with your student credentials again."
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutDialog(false)}
      />
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  heroAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 20,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  heroEmail: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  heroBadges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  sectionCard: {
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  editToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    flex: 1,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    textAlign: 'right',
    flex: 1,
  },
  kycEditForm: {
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  actionRowText: {
    flex: 1,
    fontSize: 14,
    color: THEME.colors.textPrimary,
    fontWeight: '500',
  },
});
