import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type AttendanceRecord = {
  id: string
  attendance_time: string
  status: string
  attendance_sessions: {
    session_code: string
    start_time: string
    courses: { course_name: string; course_code: string }
  }
}

type CourseStats = {
  course_id: string
  course_name: string
  total_sessions: number
  attended: number
  percentage: number
}

export default function HistoryPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [courseStats, setCourseStats] = useState<CourseStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchHistory() }, [])

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: student } = await supabase
      .from('students').select('id').eq('profile_id', user.id).single()

    const { data: attendanceData } = await supabase
      .from('attendance_records')
      .select('*, attendance_sessions(session_code, start_time, courses(id, course_name, course_code))')
      .eq('student_id', student?.id)
      .order('attendance_time', { ascending: false })

    setRecords(attendanceData || [])

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id, courses(id, course_name)')
      .eq('student_id', student?.id)

    const stats: CourseStats[] = []

    for (const enrollmentAny of enrollments || []) {
      const enrollment = enrollmentAny as any;
      const { count: totalSessions } = await supabase
        .from('attendance_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', enrollment.course_id)

      const myAttendance = attendanceData?.filter(
        (r: any) => r.attendance_sessions?.courses?.id === enrollment.course_id
      ).length || 0

      stats.push({
        course_id: enrollment.course_id,
        course_name: enrollment.courses?.course_name || '',
        total_sessions: totalSessions || 0,
        attended: myAttendance,
        percentage: totalSessions ? Math.round((myAttendance / totalSessions) * 100) : 0,
      })
    }

    setCourseStats(stats)
    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold font-display text-white mb-6">Attendance History</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {courseStats.map((stat) => (
          <div key={stat.course_id} className="ksas-card">
            <h3 className="text-white font-medium mb-1">{stat.course_name}</h3>
            <p className="text-[#8ba0c4] text-xs font-mono">{stat.course_id.split('-')[0]}</p>
            <div className="flex items-center justify-between mt-4">
              <div><p className="text-[#8ba0c4] text-sm">{stat.attended} / {stat.total_sessions} sessions</p></div>
              <div className={`text-2xl font-bold ${stat.percentage >= 75 ? 'text-[#22c55e]' : stat.percentage >= 50 ? 'text-[#c9a227]' : 'text-[#ef4444]'}`}>
                {stat.percentage}%
              </div>
            </div>
            <div className="h-1.5 bg-[#162444] rounded-full mt-3 overflow-hidden">
              <div className={`h-full rounded-full ${stat.percentage >= 75 ? 'bg-[#22c55e]' : stat.percentage >= 50 ? 'bg-[#c9a227]' : 'bg-[#ef4444]'}`}
                style={{ width: `${stat.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold font-display text-white mb-4">Recent Records</h2>
      <div className="ksas-card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-[#8ba0c4]">Loading history...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-[#8ba0c4]">No attendance records yet.</div>
        ) : (
          <div className="ksas-table-container">
            <table className="ksas-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Session</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record: any) => (
                  <tr key={record.id}>
                    <td>
                      <div>
                        <p className="text-white font-medium">{record.attendance_sessions?.courses?.course_name}</p>
                        <p className="text-[#c9a227] font-mono text-xs mt-0.5">{record.attendance_sessions?.courses?.course_code}</p>
                      </div>
                    </td>
                    <td className="text-[#c9a227] font-mono">{record.attendance_sessions?.session_code}</td>
                    <td>
                      <span className={`badge ${
                        record.status === 'Present' ? 'badge-success' : record.status === 'Absent' ? 'badge-error' : 'badge-warning'
                      }`}>{record.status}</span>
                    </td>
                    <td className="text-[#8ba0c4] text-sm">{new Date(record.attendance_time).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
