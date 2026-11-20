/**
 * Faculty & HOD Domain API Service
 * Centralizes all network operations for the VidyaOS Faculty Portal.
 */

import { api } from './api';
import {
  FacultyProfile,
  FacultyDashboardStats,
  AttendanceSession,
  LiveCheckInClaim,
  StudentRosterItem,
  FacultyLeaveItem,
} from '../types/faculty';
import { TeachingGroup, StreamPost, Assignment, ClassMember, PdfTimetable } from '../types/student';

class FacultyService {
  /**
   * Fetch current authenticated faculty member profile
   */
  async getProfile(): Promise<FacultyProfile> {
    const res = await api.get<FacultyProfile>('/auth/me');
    if (res.success && res.data) {
      return res.data;
    }
    // Fallback to /faculty/profile if available
    const fallback = await api.get<FacultyProfile>('/faculty/profile');
    if (fallback.success && fallback.data) {
      return fallback.data;
    }
    throw new Error(res.error?.message || 'Failed to load faculty profile');
  }

  /**
   * Fetch aggregate dashboard statistics
   */
  async getDashboardStats(): Promise<FacultyDashboardStats> {
    const [groupsRes, rosterRes, leaveRes, sessionRes] = await Promise.allSettled([
      api.get<TeachingGroup[]>('/teaching-groups?status=ALL'),
      api.get<StudentRosterItem[]>('/hod/students-roster'),
      api.get<{ counts?: { pending?: number } }>('/leave'),
      api.get<AttendanceSession[]>('/attendance/sessions?state=OPEN'),
    ]);

    const activeGroups = groupsRes.status === 'fulfilled' && Array.isArray(groupsRes.value.data) ? groupsRes.value.data.length : 0;
    const rosterCount = rosterRes.status === 'fulfilled' && Array.isArray(rosterRes.value.data) ? rosterRes.value.data.length : 0;
    const pendingLeaves = leaveRes.status === 'fulfilled' && leaveRes.value.data?.counts?.pending !== undefined
      ? leaveRes.value.data.counts.pending
      : 0;
    const openSessions = sessionRes.status === 'fulfilled' && Array.isArray(sessionRes.value.data) ? sessionRes.value.data.length : 0;

    return {
      active_classes_count: activeGroups,
      total_students_enrolled: rosterCount,
      pending_leave_approvals: pendingLeaves,
      open_attendance_sessions: openSessions,
    };
  }

  /**
   * Fetch all teaching groups managed by this faculty
   */
  async getTeachingGroups(): Promise<TeachingGroup[]> {
    const res = await api.get<TeachingGroup[]>('/teaching-groups?status=ALL');
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Create a new teaching group / classroom
   */
  async createTeachingGroup(data: {
    name: string;
    subject_id?: number;
    semester: number;
    component: 'THEORY' | 'PRACTICAL';
  }): Promise<TeachingGroup> {
    const res = await api.post<TeachingGroup>('/teaching-groups', data);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to create teaching group');
    }
    return res.data;
  }

