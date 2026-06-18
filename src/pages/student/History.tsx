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
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 pb-6 border-b border-[#e5e5e5]">
        <h1 className="text-3xl font-display font-semibold text-[#111] tracking-tight">Academic Attendance</h1>
        <p className="text-[#666] mt-1 text-sm">Review your presence history and calculated statistics per course.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {courseStats.map((stat) => (
          <div key={stat.course_id} className="ksas-card overflow-hidden relative">
            <h3 className="text-[#111] font-semibold mb-1 line-clamp-1">{stat.course_name}</h3>
            <p className="text-[#666] text-xs font-mono font-medium">{stat.course_id.split('-')[0]}</p>
            <div className="flex items-center justify-between mt-6">
              <div><p className="text-[#666] text-sm"><strong className="text-[#111]">{stat.attended}</strong> / {stat.total_sessions} logs</p></div>
              <div className={`text-2xl font-display font-bold ${stat.percentage >= 75 ? 'text-green-600' : stat.percentage >= 50 ? 'text-[#f59e0b]' : 'text-red-500'}`}>
                {stat.percentage}%
              </div>
            </div>
            <div className="h-1 bg-[#f3f3f3] rounded-full mt-4 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ease-out ${stat.percentage >= 75 ? 'bg-green-500' : stat.percentage >= 50 ? 'bg-[#f59e0b]' : 'bg-red-500'}`}
                style={{ width: `${stat.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-display font-semibold text-[#111] mb-4">Historical Records</h2>
      <div className="ksas-card !p-0 overflow-hidden shadow-sm border-[#e5e5e5]">
        {loading ? (
          <div className="animate-pulse p-6 space-y-3">
             <div className="h-10 bg-[#f3f3f3] rounded w-full"></div>
             <div className="h-10 bg-[#f3f3f3] rounded w-full"></div>
             <div className="h-10 bg-[#f3f3f3] rounded w-full"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-[#666] border border-dashed border-[#e5e5e5] rounded-xl m-6">
            No attendance records detected in your history.
          </div>
        ) : (
          <div className="ksas-table-container">
            <table className="ksas-table !border-0">
              <thead className="bg-[#fafafa]">
                <tr>
                  <th className="font-semibold text-[#111]">Course Segment</th>
                  <th className="font-semibold text-[#111]">Session Identity</th>
                  <th className="font-semibold text-[#111]">Presence State</th>
                  <th className="font-semibold text-[#111] text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record: any) => (
                  <tr key={record.id} className="border-b border-[#f3f3f3] hover:bg-[#fafafa] transition-colors last:border-0">
                    <td>
                      <div>
                        <p className="text-[#111] font-medium">{record.attendance_sessions?.courses?.course_name}</p>
                        <p className="text-[#666] font-mono text-xs mt-0.5">{record.attendance_sessions?.courses?.course_code}</p>
                      </div>
                    </td>
                    <td>
                       <span className="text-[#111] font-mono text-xs font-semibold bg-[#f3f3f3] px-2.5 py-1 rounded">
                         {record.attendance_sessions?.session_code}
                       </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        record.status === 'Present' ? 'badge-success' : record.status === 'Absent' ? 'badge-error' : 'badge-warning'
                      }`}>{record.status}</span>
                    </td>
                    <td className="text-[#666] text-sm text-right font-medium">
                       {new Date(record.attendance_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
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

