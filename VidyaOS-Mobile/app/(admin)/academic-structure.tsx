/**
 * Admin Academic Structure & Registration Gates Screen
 * Features:
 * - Academic Departments directory (add, edit, remove)
 * - Security Registration Gates (Student & Faculty onboarding toggles)
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
  Switch,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { adminService } from '../../services/adminService';
import { Department, RegistrationGates } from '../../types/admin';
import { Card, Badge, Button, EmptyState, NotificationBanner, ConfirmDialog } from '../../components/common';

export default function AdminAcademicStructureScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'DEPTS' | 'GATES'>('DEPTS');

  // Departments State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [durationYears, setDurationYears] = useState('3');
  const [savingDept, setSavingDept] = useState(false);

  // Delete Dept State
  const [deleteDeptOpen, setDeleteDeptOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState(false);

  // Registration Gates State
  const [gates, setGates] = useState<RegistrationGates>({
    student_registration_enabled: true,
    faculty_registration_enabled: true,
    hod_registration_enabled: false,
  });
  const [savingGates, setSavingGates] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [deptRes, gatesRes] = await Promise.allSettled([
        adminService.getDepartments(),
        adminService.getRegistrationGates(),
      ]);

      if (deptRes.status === 'fulfilled') setDepartments(deptRes.value);
      if (gatesRes.status === 'fulfilled') setGates(gatesRes.value);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load academic structure');
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

  // Open Add Dept Modal
  const handleOpenAddDept = () => {
    setEditingDept(null);
    setDeptName('');
    setDeptCode('');
    setDurationYears('3');
    setDeptModalOpen(true);
  };

  // Open Edit Dept Modal
  const handleOpenEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptCode(dept.code);
    setDurationYears(String(dept.degree_duration_years || 3));
    setDeptModalOpen(true);
  };

  // Save Department (Add or Edit)
  const handleSaveDept = async () => {
    if (!deptName.trim()) {
      Alert.alert('Required Field', 'Please enter the department name.');
      return;
    }
    if (!deptCode.trim()) {
      Alert.alert('Required Field', 'Please enter a short code (e.g. IT, ME, CE).');
      return;
    }

    setSavingDept(true);
    try {
      const years = parseInt(durationYears, 10) || 3;
      if (editingDept) {
        await adminService.updateDepartment(editingDept.id, {
          name: deptName.trim(),
          code: deptCode.trim().toUpperCase(),
          degree_duration_years: years,
        });
        setSuccessMessage(`Updated department ${deptName}!`);
      } else {
        await adminService.createDepartment({
          name: deptName.trim(),
          code: deptCode.trim().toUpperCase(),
          degree_duration_years: years,
        });
        setSuccessMessage(`Created department ${deptName}!`);
      }

      setDeptModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadData();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save department');
    } finally {
      setSavingDept(false);
    }
  };

  // Delete Department
  const handleConfirmDeleteDept = async () => {
    if (!deptToDelete) return;
    setDeletingDept(true);
    try {
      await adminService.deleteDepartment(deptToDelete.id);
      setDeleteDeptOpen(false);
      setSuccessMessage(`Removed department ${deptToDelete.name}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadData();
    } catch (err: any) {
      Alert.alert('Delete Failed', err?.message || 'Could not delete department');
    } finally {
      setDeletingDept(false);
      setDeptToDelete(null);
    }
  };

  // Save Registration Gates Toggles
  const handleToggleGate = async (key: keyof RegistrationGates, value: boolean) => {
    const updated = { ...gates, [key]: value };
    setGates(updated);
    setSavingGates(true);
    try {
      await adminService.updateRegistrationGates(updated);
      setSuccessMessage('Registration gate policies updated!');
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      Alert.alert('Gate Update Error', err?.message || 'Failed to update registration policy');
      // Revert on error
      setGates(gates);
    } finally {
      setSavingGates(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Academic Structure</Text>
          <Text style={styles.headerSubtitle}>Departments, Curriculum & Access Gates</Text>
        </View>
        {activeTab === 'DEPTS' && (
          <TouchableOpacity style={styles.addButton} onPress={handleOpenAddDept} activeOpacity={0.8}>
            <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Dept</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'DEPTS' && styles.tabButtonActive]}
          onPress={() => setActiveTab('DEPTS')}
        >
          <MaterialCommunityIcons
            name="domain"
            size={16}
            color={activeTab === 'DEPTS' ? '#7C3AED' : THEME.colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'DEPTS' && styles.tabTextActive]}>
            Departments ({departments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'GATES' && styles.tabButtonActive]}
          onPress={() => setActiveTab('GATES')}
        >
          <MaterialCommunityIcons
            name="shield-lock-outline"
            size={16}
            color={activeTab === 'GATES' ? '#7C3AED' : THEME.colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'GATES' && styles.tabTextActive]}>
            Registration Gates
          </Text>
        </TouchableOpacity>
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
        {successMessage && (
          <NotificationBanner
            type="info"
            message={successMessage}
            onDismiss={() => setSuccessMessage(null)}
            style={{ marginBottom: 12 }}
          />
        )}

        {/* Loading Spinner */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading academic structure...</Text>
          </View>
        )}

        {/* ═══ TAB 1: DEPARTMENTS DIRECTORY ═══ */}
        {activeTab === 'DEPTS' && !loading && (
          <View>
            {departments.length === 0 ? (
              <EmptyState
                icon="domain"
                title="No Departments Configured"
                description="Tap '+ Add Dept' to create institutional academic branches."
              />
            ) : (
              departments.map((dept) => (
                <Card key={dept.id} variant="elevated" style={styles.deptCard}>
                  <View style={styles.deptCardHeader}>
                    <View style={styles.deptCodeBadge}>
                      <Text style={styles.deptCodeText}>{dept.code}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.deptName}>{dept.name}</Text>
                      <Text style={styles.deptSub}>
                        {dept.degree_duration_years || 3} Years Curriculum • {dept.hod_name ? `HOD: ${dept.hod_name}` : 'No HOD Assigned'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.deptMetaRow}>
                    <View style={styles.metaCell}>
                      <Text style={styles.metaLabel}>Total Faculty</Text>
                      <Text style={styles.metaVal}>{dept.total_faculty ?? '--'}</Text>
                    </View>
                    <View style={styles.metaCell}>
                      <Text style={styles.metaLabel}>Students</Text>
                      <Text style={styles.metaVal}>{dept.total_students ?? '--'}</Text>
                    </View>
                    <View style={styles.metaCell}>
                      <Text style={styles.metaLabel}>Status</Text>
                      <Badge label="Active" variant="success" />
                    </View>
                  </View>

                  <View style={styles.deptActionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.editBtn]}
                      onPress={() => handleOpenEditDept(dept)}
                    >
                      <MaterialCommunityIcons name="pencil" size={14} color="#2563EB" />
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => {
                        setDeptToDelete(dept);
                        setDeleteDeptOpen(true);
                      }}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={14} color="#DC2626" />
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {/* ═══ TAB 2: REGISTRATION GATES ═══ */}
        {activeTab === 'GATES' && !loading && (
          <View>
            <Card variant="elevated" style={styles.gateNoticeCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <MaterialCommunityIcons name="shield-check" size={20} color="#7C3AED" />
                <Text style={styles.gateNoticeTitle}>Access Control Policy</Text>
              </View>
              <Text style={styles.gateNoticeText}>
                Registration gates control whether prospective students, faculty members, or HODs are permitted
                to submit new onboarding applications through the mobile app.
              </Text>
            </Card>

            <Card variant="outlined" style={styles.gateCard}>
              {/* Student Gate */}
              <View style={styles.toggleRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.toggleTitle}>Student Self-Registration Gate</Text>
                  <Text style={styles.toggleSub}>
                    When active, students can register with their branch, 11-digit enrollment number, and roll number.
                  </Text>
                </View>
                <Switch
                  value={gates.student_registration_enabled}
                  onValueChange={(val) => handleToggleGate('student_registration_enabled', val)}
                  trackColor={{ false: '#E2E8F0', true: '#C4B5FD' }}
                  thumbColor={gates.student_registration_enabled ? '#7C3AED' : '#94A3B8'}
                  disabled={savingGates}
                />
              </View>

              {/* Faculty Gate */}
              <View style={[styles.toggleRow, styles.borderTop]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.toggleTitle}>Faculty Onboarding Gate</Text>
                  <Text style={styles.toggleSub}>
                    When active, new teachers can submit registration for institutional verification.
                  </Text>
                </View>
                <Switch
                  value={gates.faculty_registration_enabled}
                  onValueChange={(val) => handleToggleGate('faculty_registration_enabled', val)}
                  trackColor={{ false: '#E2E8F0', true: '#C4B5FD' }}
                  thumbColor={gates.faculty_registration_enabled ? '#7C3AED' : '#94A3B8'}
                  disabled={savingGates}
                />
              </View>

              {/* HOD Gate */}
              <View style={[styles.toggleRow, styles.borderTop]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.toggleTitle}>Direct HOD Self-Registration Gate</Text>
                  <Text style={styles.toggleSub}>
                    Allow department heads to register directly (recommended to keep off).
                  </Text>
                </View>
                <Switch
                  value={Boolean(gates.hod_registration_enabled)}
                  onValueChange={(val) => handleToggleGate('hod_registration_enabled', val)}
                  trackColor={{ false: '#E2E8F0', true: '#C4B5FD' }}
                  thumbColor={gates.hod_registration_enabled ? '#7C3AED' : '#94A3B8'}
                  disabled={savingGates}
                />
              </View>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Add / Edit Department Modal */}
      <Modal
        visible={deptModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDeptModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingDept ? 'Edit Department' : 'Create Academic Department'}
                </Text>
                <Text style={styles.modalSubtitle}>Academic Branch & Curriculum Master</Text>
              </View>
              <TouchableOpacity onPress={() => setDeptModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Department Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Information Technology"
                placeholderTextColor={THEME.colors.textMuted}
                value={deptName}
                onChangeText={setDeptName}
              />

              <Text style={styles.inputLabel}>Short Code *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. IT, ME, CE, EE"
                placeholderTextColor={THEME.colors.textMuted}
                autoCapitalize="characters"
                maxLength={6}
                value={deptCode}
                onChangeText={setDeptCode}
              />

              <Text style={styles.inputLabel}>Degree Duration (Years)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="3"
                placeholderTextColor={THEME.colors.textMuted}
                keyboardType="numeric"
                maxLength={1}
                value={durationYears}
                onChangeText={setDurationYears}
              />
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setDeptModalOpen(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={savingDept ? 'Saving...' : editingDept ? 'Update' : 'Create'}
                variant="primary"
                onPress={handleSaveDept}
                loading={savingDept}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Department Confirmation Dialog */}
      <ConfirmDialog
        visible={deleteDeptOpen}
        title="Delete Academic Department"
        message={`Are you sure you want to remove the department "${deptToDelete?.name}"? Make sure no active classes or students are enrolled.`}
        confirmText={deletingDept ? 'Deleting...' : 'Delete Department'}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDeleteDept}
        onCancel={() => setDeleteDeptOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.xl,
    paddingBottom: THEME.spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radii.md,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabButtonActive: {
    borderBottomColor: '#7C3AED',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  tabTextActive: {
    color: '#7C3AED',
  },
  content: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
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
  deptCard: {
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  deptCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deptCodeBadge: {
    width: 44,
    height: 44,
    borderRadius: THEME.radii.md,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deptCodeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7C3AED',
  },
  deptName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  deptSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  deptMetaRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    justifyContent: 'space-between',
  },
  metaCell: {
    alignItems: 'flex-start',
  },
  metaLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  deptActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radii.sm,
    gap: 4,
  },
  editBtn: {
    backgroundColor: '#EFF6FF',
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  gateNoticeCard: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    borderWidth: 1,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  gateNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6D28D9',
  },
  gateNoticeText: {
    fontSize: 11,
    color: '#5B21B6',
    lineHeight: 16,
  },
  gateCard: {
    padding: 0,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  toggleSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: THEME.radii.lg,
    borderTopRightRadius: THEME.radii.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  modalBody: {
    padding: THEME.spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: THEME.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
});
