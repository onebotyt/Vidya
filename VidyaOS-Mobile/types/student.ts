/**
 * Student Domain Types
 */

export interface StudentProfile {
  id: number;
  full_name: string;
  email: string;
  username?: string;
  official_enrollment_no?: string | null;
  class_roll_no?: number | string | null;
  registration_no?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  branch_name?: string | null;
  branch_code?: string | null;
  department_code?: string | null;
  year?: number | null;
  semester?: number | null;
  academic_year_label?: string | null;
  batch_label?: string | null;
  admission_year?: number | null;
  passing_year?: number | null;
  batch?: string | null;
  class_teacher_name?: string | null;
  phone?: string | null;
  student_phone?: string | null;
  address?: string | null;
  aadhar_number?: string | null;
  father_name?: string | null;
  mother_name?: string | null;
  dob?: string | null;
  gender?: string | null;
  category?: string | null;
  profile_completed?: boolean;
}

export interface StudentAttendanceStats {
  total_classes: number;
  attended_classes: number;
  current_percentage: number;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  attended?: number;
  total?: number;
  percentage?: number;
}

export interface SubjectAttendanceRecord {
  subject_id: number;
  subject_name: string;
  subject_code?: string;
  component?: 'THEORY' | 'PRACTICAL';
  total_sessions: number;
  attended_sessions: number;
  percentage: number;
  status?: 'SAFE' | 'WARNING' | 'CRITICAL';
}

export interface AttendanceHistoryItem {
  id: number;
  session_id?: number;
  subject_name: string;
  subject_code?: string;
  date: string;
  status: 'PRESENT' | 'ABSENT';
  session_type?: string;
  marked_at?: string;
}

export interface AttendanceSession {
  id: number;
  subject_name: string;
  subject_code?: string;
  teacher_name?: string;
  label?: string;
  session_type?: string;
  state: 'OPEN' | 'CLOSED';
  created_at: string;
}

export interface TeachingGroup {
  id: number;
  name: string;
  subject_id?: number;
  subject_name: string;
  component?: 'THEORY' | 'PRACTICAL';
  teacher_id?: number;
  teacher_name?: string;
  semester?: number;
  year?: number;
  invite_code?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
  enrolled_count?: number;
  created_at?: string;
}

export interface StreamPost {
  id: number;
  group_id: number;
  author_id: number;
  author_name: string;
  author_role: string;
  title?: string;
  content: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  comments_count?: number;
  created_at: string;
}

export interface StreamComment {
  id: number;
  post_id: number;
  user_id: number;
  user_name: string;
  user_role: string;
  content: string;
  created_at: string;
}

export interface GroupClassworkUnit {
  unit_name: string;
  items: Assignment[];
}

export interface Assignment {
  id: number;
  group_id?: number;
  group_name?: string;
  title: string;
  description?: string;
  due_date?: string | null;
  max_marks?: number;
  total_marks?: number;
  unit_name?: string;
  item_kind?: 'ASSIGNMENT' | 'TEST';
  attachment_path?: string | null;
  attachment_name?: string | null;
  attachment_url?: string | null;
  status?: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'LATE';
  my_submission?: {
    id?: number;
    is_submitted?: number | boolean;
    file_path?: string;
    original_filename?: string;
    submitted_at?: string;
    grade?: number | null;
    feedback?: string | null;
    status?: string;
  } | null;
}

export interface AssessmentScore {
  id: number;
  title: string;
  type: string;
  semester?: number | null;
  year?: number | null;
  subject_name: string;
  subject_code?: string;
  marks_obtained?: number | null;
  max_marks: number;
  submission_status?: string;
  date?: string | null;
  remarks?: string;
}

export interface PdfTimetable {
  id: number;
  year: number;
  department_id?: number;
  department_name?: string;
  title: string;
  file_path: string;
  file_name?: string;
  uploaded_at?: string;
}

export interface LeaveApplication {
  id: number;
  student_id?: number;
  from_date: string;
  to_date: string;
  reason: string;
  total_days?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string | null;
  reviewed_by_name?: string | null;
  created_at?: string;
}

export interface ClassMember {
  id: number;
  full_name: string;
  email?: string;
  role: 'TEACHER' | 'STUDENT';
  class_roll_no?: number | string | null;
  official_enrollment_no?: string | null;
}
