/**
 * Student Domain API Service
 * Centralizes all network operations for the VidyaOS Student Portal.
 */

import { api } from './api';
import {
  StudentProfile,
  StudentAttendanceStats,
  SubjectAttendanceRecord,
  AttendanceHistoryItem,
  AttendanceSession,
  TeachingGroup,
  StreamPost,
  StreamComment,
  Assignment,
  AssessmentScore,
  PdfTimetable,
  LeaveApplication,
  ClassMember,
} from '../types/student';

class StudentService {
  /**
   * Fetch current authenticated student profile
   */
  async getProfile(): Promise<StudentProfile> {
    const res = await api.get<StudentProfile>('/students/me');
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to load student profile');
    }
    return res.data;
  }

  /**
   * Update student demographic / KYC dossier details
   */
  async updateProfile(data: Partial<StudentProfile>): Promise<StudentProfile> {
    const res = await api.put<StudentProfile>('/students/me', data);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to update student profile');
    }
    return res.data;
  }

  /**
   * Fetch student overall attendance telemetry
   */
  async getAttendanceStats(): Promise<StudentAttendanceStats> {
    const res = await api.get<StudentAttendanceStats>('/students/me/attendance/stats');
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to load attendance statistics');
    }
    return res.data;
  }

  /**
   * Fetch subject-wise attendance breakdown
   */
  async getAttendanceSubjects(): Promise<SubjectAttendanceRecord[]> {
    const res = await api.get<SubjectAttendanceRecord[]>('/students/me/attendance/subjects');
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Fetch session-level attendance history
   */
  async getAttendanceHistory(limit: number = 200): Promise<AttendanceHistoryItem[]> {
    const res = await api.get<AttendanceHistoryItem[]>(`/students/me/attendance?limit=${limit}`);
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Check for active/open live roll-call sessions
   */
  async getOpenAttendanceSessions(): Promise<AttendanceSession[]> {
    const res = await api.get<AttendanceSession[]>('/attendance/sessions?state=OPEN');
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Submit self-attendance using live 6-digit PIN or scanned dynamic QR token
   */
  async submitSelfAttendance(
    sessionId: number,
    method: 'PIN' | 'QR',
    value: string
  ): Promise<{ message?: string }> {
    const payload = method === 'PIN' ? { method: 'PIN', pin: value } : { method: 'QR', qr_token: value };
    const res = await api.post<{ message?: string }>(
      `/attendance/sessions/${sessionId}/self-attendance`,
      payload
    );
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to record attendance');
    }
    return res.data || {};
  }

  /**
   * Fetch all teaching groups / classes the student is enrolled in
   */
  async getMyEnrolledGroups(): Promise<TeachingGroup[]> {
    const res = await api.get<TeachingGroup[]>('/teaching-groups/student/my-groups');
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Fetch details of a single teaching group
   */
  async getGroupDetail(groupId: number): Promise<TeachingGroup> {
    const res = await api.get<TeachingGroup>(`/teaching-groups/${groupId}`);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to load class details');
    }
    return res.data;
  }

  /**
   * Fetch stream posts and announcements for a class
   */
  async getGroupPosts(groupId: number): Promise<StreamPost[]> {
    const res = await api.get<StreamPost[]>(`/teaching-groups/${groupId}/posts`);
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Create a new announcement / stream post in a class
   */
  async createGroupPost(groupId: number, content: string, title?: string): Promise<StreamPost> {
    const res = await api.post<StreamPost>(`/teaching-groups/${groupId}/posts`, {
      content,
      title: title || 'Class Announcement',
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to share announcement');
    }
    return res.data;
  }

  /**
   * Fetch comments on a stream post
   */
  async getPostComments(groupId: number, postId: number): Promise<StreamComment[]> {
    const res = await api.get<StreamComment[]>(
      `/teaching-groups/${groupId}/posts/${postId}/comments`
    );
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Post a class comment
   */
  async addPostComment(groupId: number, postId: number, content: string): Promise<StreamComment> {
    const res = await api.post<StreamComment>(
      `/teaching-groups/${groupId}/posts/${postId}/comments`,
      { content }
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to post comment');
    }
    return res.data;
  }

  /**
   * Fetch classwork (assignments, tests, materials) for a group
   */
  async getGroupClasswork(groupId: number): Promise<Assignment[]> {
    const res = await api.get<Assignment[]>(`/teaching-groups/${groupId}/classwork`);
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Fetch group roster (teachers and students)
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
   * Fetch student work / assignments across all classes
   */
  async getMyAssignments(filter?: 'assigned' | 'missing' | 'done'): Promise<Assignment[]> {
    let url = '/assignments/student/my-work';
    if (filter) {
      url += `?status=${filter}`;
    }
    const res = await api.get<Assignment[]>(url);
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    // Fallback to /assignments if needed
    const fallback = await api.get<Assignment[]>('/assignments');
    return fallback.success && Array.isArray(fallback.data) ? fallback.data : [];
  }

  /**
   * Fetch single assignment details
   */
  async getAssignmentDetail(id: number): Promise<Assignment> {
    const res = await api.get<Assignment>(`/assignments/${id}`);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to load assignment details');
    }
    return res.data;
  }

  /**
   * Submit coursework assignment with file attachment
   */
  async submitAssignment(
    id: number,
    file: { uri: string; name: string; type: string },
    checklistItem?: string
  ): Promise<{ is_submitted: boolean; original_filename?: string; file_path?: string }> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type || 'application/pdf',
    } as any);

    if (checklistItem) {
      formData.append('checklist_item', checklistItem);
    }

    const res = await api.post<{ is_submitted: boolean; original_filename?: string; file_path?: string }>(
      `/assignments/${id}/submit`,
      formData
    );
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to submit assignment');
    }
    return res.data || { is_submitted: true };
  }

  /**
   * Unsubmit coursework assignment
   */
  async unsubmitAssignment(id: number): Promise<{ success: boolean }> {
    const res = await api.post<{ success: boolean }>(`/assignments/${id}/unsubmit`, {});
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to unsubmit assignment');
    }
    return { success: true };
  }

  /**
   * Fetch student academic scores and dossier assessments
   */
  async getScores(): Promise<AssessmentScore[]> {
    const scores: AssessmentScore[] = [];

    // 1. Fetch dossier assessments
    try {
      const dossierRes = await api.get<{ assessments?: any[] }>('/students/me/dossier');
      if (dossierRes.success && dossierRes.data?.assessments && Array.isArray(dossierRes.data.assessments)) {
        dossierRes.data.assessments.forEach((a: any) => {
          scores.push({
            id: a.assessment_id || a.id,
            title: a.title || 'Assessment',
            type: (a.type || 'EXAM').toUpperCase(),
            semester: a.semester ? Number(a.semester) : null,
            year: a.year ? Number(a.year) : null,
            subject_name: a.subject_name || 'General Course',
            subject_code: a.subject_code || '',
            marks_obtained: a.marks_obtained !== null && a.marks_obtained !== undefined ? Number(a.marks_obtained) : null,
            max_marks: Number(a.max_marks || 100),
            submission_status: a.submission_status || 'GRADED',
            date: a.submitted_at || a.created_at || null,
            remarks: a.remarks || '',
          });
        });
      }
    } catch {
      // Dossier optional fallback
    }

    // 2. Fetch /exams if dossier had few or no records
    try {
      const examsRes = await api.get<any[]>('/exams');
      if (examsRes.success && Array.isArray(examsRes.data)) {
        examsRes.data.forEach((ex: any) => {
          if (!scores.some((s) => s.id === ex.id && s.title === ex.title)) {
            scores.push({
              id: ex.id,
              title: ex.title || ex.name || 'Class Exam',
              type: 'EXAM',
              semester: ex.semester ? Number(ex.semester) : null,
              year: ex.year ? Number(ex.year) : null,
              subject_name: ex.subject_name || 'Subject',
              subject_code: ex.subject_code || '',
              marks_obtained: ex.marks_obtained !== null && ex.marks_obtained !== undefined ? Number(ex.marks_obtained) : null,
              max_marks: Number(ex.max_marks || 100),
              submission_status: 'GRADED',
              date: ex.date || ex.created_at || null,
              remarks: ex.remarks || '',
            });
          }
        });
      }
    } catch {
      // Ignore fallback error
    }

    return scores;
  }

  /**
   * Fetch PDF timetables for the cohort
   */
  async getPdfTimetables(): Promise<PdfTimetable[]> {
    const res = await api.get<PdfTimetable[]>('/timetable/pdf');
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Fetch student's submitted leave applications
   */
  async getMyLeaves(): Promise<LeaveApplication[]> {
    const res = await api.get<LeaveApplication[]>('/leave/my');
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Submit a new leave application
   */
  async applyLeave(from_date: string, to_date: string, reason: string): Promise<LeaveApplication> {
    const res = await api.post<LeaveApplication>('/leave', {
      from_date,
      to_date,
      reason,
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to submit leave application');
    }
    return res.data;
  }
}

export const studentService = new StudentService();

