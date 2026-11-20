/**
 * Admin Domain Types
 */

export interface AdminStats {
  total_students: number;
  total_faculty: number;
  total_departments: number;
  active_sessions_today: number;
  pending_registrations: number;
  open_bug_reports: number;
  server_status?: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  uptime?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  degree_duration_years?: number;
  is_active?: number | boolean;
  total_faculty?: number;
  total_students?: number;
  hod_name?: string | null;
  created_at?: string;
}

export interface TeacherRecord {
  id: number;
  user_id?: number;
  full_name: string;
  email: string;
  employee_id?: string;
  department_id: number;
  department_name?: string;
  phone?: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  roles: string[];
  is_hod?: boolean;
  created_at?: string;
}

export interface RegistrationGates {
  student_registration_enabled: boolean;
  faculty_registration_enabled: boolean;
  hod_registration_enabled?: boolean;
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  user_name?: string;
  user_role?: string;
  action: string;
  entity_type?: string;
  entity_id?: string | number;
  ip_address?: string;
  details?: string;
  created_at: string;
}
