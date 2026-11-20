/**
 * Bug Reporting and In-App Notifications Types
 */

export type BugReportCategory =
  | 'Login / Authentication Problem'
  | 'Registration Problem'
  | 'Dashboard Error'
  | 'Student Management Error'
  | 'Faculty Management Error'
  | 'Attendance Error'
  | 'Assignment / Notes Error'
  | 'File Upload / Download Problem'
  | 'Page Not Loading'
  | 'Button / Functionality Not Working'
  | 'UI / Design Problem'
  | 'Other Technical Issue';

export type BugReportStatus =
  | 'New'
  | 'Under Review'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected';

export interface BugReport {
  id: number;
  report_code: string; // e.g. "BR-101"
  user_id: number;
  user_name: string;
  user_role: string;
  user_email: string;
  department_name?: string;
  issue_title: string;
  issue_category: BugReportCategory;
  issue_description: string;
  screenshot_url: string;
  recording_url?: string | null;
  status: BugReportStatus;
  admin_response?: string | null;
  rejection_reason?: string | null;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface BugReportStatistics {
  total: number;
  new_count: number;
  under_review: number;
  in_progress: number;
  resolved: number;
  rejected: number;
}

export interface AppNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT' | 'BUG_UPDATE' | 'LEAVE_UPDATE' | 'ATTENDANCE';
  link_url?: string | null;
  is_read: boolean;
  created_at: string;
}

