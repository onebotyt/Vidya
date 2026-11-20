/**
 * Faculty Students Management Screen
 * Department roster, student search & filtering,
 * Add & Edit student modal with:
 * - 11-digit enrollment number validation (or "Enrollment Number Not Available" toggle saving as Not Assigned)
 * - Max 2-digit class roll number validation
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
import { facultyService } from '../../services/facultyService';
import { StudentRosterItem } from '../../types/faculty';
import { Card, Badge, Button, EmptyState, NotificationBanner, ConfirmDialog } from '../../components/common';

export default function FacultyStudentsScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<'ALL' | 1 | 2 | 3>('ALL');

  const [students, setStudents] = useState<StudentRosterItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add / Edit Student Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRosterItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [enrollmentNotAvailable, setEnrollmentNotAvailable] = useState(false);
  const [classRollNo, setClassRollNo] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [studentYear, setStudentYear] = useState<number>(1);
  const [studentSemester, setStudentSemester] = useState<number>(1);

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentRosterItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadStudents = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await facultyService.getDepartmentStudents();
      setStudents(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load department student roster');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStudents();
  };

  // Open modal for Adding
  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFullName('');
    setEnrollmentNo('');
    setEnrollmentNotAvailable(false);
    setClassRollNo('');
    setEmail('');
    setPhone('');
    setStudentYear(1);
    setStudentSemester(1);
    setModalVisible(true);
  };

  // Open modal for Editing
  const handleOpenEditModal = (student: StudentRosterItem) => {
    setEditingStudent(student);
    setFullName(student.full_name);
    const hasEnrollment =
      student.official_enrollment_no &&
      student.official_enrollment_no !== 'Not Assigned' &&
      student.enrollment_status !== 'Not Assigned';
    setEnrollmentNo(hasEnrollment ? String(student.official_enrollment_no) : '');
    setEnrollmentNotAvailable(!hasEnrollment);
    setClassRollNo(student.class_roll_no !== null && student.class_roll_no !== undefined ? String(student.class_roll_no) : '');
    setEmail(student.email || '');
    setPhone(student.phone || '');
    setStudentYear(student.year || 1);
    setStudentSemester(student.semester || 1);
    setModalVisible(true);
  };

  // Validate & Save Student (Add or Edit)
  const handleSaveStudent = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Student Full Name is required.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Validation Error', 'A valid email address is required.');
      return;
    }

    // 11-digit Enrollment Number Validation
    let cleanEnrollment: string | null = null;
    if (!enrollmentNotAvailable) {
      const trimmed = enrollmentNo.trim();
      if (!/^\d{11}$/.test(trimmed)) {
        Alert.alert(
          'Invalid Enrollment Number',
          'Enrollment Number must be exactly 11 numeric digits.\n\nIf the university has not issued an enrollment number yet, check "Enrollment Number Not Available".'
        );
        return;
      }
      cleanEnrollment = trimmed;
    }

    // Max 2-digit Roll Number Validation
    let cleanRollNo: number | null = null;
    if (classRollNo.trim()) {
      const trimmedRoll = classRollNo.trim();
      if (!/^\d{1,2}$/.test(trimmedRoll)) {
        Alert.alert('Invalid Roll Number', 'Class Roll Number must be a maximum of 2 digits (e.g. 01, 15, 99).');
        return;
      }
      cleanRollNo = parseInt(trimmedRoll, 10);
    }

    setSubmitting(true);
    try {
      if (editingStudent) {
        // Edit existing student
        await facultyService.updateStudent(editingStudent.id || editingStudent.student_id!, {
          full_name: fullName.trim(),
          official_enrollment_no: cleanEnrollment,
          class_roll_no: cleanRollNo,
          email: email.trim(),
          phone: phone.trim() || undefined,
        });
        setSuccessMessage(`Updated student details for ${fullName}!`);
      } else {
        // Add new student
        await facultyService.addStudent({
          full_name: fullName.trim(),
          official_enrollment_no: cleanEnrollment,
          class_roll_no: cleanRollNo,
          email: email.trim(),
          phone: phone.trim() || undefined,
          year: studentYear,
          semester: studentSemester,
        });
        setSuccessMessage(`Enrolled new student ${fullName}!`);
      }

      setModalVisible(false);
      setTimeout(() => setSuccessMessage(null), 3500);
      await loadStudents();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save student details');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Student
  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setDeleting(true);
    try {
      await facultyService.deleteStudent(studentToDelete.id || studentToDelete.student_id!);
      setDeleteDialogOpen(false);
      setSuccessMessage(`Removed student ${studentToDelete.full_name}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadStudents();
    } catch (err: any) {
      Alert.alert('Delete Failed', err?.message || 'Could not delete student record');
    } finally {
      setDeleting(false);
      setStudentToDelete(null);
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesYear = selectedYear === 'ALL' || s.year === selectedYear;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      s.full_name.toLowerCase().includes(q) ||
      (s.official_enrollment_no && s.official_enrollment_no.toLowerCase().includes(q)) ||
      (s.class_roll_no && String(s.class_roll_no).includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q));

    return matchesYear && matchesSearch;
  });

  const totalCount = students.length;
  const assignedCount = students.filter(
    (s) =>
      s.official_enrollment_no &&
      s.official_enrollment_no !== 'Not Assigned' &&
      s.enrollment_status !== 'Not Assigned'
  ).length;
  const unassignedCount = totalCount - assignedCount;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Department Students</Text>
          <Text style={styles.headerSubtitle}>Cohort Roster & Academic Identity</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenAddModal} activeOpacity={0.8}>
          <MaterialCommunityIcons name="account-plus" size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Student</Text>
        </TouchableOpacity>
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
            <Text style={styles.kpiValue}>{totalCount}</Text>
            <Text style={styles.kpiLabel}>Total Students</Text>
          </Card>
          <Card variant="elevated" style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#059669' }]}>{assignedCount}</Text>
            <Text style={styles.kpiLabel}>Enrolled</Text>
          </Card>
          <Card variant="elevated" style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#D97706' }]}>{unassignedCount}</Text>
            <Text style={styles.kpiLabel}>Not Assigned</Text>
          </Card>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, roll no, enrollment..."
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
            <Text style={styles.loadingText}>Loading student roster...</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && filteredStudents.length === 0 && (
          <EmptyState
            icon="account-search-outline"
            title="No Students Found"
            description={
              searchQuery
                ? `No student matching "${searchQuery}" was found.`
                : 'No students enrolled in this cohort yet. Tap "+ Add Student" to onboard students.'
            }
          />
        )}

        {/* Students List */}
        {!loading &&
          filteredStudents.map((student) => {
            const hasEnrollment =
              student.official_enrollment_no &&
              student.official_enrollment_no !== 'Not Assigned' &&
              student.enrollment_status !== 'Not Assigned';

            return (
              <Card key={student.id || student.student_id} variant="elevated" style={styles.studentCard}>
                <View style={styles.studentCardHeader}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>
                      {(student.full_name || 'S').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.studentName}>{student.full_name}</Text>
                    <Text style={styles.studentSub}>
                      {student.email || 'No email provided'}
                    </Text>
                  </View>
                  {student.class_roll_no !== null && student.class_roll_no !== undefined ? (
                    <View style={styles.rollBadge}>
                      <Text style={styles.rollBadgeText}>Roll #{student.class_roll_no}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.studentMetaRow}>
                  <View style={styles.metaCell}>
                    <Text style={styles.metaLabel}>Enrollment No</Text>
                    {hasEnrollment ? (
                      <Text style={styles.metaValMono}>{student.official_enrollment_no}</Text>
                    ) : (
                      <Badge label="Not Assigned" variant="warning" />
                    )}
                  </View>
                  <View style={styles.metaCell}>
                    <Text style={styles.metaLabel}>Year / Sem</Text>
                    <Text style={styles.metaValue}>
                      {student.year ? `${student.year} Yr` : '--'} • Sem {student.semester || '--'}
                    </Text>
                  </View>
                  {student.attendance_percentage !== undefined && (
                    <View style={styles.metaCell}>
                      <Text style={styles.metaLabel}>Attendance</Text>
                      <Text
                        style={[
                          styles.metaValue,
                          {
                            color:
                              student.attendance_percentage >= 75
                                ? '#059669'
                                : student.attendance_percentage >= 60
                                ? '#D97706'
                                : '#DC2626',
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {student.attendance_percentage}%
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions Row */}
                <View style={styles.studentActionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => handleOpenEditModal(student)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="pencil" size={14} color="#2563EB" />
                    <Text style={styles.editBtnText}>Edit Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => {
                      setStudentToDelete(student);
                      setDeleteDialogOpen(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={14} color="#DC2626" />
                    <Text style={styles.deleteBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}
      </ScrollView>

      {/* Add / Edit Student Modal */}
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
                  {editingStudent ? 'Edit Student Details' : 'Add New Student'}
                </Text>
                <Text style={styles.modalSubtitle}>Department Roster & Institutional Verification</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              {/* Full Name */}
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={THEME.colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />

              {/* Enrollment Number & Not Available Checkbox */}
              <View style={styles.enrollmentHeaderRow}>
                <Text style={styles.inputLabel}>Enrollment Number (11 Digits)</Text>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => {
                    const next = !enrollmentNotAvailable;
                    setEnrollmentNotAvailable(next);
                    if (next) setEnrollmentNo('');
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={enrollmentNotAvailable ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={20}
                    color={enrollmentNotAvailable ? '#059669' : THEME.colors.textMuted}
                  />
                  <Text style={styles.checkboxLabel}>Not Available</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.modalInput,
                  enrollmentNotAvailable && styles.inputDisabled,
                ]}
                placeholder={enrollmentNotAvailable ? 'Marked as "Not Assigned"' : 'Enter 11-digit enrollment (e.g. 21005201001)'}
                placeholderTextColor={THEME.colors.textMuted}
                keyboardType="numeric"
                maxLength={11}
                editable={!enrollmentNotAvailable}
                value={enrollmentNo}
                onChangeText={setEnrollmentNo}
              />
              <Text style={styles.fieldHelper}>
                {enrollmentNotAvailable
                  ? 'Status will be saved as "Not Assigned" until official enrollment is issued.'
                  : 'Must contain exactly 11 numeric digits.'}
              </Text>

              {/* Class Roll Number */}
              <Text style={styles.inputLabel}>Class Roll Number (Max 2 Digits)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 01, 15, 45"
                placeholderTextColor={THEME.colors.textMuted}
                keyboardType="numeric"
                maxLength={2}
                value={classRollNo}
                onChangeText={setClassRollNo}
              />
              <Text style={styles.fieldHelper}>Numeric only, 1 to 2 digits.</Text>

              {/* Email */}
              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. student@college.edu"
                placeholderTextColor={THEME.colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              {/* Phone */}
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

              {/* Year & Semester Selectors */}
              {!editingStudent && (
                <View style={styles.yearSemRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>Academic Year</Text>
                    <View style={styles.segmentedRow}>
                      {[1, 2, 3].map((y) => (
                        <TouchableOpacity
                          key={y}
                          style={[styles.segBtn, studentYear === y && styles.segBtnActive]}
                          onPress={() => setStudentYear(y)}
                        >
                          <Text style={[styles.segBtnText, studentYear === y && styles.segBtnTextActive]}>
                            {y} Yr
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.inputLabel}>Semester</Text>
                    <View style={styles.segmentedRow}>
                      {[1, 2, 3, 4, 5, 6].slice(0, 4).map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={[styles.segBtn, studentSemester === s && styles.segBtnActive]}
                          onPress={() => setStudentSemester(s)}
                        >
                          <Text style={[styles.segBtnText, studentSemester === s && styles.segBtnTextActive]}>
                            S{s}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={submitting ? 'Saving...' : editingStudent ? 'Update Details' : 'Add Student'}
                variant="primary"
                onPress={handleSaveStudent}
                loading={submitting}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Student Confirmation Dialog */}
      <ConfirmDialog
        visible={deleteDialogOpen}
        title="Remove Student from Roster"
        message={`Are you sure you want to remove "${studentToDelete?.full_name}"? This action will remove the student from department classes.`}
        confirmText={deleting ? 'Removing...' : 'Remove Student'}
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
    backgroundColor: '#059669',
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
  studentCard: {
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  studentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  studentSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  rollBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radii.sm,
  },
  rollBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  studentMetaRow: {
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
  metaValMono: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    fontFamily: 'monospace',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  studentActionsRow: {
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
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    color: THEME.colors.textMuted,
  },
  enrollmentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkboxLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  fieldHelper: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  yearSemRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: THEME.radii.md,
    padding: 2,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: THEME.radii.sm,
  },
  segBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  segBtnText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  segBtnTextActive: {
    color: '#059669',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: THEME.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
});
