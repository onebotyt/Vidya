export { Department } from './admin';

export type UserRole = 'STUDENT' | 'TEACHER' | 'FACULTY' | 'HOD' | 'SYSTEM_ADMIN' | 'ADMIN' | 'COMMON_FACULTY_MANAGER';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  name?: string;
  role?: UserRole;
  roles: UserRole[];
  is_admin?: boolean;
  is_hod?: boolean;
  is_teacher?: boolean;
  is_student?: boolean;
  is_common_faculty_manager?: boolean;
  department_id?: number;
  department_name?: string;
  department_code?: string;
  current_semester?: number;
  semester?: number;
  official_enrollment_no?: string | null;
  registration_no?: string | null;
  class_roll_no?: number | null;
  phone?: string | null;
  avatar_url?: string | null;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'REJECTED' | 'INACTIVE';
  must_change_password?: boolean;
  activation_token?: string;
}

export interface LoginResponseData {
  access_token: string;
  refresh_token?: string;
  token?: string;
  user: UserProfile;
  must_change_password?: boolean;
  activation_token?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code?: string;
    message?: string;
    status?: number;
    details?: any;
  };
}

export interface StudentRegisterPayload {
  full_name: string;
  official_enrollment_no?: string | null;
  enrollment_not_available?: boolean;
  registration_no?: string | null;
  class_roll_no?: number | null;
  email: string;
  password?: string;
  department_id: number;
  semester: number;
  phone?: string | null;
  google_sub?: string | null;
}
