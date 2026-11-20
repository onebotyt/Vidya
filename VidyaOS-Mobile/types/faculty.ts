/**
 * Faculty and HOD Domain Types
 */

export interface FacultyProfile {
  id: number;
  full_name: string;
  email: string;
  employee_id?: string;
  department_id?: number;
  department_name?: string;
  department_code?: string;
  is_hod?: boolean;
  phone?: string;
  role: 'TEACHER' | 'HOD' | 'SYSTEM_ADMIN';
}

export interface FacultyDashboardStats {
  active_classes_count: number;
  total_students_enrolled: number;
  pending_leave_approvals: number;
  open_attendance_sessions: number;
}

export interface AttendanceRegister {
  id: number;
  name: string;
  subject_id: number;
  subject_name: string;
  subject_code?: string;
  component: 'THEORY' | 'PRACTICAL';
  academic_year_id?: number;
  semester: number;
  total_students?: number;
  total_sessions?: number;
  created_at?: string;
}

export interface AttendanceSession {
  id: number;
  register_id?: number;
  subject_id?: number;
  subject_name?: string;
  subject_code?: string;
  teacher_name?: string;
  session_type?: string;
  label?: string;
  date: string;
  period_no?: number;
  topic?: string;
  state: 'DRAFT' | 'OPEN' | 'CLOSED' | 'FINALIZED';
  status?: 'OPEN' | 'CLOSED' | 'FINALIZED';
  pin_code?: string;
  qr_token?: string;
  qr_expires_at?: string;
  present_count?: number;
  total_count?: number;
  created_at?: string;
}

export interface LiveCheckInClaim {
  id: number;
  student_id: number;
  student_name: string;
  class_roll_no?: number | string | null;
  official_enrollment_no?: string | null;
  method: 'PIN' | 'QR' | 'MANUAL';
  submitted_at: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface StudentRosterItem {
  id: number;
  student_id?: number;
  full_name: string;
  email: string;
  official_enrollment_no?: string | null;
  enrollment_no?: string | null;
  registration_no?: string | null;
  class_roll_no?: number | string | null;
  department_name?: string;
  branch_name?: string;
  semester?: number;
  year?: number;
  phone?: string | null;
  attendance_percentage?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'WITHDRAWN' | 'PENDING';
  enrollment_status?: 'Assigned' | 'Not Assigned';
}

export interface FacultyLeaveItem {
  id: number;
  student_id: number;
  student_name: string;
  class_roll_no?: number | string | null;
  official_enrollment_no?: string | null;
  department_name?: string;
  from_date: string;
  to_date: string;
  reason: string;
  total_days?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string | null;
  created_at?: string;
}