  /**
   * Fetch group details
   */
  async getGroupDetail(groupId: number): Promise<TeachingGroup> {
    const res = await api.get<TeachingGroup>(`/teaching-groups/${groupId}`);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to load classroom details');
    }
    return res.data;
  }

  /**
   * Fetch stream posts for a teaching group
   */
  async getGroupPosts(groupId: number): Promise<StreamPost[]> {
    const res = await api.get<StreamPost[]>(`/teaching-groups/${groupId}/posts`);
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Create a new announcement in class stream
   */
  async createGroupPost(groupId: number, content: string, title?: string): Promise<StreamPost> {
    const res = await api.post<StreamPost>(`/teaching-groups/${groupId}/posts`, {
      content,
      title: title || 'Faculty Notice',
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to publish announcement');
    }
    return res.data;
  }

  /**
   * Fetch classwork (assignments and scheduled tests)
   */
  async getGroupClasswork(groupId: number): Promise<Assignment[]> {
    const res = await api.get<Assignment[]>(`/teaching-groups/${groupId}/classwork`);
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Create new coursework assignment
   */
  async createAssignment(data: {
    group_id: number;
    title: string;
    description?: string;
    due_date?: string;
    max_marks: number;
  }): Promise<Assignment> {
    const res = await api.post<Assignment>('/assignments', data);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to create assignment');
    }
    return res.data;
  }

  /**
   * Fetch class members (faculty + students)
   */
  async getGroupMembers(groupId: number): Promise<{ teachers: ClassMember[]; students: ClassMember[] }> {
    const res = await api.get<{ teachers?: ClassMember[]; students?: ClassMember[] }>(
      `/teaching-groups/${groupId}/members`
    );
    return {
      teachers: res.data?.teachers || [],
      students: res.data?.students || [],
    };
  }

  /**
   * Fetch attendance sessions
   */
  async getAttendanceSessions(stateFilter?: string): Promise<AttendanceSession[]> {
    const url = stateFilter ? `/attendance/sessions?state=${stateFilter}` : '/attendance/sessions';
    const res = await api.get<AttendanceSession[]>(url);
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Create & open a new attendance session
   */
  async createAttendanceSession(data: {
    register_id?: number;
    subject_id?: number;
    year?: number;
    semester?: number;
    topic?: string;
  }): Promise<AttendanceSession> {
    const res = await api.post<AttendanceSession>('/attendance/sessions', data);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to open attendance session');
    }
    return res.data;
  }

  /**
   * Fetch session details with roster & marking state
   */
  async getSessionDetails(sessionId: number): Promise<{
    session: AttendanceSession;
    roster: Array<{
      student_id: number;
      full_name: string;
      class_roll_no?: number | string | null;
      official_enrollment_no?: string | null;
      status: 'PRESENT' | 'ABSENT' | 'LATE';
    }>;
  }> {
    const res = await api.get<{
      session: AttendanceSession;
      roster: any[];
    }>(`/attendance/sessions/${sessionId}`);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to load session details');
    }
    return res.data;
  }

  /**
   * Transition session lifecycle state (OPEN, CLOSED, FINALIZED)
   */
  async transitionSessionState(
    sessionId: number,
    state: 'DRAFT' | 'OPEN' | 'CLOSED' | 'FINALIZED'
  ): Promise<AttendanceSession> {
    const res = await api.put<AttendanceSession>(`/attendance/sessions/${sessionId}/state`, {
      state,
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to update session state');
    }
    return res.data;
  }

  /**
   * Generate 6-digit rolling PIN for active session
   */
  async generatePin(sessionId: number): Promise<{ pin_code: string; expires_in?: number }> {
    const res = await api.post<{ pin_code: string; expires_in?: number }>(
      `/attendance/sessions/${sessionId}/pin`,
      {}
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to generate PIN');
    }
    return res.data;
  }

  /**
   * Generate dynamic QR token for visual scanning
   */
  async generateQr(sessionId: number): Promise<{ qr_token: string; expires_in?: number }> {
    const res = await api.post<{ qr_token: string; expires_in?: number }>(
      `/attendance/sessions/${sessionId}/qr`,
      {}
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to generate QR token');
    }
    return res.data;
  }

  /**
   * Fetch student self-attendance claims for live adjudication feed
   */
  async getSelfAttendanceClaims(sessionId: number): Promise<LiveCheckInClaim[]> {
    const res = await api.get<LiveCheckInClaim[]>(`/attendance/sessions/${sessionId}/self-attendance`);
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Adjudicate (ACCEPT/REJECT) a student check-in claim
   */
  async adjudicateClaim(sessionId: number, reqId: number, action: 'ACCEPT' | 'REJECT'): Promise<void> {
    const res = await api.post(`/attendance/sessions/${sessionId}/self-attendance/${reqId}/adjudicate`, {
      action,
    });
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to process student claim');
    }
  }

  /**
   * Save bulk attendance records (Manual Roll-Call)
   */
  async saveAttendanceRecords(
    sessionId: number,
    records: Array<{ student_id: number; status: 'PRESENT' | 'ABSENT' | 'LATE' }>
  ): Promise<void> {
    const res = await api.post(`/attendance/sessions/${sessionId}/records`, { records });
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to save attendance records');
    }
  }

  /**
   * Fetch department student roster
   */
  async getDepartmentStudents(): Promise<StudentRosterItem[]> {
    let res = await api.get<StudentRosterItem[]>('/hod/students-roster');
    if (!res.success || !Array.isArray(res.data)) {
      res = await api.get<StudentRosterItem[]>('/faculty/my-students');
    }
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Add a new student with strict validation
   */
  async addStudent(data: {
    full_name: string;
    official_enrollment_no?: string | null;
    class_roll_no?: number | string | null;
    email: string;
    phone?: string;
    semester?: number;
    year?: number;
  }): Promise<StudentRosterItem> {
    const res = await api.post<StudentRosterItem>('/students', data);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to add student');
    }
    return res.data;
  }

  /**
   * Edit student details
   */
  async updateStudent(
    studentId: number,
    data: {
      full_name?: string;
      official_enrollment_no?: string | null;
      class_roll_no?: number | string | null;
      email?: string;
      phone?: string;
      status?: string;
    }
  ): Promise<StudentRosterItem> {
    const res = await api.put<StudentRosterItem>(`/students/${studentId}`, data);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to update student');
    }
    return res.data;
  }

  /**
   * Fetch student leave requests pending faculty review
   */
  async getDepartmentLeaves(): Promise<{ leaves: FacultyLeaveItem[]; counts: { pending: number; approved: number; rejected: number } }> {
    const res = await api.get<{ data?: FacultyLeaveItem[]; counts?: { pending: number; approved: number; rejected: number } }>('/leave');
    const leaves = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
    const counts = res.data?.counts || { pending: 0, approved: 0, rejected: 0 };
    return { leaves, counts };
  }

  /**
   * Approve or reject a student leave application
   */
  async decideLeave(
    leaveId: number,
    decision: 'APPROVED' | 'REJECTED',
    reviewNote?: string
  ): Promise<void> {
    const res = await api.put(`/leave/${leaveId}/decision`, {
      decision,
      review_note: reviewNote || '',
    });
    if (!res.success) {
      throw new Error(res.error?.message || `Failed to ${decision.toLowerCase()} leave application`);
    }
  }

  /**
   * Fetch PDF timetables for the department/year cohorts
   */
  async getPdfTimetables(): Promise<PdfTimetable[]> {
    const res = await api.get<PdfTimetable[]>('/timetable/pdf');
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Delete student from department roster
   */
  async deleteStudent(studentId: number): Promise<void> {
    const res = await api.delete(`/students/${studentId}`);
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to delete student');
    }
  }
}

export const facultyService = new FacultyService();
