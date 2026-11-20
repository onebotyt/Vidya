/**
 * Admin Faculty Management Screen
 * Searchable faculty directory, add/edit faculty,
 * assign/revoke HOD role, toggle status (ACTIVE / SUSPENDED),
 * and delete faculty with ConfirmDialog.
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
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { adminService } from '../../services/adminService';
import { TeacherRecord, Department } from '../../types/admin';
import { Card, Badge, Button, EmptyState, NotificationBanner, ConfirmDialog } from '../../components/common';

export default function AdminFacultyManagementScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<number | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  const [facultyList, setFacultyList] = useState<TeacherRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add / Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [departmentId, setDepartmentId] = useState<number>(0);
  const [phone, setPhone] = useState('');
  const [isHodCheckbox, setIsHodCheckbox] = useState(false);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [facRes, deptRes] = await Promise.allSettled([
        adminService.getFacultyList(),
        adminService.getDepartments(),
      ]);

      if (facRes.status === 'fulfilled') setFacultyList(facRes.value);
      if (deptRes.status === 'fulfilled') {
        setDepartments(deptRes.value);
        if (deptRes.value.length > 0 && !departmentId) {
          setDepartmentId(deptRes.value[0].id);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load faculty directory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [departmentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingTeacher(null);
    setFullName('');
    setEmail('');
    setEmployeeId('');
    setPhone('');
    setIsHodCheckbox(false);
    if (departments.length > 0) setDepartmentId(departments[0].id);
    setModalVisible(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (teacher: TeacherRecord) => {
    setEditingTeacher(teacher);
    setFullName(teacher.full_name);
    setEmail(teacher.email);
    setEmployeeId(teacher.employee_id || '');
    setDepartmentId(teacher.department_id);
    setPhone(teacher.phone || '');
    setIsHodCheckbox(Boolean(teacher.is_hod || teacher.roles?.includes('HOD')));
    setModalVisible(true);
  };

  // Save (Add or Edit)
  const handleSaveFaculty = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter the faculty member full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Required Field', 'Please enter a valid official email address.');
      return;
    }
    if (!departmentId) {
      Alert.alert('Required Field', 'Please select a department for this instructor.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingTeacher) {
        await adminService.updateFaculty(editingTeacher.id, {
          full_name: fullName.trim(),
          email: email.trim(),
          employee_id: employeeId.trim() || undefined,
          department_id: departmentId,
          phone: phone.trim() || undefined,
        });

        // Handle HOD assignment toggle if changed
        const currentlyHod = Boolean(editingTeacher.is_hod || editingTeacher.roles?.includes('HOD'));
        if (isHodCheckbox && !currentlyHod) {
          await adminService.assignHOD(editingTeacher.id, departmentId);
        } else if (!isHodCheckbox && currentlyHod) {
          await adminService.revokeHOD(editingTeacher.id);
        }

        setSuccessMessage(`Updated details for ${fullName}!`);
      } else {
        const roles = ['TEACHER'];
        if (isHodCheckbox) roles.push('HOD');

        await adminService.addFaculty({
          full_name: fullName.trim(),
          email: email.trim(),
          employee_id: employeeId.trim() || undefined,
          department_id: departmentId,
          phone: phone.trim() || undefined,
          roles,
        });
        setSuccessMessage(`Enrolled new faculty member ${fullName}!`);
      }

      setModalVisible(false);
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadData();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Failed to save faculty record');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle HOD Assignment
  const handleToggleHOD = async (teacher: TeacherRecord) => {
    const isHod = Boolean(teacher.is_hod || teacher.roles?.includes('HOD'));
    try {
      if (isHod) {
        await adminService.revokeHOD(teacher.id);
        setSuccessMessage(`Revoked HOD designation from ${teacher.full_name}.`);
      } else {
        await adminService.assignHOD(teacher.id, teacher.department_id);
        setSuccessMessage(`Assigned ${teacher.full_name} as Department HOD!`);
      }
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadData();
    } catch (err: any) {
      Alert.alert('HOD Assignment Error', err?.message || 'Could not update HOD designation');
    }
  };

  // Toggle Account Status (ACTIVE / SUSPENDED)
  const handleToggleStatus = async (teacher: TeacherRecord) => {
    const newStatus = teacher.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await adminService.updateFacultyStatus(teacher.id, newStatus);
      setSuccessMessage(`Faculty account status updated to ${newStatus}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadData();
    } catch (err: any) {
      Alert.alert('Status Error', err?.message || 'Could not update account status');
    }
  };

  // Delete Faculty
  const handleConfirmDelete = async () => {
    if (!teacherToDelete) return;
    setDeleting(true);
    try {
      await adminService.deleteFaculty(teacherToDelete.id);
      setDeleteDialogOpen(false);
      setSuccessMessage(`Removed faculty record for ${teacherToDelete.full_name}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadData();
    } catch (err: any) {
      Alert.alert('Delete Failed', err?.message || 'Could not delete faculty member');
    } finally {
      setDeleting(false);
      setTeacherToDelete(null);
    }
  };

  // Filtered List
  const filteredList = facultyList.filter((t) => {
    const matchesDept = selectedDeptId === 'ALL' || t.department_id === selectedDeptId;
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      t.full_name.toLowerCase().includes(query) ||
      t.email.toLowerCase().includes(query) ||
      (t.employee_id && t.employee_id.toLowerCase().includes(query));

    return matchesDept && matchesStatus && matchesSearch;
  });

  const totalTeachers = facultyList.length;
  const hodCount = facultyList.filter((t) => t.is_hod || t.roles?.includes('HOD')).length;
  const activeCount = facultyList.filter((t) => t.status === 'ACTIVE').length;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Faculty Directory</Text>
          <Text style={styles.headerSubtitle}>Teachers, Lecturers & HOD Appointments</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenAddModal} activeOpacity={0.8}>
          <MaterialCommunityIcons name="account-plus" size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Faculty</Text>
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

        {/* Telemetry KPI Cards */}
        <View style={styles.kpiRow}>
          <Card variant="elevated" style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{totalTeachers}</Text>
            <Text style={styles.kpiLabel}>Total Faculty</Text>
          </Card>
          <Card variant="elevated" style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#7C3AED' }]}>{hodCount}</Text>
            <Text style={styles.kpiLabel}>HODs</Text>
          </Card>
          <Card variant="elevated" style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#059669' }]}>{activeCount}</Text>
            <Text style={styles.kpiLabel}>Active</Text>
          </Card>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, employee ID..."
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

        {/* Department Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedDeptId === 'ALL' && styles.filterChipActive]}
            onPress={() => setSelectedDeptId('ALL')}
          >
            <Text style={[styles.filterChipText, selectedDeptId === 'ALL' && styles.filterChipTextActive]}>
              All Departments
            </Text>
          </TouchableOpacity>
          {departments.map((dept) => (
            <TouchableOpacity
              key={dept.id}
              style={[styles.filterChip, selectedDeptId === dept.id && styles.filterChipActive]}
              onPress={() => setSelectedDeptId(dept.id)}
            >
              <Text style={[styles.filterChipText, selectedDeptId === dept.id && styles.filterChipTextActive]}>
                {dept.code || dept.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loading Spinner */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading faculty directory...</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && filteredList.length === 0 && (
          <EmptyState
            icon="account-search-outline"
            title="No Faculty Found"
            description={
              searchQuery
                ? `No instructor matching "${searchQuery}" was found.`
                : 'No faculty members enrolled in this department yet. Tap "+ Add Faculty" to onboarding instructors.'
            }
          />
        )}

        {/* Faculty List */}
        {!loading &&
          filteredList.map((teacher) => {
            const isHod = Boolean(teacher.is_hod || teacher.roles?.includes('HOD'));
            const isActive = teacher.status === 'ACTIVE';

            return (
              <Card key={teacher.id} variant="elevated" style={styles.teacherCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.teacherAvatar}>
                    <Text style={styles.teacherAvatarText}>
                      {(teacher.full_name || 'F').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.teacherName}>{teacher.full_name}</Text>
                      {isHod && (
                        <View style={styles.hodBadge}>
                          <MaterialCommunityIcons name="crown" size={12} color="#D97706" />
                          <Text style={styles.hodBadgeText}>HOD</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.teacherEmail}>{teacher.email}</Text>
                  </View>
                  <Badge label={teacher.status || 'ACTIVE'} variant={isActive ? 'success' : 'danger'} />
                </View>

                {/* Meta details */}
                <View style={styles.metaRow}>
                  <View style={styles.metaCell}>
                    <Text style={styles.metaLabel}>Department</Text>
                    <Text style={styles.metaVal}>{teacher.department_name || 'General'}</Text>
                  </View>
                  {teacher.employee_id && (
                    <View style={styles.metaCell}>
                      <Text style={styles.metaLabel}>Emp ID</Text>
                      <Text style={styles.metaValMono}>{teacher.employee_id}</Text>
                    </View>
                  )}
                  {teacher.phone && (
                    <View style={styles.metaCell}>
                      <Text style={styles.metaLabel}>Phone</Text>
                      <Text style={styles.metaVal}>{teacher.phone}</Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons Row */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => handleOpenEditModal(teacher)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="pencil" size={14} color="#2563EB" />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, isHod ? styles.revokeBtn : styles.assignHodBtn]}
                    onPress={() => handleToggleHOD(teacher)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={isHod ? 'crown-outline' : 'crown'}
                      size={14}
                      color={isHod ? '#D97706' : '#7C3AED'}
                    />
                    <Text style={[styles.assignHodBtnText, isHod && { color: '#D97706' }]}>
                      {isHod ? 'Revoke HOD' : 'Assign HOD'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, isActive ? styles.suspendBtn : styles.activateBtn]}
                    onPress={() => handleToggleStatus(teacher)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={isActive ? 'account-off-outline' : 'account-check-outline'}
                      size={14}
                      color={isActive ? '#D97706' : '#059669'}
                    />
                    <Text style={[styles.suspendBtnText, !isActive && { color: '#059669' }]}>
                      {isActive ? 'Suspend' : 'Activate'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => {
                      setTeacherToDelete(teacher);
                      setDeleteDialogOpen(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={14} color="#DC2626" />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}
      </ScrollView>

      {/* Add / Edit Faculty Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingTeacher ? 'Edit Faculty Details' : 'Add New Faculty Member'}
                </Text>
                <Text style={styles.modalSubtitle}>Department Instructor & Academic Credentials</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Dr. Ramesh Verma"
                placeholderTextColor={THEME.colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={styles.inputLabel}>Official Email Address *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. ramesh.verma@college.edu"
                placeholderTextColor={THEME.colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.inputLabel}>Employee ID (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. FAC-2024-001"
                placeholderTextColor={THEME.colors.textMuted}
                value={employeeId}
                onChangeText={setEmployeeId}
              />

              <Text style={styles.inputLabel}>Academic Department *</Text>
              <View style={styles.deptPicker}>
                {departments.map((dept) => {
                  const isSelected = departmentId === dept.id;
                  return (
                    <TouchableOpacity
                      key={dept.id}
                      style={[styles.deptOption, isSelected && styles.deptOptionSelected]}
                      onPress={() => setDepartmentId(dept.id)}
                    >
                      <MaterialCommunityIcons
                        name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                        size={18}
                        color={isSelected ? '#7C3AED' : THEME.colors.textMuted}
                      />
                      <Text style={[styles.deptOptionText, isSelected && styles.deptOptionTextActive]}>
                        {dept.name} ({dept.code})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Mobile Phone (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 9876543210"
                placeholderTextColor={THEME.colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />

              <TouchableOpacity
                style={styles.hodCheckboxRow}
                onPress={() => setIsHodCheckbox(!isHodCheckbox)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={isHodCheckbox ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={22}
                  color={isHodCheckbox ? '#7C3AED' : THEME.colors.textMuted}
                />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={styles.hodCheckboxTitle}>Designate as Head of Department (HOD)</Text>
                  <Text style={styles.hodCheckboxSub}>Grants curriculum management and department approval privileges</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={submitting ? 'Saving...' : editingTeacher ? 'Update Details' : 'Add Faculty'}
                variant="primary"
                onPress={handleSaveFaculty}
                loading={submitting}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={deleteDialogOpen}
        title="Remove Faculty Member"
        message={`Are you sure you want to delete the faculty record for "${teacherToDelete?.full_name}"? This will revoke active teaching groups and permissions.`}
        confirmText={deleting ? 'Removing...' : 'Delete Record'}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
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
  content: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: THEME.spacing.md,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  kpiLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 2,
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
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radii.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
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
  teacherCard: {
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7C3AED',
  },
  teacherName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  hodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radii.sm,
    gap: 2,
  },
  hodBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  teacherEmail: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  metaRow: {
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
  metaValMono: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    fontFamily: 'monospace',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: THEME.radii.sm,
    gap: 3,
  },
  editBtn: {
    backgroundColor: '#EFF6FF',
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  assignHodBtn: {
    backgroundColor: '#F5F3FF',
  },
  assignHodBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  revokeBtn: {
    backgroundColor: '#FFFBEB',
  },
  suspendBtn: {
    backgroundColor: '#FFFBEB',
  },
  activateBtn: {
    backgroundColor: '#ECFDF5',
  },
  suspendBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
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
    maxHeight: '90%',
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
  deptPicker: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.md,
    overflow: 'hidden',
  },
  deptOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  deptOptionSelected: {
    backgroundColor: '#F5F3FF',
  },
  deptOptionText: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  deptOptionTextActive: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  hodCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginTop: 14,
  },
  hodCheckboxTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  hodCheckboxSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: THEME.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
});
