export type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alpha';
export type UserRole = 'admin' | 'user';

export interface Teacher {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Class {
  id: number;
  name: string;
  teacher_id: number;
  teacher_name?: string;
}

export interface Student {
  id: number;
  name: string;
  class_id: number;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  class_id: number;
  teacher_id: number;
  date: string;
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
}

export interface StudentWithAttendance extends Student {
  status?: AttendanceStatus;
  attendance_id?: number;
}

export interface AttendancePayload {
  student_id: number;
  class_id: number;
  status: AttendanceStatus;
  date: string;
}

export interface AttendanceSummary {
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  total: number;
}

export interface AttendanceExportRow {
  date: string;
  class_name: string;
  student_name: string;
  status: AttendanceStatus;
  teacher_name: string;
}

export interface StudentAttendanceSummary {
  student_id: number;
  student_name: string;
  class_id: number;
  class_name: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  total_recorded: number;
}

export interface BackupPayload {
  generated_at: string;
  generated_by: {
    id: number;
    name: string;
    email: string;
  };
  counts: {
    teachers: number;
    classes: number;
    students: number;
    attendance: number;
  };
  teachers: Teacher[];
  classes: Class[];
  students: Student[];
  attendance: AttendanceRecord[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SessionPayload {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}
