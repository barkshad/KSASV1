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

    for (const enrollment of enrollments || []) {
      const { count: totalSessions } = await supabase
        .from('attendance_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', enrollment.course_id)

      const myAttendance = attendanceData?.filter(
        (r) => r.attendance_sessions?.courses?.id === enrollment.course_id
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
      <h1 className="text-2xl font-bold text-white mb-6">Attendance History</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {courseStats.map((stat) => (
          <div key={stat.course_id} className="bg-[#0f1f3a] rounded-xl p-5 border border-[#1e3a5f]">
            <h3 className="text-white font-medium">{stat.course_name}</h3>
            <div className="flex items-center justify-between mt-3">
              <div><p className="text-gray-400 text-sm">{stat.attended} / {stat.total_sessions} sessions</p></div>
              <div className={`text-2xl font-bold ${stat.percentage >= 75 ? 'text-green-400' : stat.percentage >= 50 ? 'text-[#c9a227]' : 'text-red-400'}`}>
                {stat.percentage}%
              </div>
            </div>
            <div className="h-2 bg-[#162a4d] rounded-full mt-3 overflow-hidden">
              <div className={`h-full rounded-full ${stat.percentage >= 75 ? 'bg-green-400' : stat.percentage >= 50 ? 'bg-[#c9a227]' : 'bg-red-400'}`}
                style={{ width: `${stat.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">Recent Records</h2>
      <div className="bg-[#0f1f3a] rounded-xl border border-[#1e3a5f] overflow-hidden">
        {loading ? (
          <div className="animate-pulse p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-[#162a4d] rounded-lg" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No attendance records yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-[#1e3a5f]">
                  <th className="pb-3 px-4 pt-4">Course</th>
                  <th className="pb-3 px-4 pt-4">Session</th>
                  <th className="pb-3 px-4 pt-4">Status</th>
                  <th className="pb-3 px-4 pt-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-[#1e3a5f]/50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white">{record.attendance_sessions?.courses?.course_name}</p>
                        <p className="text-[#c9a227] font-mono text-sm">{record.attendance_sessions?.courses?.course_code}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#c9a227] font-mono">{record.attendance_sessions?.session_code}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">{record.status}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm">{new Date(record.attendance_time).toLocaleString()}</td>
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
