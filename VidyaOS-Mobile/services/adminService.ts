/**
 * Admin Domain API Service
 * Centralizes administrative and institutional operations for VidyaOS.
 */

import { api } from './api';
import { AdminStats, Department, TeacherRecord, RegistrationGates, AuditLogItem } from '../types/admin';

class AdminService {
  /**
   * Fetch aggregate institutional and system statistics
   */
  async getStats(): Promise<AdminStats> {
    const res = await api.get<AdminStats>('/admin/stats');
    if (res.success && res.data) {
      return res.data;
    }
    // Fallback estimation if endpoint returns alternative structure
    const fallback = res.data as any;
    return {
      total_students: fallback?.total_students || 0,
      total_faculty: fallback?.total_faculty || 0,
      total_departments: fallback?.total_departments || 0,
      active_sessions_today: fallback?.active_sessions_today || 0,
      pending_registrations: fallback?.pending_registrations || 0,
      open_bug_reports: fallback?.open_bug_reports || 0,
      server_status: 'HEALTHY',
    };
  }

  /**
   * Fetch faculty & teacher roster
   */
  async getFacultyList(): Promise<TeacherRecord[]> {
    const res = await api.get<TeacherRecord[]>('/admin/teachers');
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Add a new faculty member
   */
  async addFaculty(data: {
    full_name: string;
    email: string;
    employee_id?: string;
    department_id: number;
    phone?: string;
    roles?: string[];
  }): Promise<TeacherRecord> {
    const res = await api.post<TeacherRecord>('/admin/teachers', data);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to add faculty member');
    }
    return res.data;
  }

  /**
   * Update faculty details
   */
  async updateFaculty(id: number, data: Partial<TeacherRecord>): Promise<TeacherRecord> {
    const res = await api.put<TeacherRecord>(`/admin/teachers/${id}`, data);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to update faculty member');
    }
    return res.data;
  }

  /**
   * Update faculty account status (ACTIVE, SUSPENDED, INACTIVE)
   */
  async updateFacultyStatus(id: number, status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'): Promise<void> {
    const res = await api.put(`/admin/teachers/${id}/status`, { status });
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to update faculty status');
    }
  }

  /**
   * Remove / delete faculty member
   */
  async deleteFaculty(id: number): Promise<void> {
    const res = await api.delete(`/admin/teachers/${id}`);
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to delete faculty member');
    }
  }

  /**
   * Assign HOD role to an existing faculty member
   */
  async assignHOD(teacherId: number, departmentId: number): Promise<void> {
    const res = await api.post('/admin/hods/assign-existing', {
      teacher_id: teacherId,
      department_id: departmentId,
    });
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to assign HOD designation');
    }
  }

  /**
   * Revoke HOD role from faculty member
   */
  async revokeHOD(teacherId: number): Promise<void> {
    const res = await api.delete(`/admin/hods/${teacherId}`);
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to revoke HOD designation');
    }
  }

  /**
   * Fetch all academic departments
   */
  async getDepartments(): Promise<Department[]> {
    const res = await api.get<Department[]>('/admin/departments');
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Create new academic department
   */
  async createDepartment(data: {
    name: string;
    code: string;
    degree_duration_years: number;
  }): Promise<Department> {
    const res = await api.post<Department>('/admin/departments', data);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to create department');
    }
    return res.data;
  }

  /**
   * Update academic department
   */
  async updateDepartment(
    id: number,
    data: { name?: string; code?: string; degree_duration_years?: number }
  ): Promise<Department> {
    const res = await api.put<Department>(`/admin/departments/${id}`, data);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to update department');
    }
    return res.data;
  }

  /**
   * Delete or archive department
   */
  async deleteDepartment(id: number): Promise<void> {
    const res = await api.delete(`/admin/departments/${id}`);
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to remove department');
    }
  }

  /**
   * Fetch system registration gates status
   */
  async getRegistrationGates(): Promise<RegistrationGates> {
    const res = await api.get<any>('/admin/registration-gates');
    if (res.success && res.data) {
      return {
        student_registration_enabled: true,
        faculty_registration_enabled: Boolean(
          res.data.common_faculty_open ?? res.data.faculty_registration_enabled ?? true
        ),
        hod_registration_enabled: Boolean(
          res.data.hod_open ?? res.data.hod_registration_enabled ?? false
        ),
      };
    }
    return {
      student_registration_enabled: true,
      faculty_registration_enabled: true,
      hod_registration_enabled: false,
    };
  }

  /**
   * Update system registration gates
   */
  async updateRegistrationGates(gates: RegistrationGates): Promise<RegistrationGates> {
    try {
      await Promise.all([
        api.post('/admin/registration-gates/toggle', {
          target: 'HOD',
          open: Boolean(gates.hod_registration_enabled),
        }),
        api.post('/admin/registration-gates/toggle', {
          target: 'COMMON_FACULTY',
          open: Boolean(gates.faculty_registration_enabled),
        }),
      ]);
    } catch (_) {
      await api.put('/admin/registration-gates', gates).catch(() => {});
    }
    return gates;
  }

  /**
   * Fetch system audit logs
   */
  async getAuditLogs(limit: number = 100): Promise<AuditLogItem[]> {
    const res = await api.get<AuditLogItem[]>(`/admin/audit-logs?limit=${limit}`);
    return res.success && Array.isArray(res.data) ? res.data : [];
  }
}

export const adminService = new AdminService();

