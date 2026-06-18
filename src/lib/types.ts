export interface Profile {
  id: string
  name: string
  email: string
  role: 'admin' | 'lecturer' | 'student'
  status: 'active' | 'inactive'
  created_at: string
}

export interface Student {
  id: string
  student_number: string
  full_name: string
  email: string
  course: string | null
  year: number | null
  profile_id: string | null
}

export interface Lecturer {
  id: string
  full_name: string
  email: string
  department: string | null
  profile_id: string | null
}

export interface Course {
  id: string
  course_code: string
  course_name: string
  lecturer_id: string | null
}

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
}

export interface AttendanceSession {
  id: string
  course_id: string | null
  lecturer_id: string | null
  session_code: string
  qr_payload: string
  status: 'active' | 'ended'
  start_time: string
  end_time: string | null
}

export interface AttendanceRecord {
  id: string
  session_id: string | null
  student_id: string | null
  attendance_time: string
  status: 'Present' | 'Late' | 'Absent'
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Profile>
      }
      students: {
        Row: Student
        Insert: Omit<Student, 'id'>
        Update: Partial<Student>
      }
      lecturers: {
        Row: Lecturer
        Insert: Omit<Lecturer, 'id'>
        Update: Partial<Lecturer>
      }
      courses: {
        Row: Course
        Insert: Omit<Course, 'id'>
        Update: Partial<Course>
      }
      enrollments: {
        Row: Enrollment
        Insert: Omit<Enrollment, 'id'>
        Update: Partial<Enrollment>
      }
      attendance_sessions: {
        Row: AttendanceSession
        Insert: Omit<AttendanceSession, 'id' | 'start_time'>
        Update: Partial<AttendanceSession>
      }
      attendance_records: {
        Row: AttendanceRecord
        Insert: Omit<AttendanceRecord, 'id' | 'attendance_time'>
        Update: Partial<AttendanceRecord>
      }
    }
  }
}
