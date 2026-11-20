/**
 * Bug Reports & Technical Complaints Service
 * Accessible across Student, Faculty, and Admin portals.
 */

import { api } from './api';
import { BugReport, BugReportCategory, BugReportStatistics, BugReportStatus } from '../types/bugReport';

export interface SubmitBugReportParams {
  issue_title: string;
  issue_category: BugReportCategory;
  issue_description: string;
  screenshot: { uri: string; name: string; type: string };
  recording?: { uri: string; name: string; type: string } | null;
}

class BugReportService {
  /**
   * Submit a new technical bug report with mandatory screenshot
   */
  async submitBugReport(params: SubmitBugReportParams): Promise<BugReport> {
    const formData = new FormData();
    formData.append('issue_title', params.issue_title);
    formData.append('issue_category', params.issue_category);
    formData.append('issue_description', params.issue_description);

    formData.append('screenshot', {
      uri: params.screenshot.uri,
      name: params.screenshot.name,
      type: params.screenshot.type || 'image/jpeg',
    } as any);

    if (params.recording) {
      formData.append('recording', {
        uri: params.recording.uri,
        name: params.recording.name,
        type: params.recording.type || 'video/mp4',
      } as any);
    }

    const res = await api.post<BugReport>('/bug-reports', formData);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to submit bug report');
    }
    return res.data;
  }

  /**
   * Fetch submitted bug reports for the authenticated user
   */
  async getMyBugReports(): Promise<BugReport[]> {
    const res = await api.get<BugReport[]>('/bug-reports/my');
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Fetch system-wide bug reporting telemetry (Admin only)
   */
  async getAdminStatistics(): Promise<BugReportStatistics> {
    const res = await api.get<BugReportStatistics>('/bug-reports/admin/statistics');
    if (res.success && res.data) {
      return res.data;
    }
    return {
      total: 0,
      new_count: 0,
      under_review: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
    };
  }

  /**
   * Fetch all system bug reports with filtering (Admin only)
   */
  async getAllBugReports(filters?: {
    status?: string;
    role?: string;
    category?: string;
    search?: string;
  }): Promise<BugReport[]> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.role && filters.role !== 'ALL') params.append('role', filters.role);
    if (filters?.category && filters.category !== 'ALL') params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get<BugReport[]>(`/bug-reports/admin/all${query}`);
    return res.success && Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Fetch single bug report details (Admin only)
   */
  async getBugReportDetail(id: number): Promise<BugReport> {
    const res = await api.get<BugReport>(`/bug-reports/admin/${id}`);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to load report detail');
    }
    return res.data;
  }

  /**
   * Update bug report resolution status and admin note (Admin only)
   */
  async updateReportStatus(
    id: number,
    data: {
      status: BugReportStatus;
      admin_response?: string;
      rejection_reason?: string;
    }
  ): Promise<void> {
    const res = await api.put(`/bug-reports/admin/${id}/status`, data);
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to update bug report status');
    }
  }
}

export const bugReportService = new BugReportService();

