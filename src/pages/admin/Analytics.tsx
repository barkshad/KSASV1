import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type AttendanceStats = {
  course_name: string
  total_sessions: number
  total_attendance: number
  avg_attendance_rate: number
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AttendanceStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAnalytics() }, [])

  const fetchAnalytics = async () => {
    const { data: courses } = await supabase.from('courses').select('id, course_name')
    if (!courses) return

    const statsData: AttendanceStats[] = []

    for (const course of courses) {
      const { count: sessions } = await supabase
        .from('attendance_sessions').select('*', { count: 'exact', head: true }).eq('course_id', course.id)

      const { count: records } = await supabase
        .from('attendance_records').select('*, attendance_sessions!inner(course_id)', { count: 'exact', head: true })
        .eq('attendance_sessions.course_id', course.id)

      const { count: enrollments } = await supabase
        .from('enrollments').select('*', { count: 'exact', head: true }).eq('course_id', course.id)

      const totalPossible = (sessions || 0) * (enrollments || 0)
      const rate = totalPossible > 0 ? ((records || 0) / totalPossible) * 100 : 0

      statsData.push({
        course_name: course.course_name,
        total_sessions: sessions || 0,
        total_attendance: records || 0,
        avg_attendance_rate: Math.round(rate * 10) / 10,
      })
    }

    setStats(statsData)
    setLoading(false)
  }

  const maxRate = Math.max(...stats.map(s => s.avg_attendance_rate), 100)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Attendance Analytics</h1>

      <div className="bg-[#0f1f3a] rounded-xl p-6 border border-[#1e3a5f]">
        <h2 className="text-lg font-semibold text-white mb-4">Attendance Rate by Course</h2>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-[#162a4d] rounded-lg" />
            ))}
          </div>
        ) : stats.length === 0 ? (
          <p className="text-gray-400">No data available yet.</p>
        ) : (
          <div className="space-y-4">
            {stats.map((stat) => (
              <div key={stat.course_name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white">{stat.course_name}</span>
                  <span className="text-[#c9a227]">{stat.avg_attendance_rate}%</span>
                </div>
                <div className="h-8 bg-[#162a4d] rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-[#c9a227] transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${Math.max((stat.avg_attendance_rate / maxRate) * 100, 5)}%` }}
                  >
                    <span className="text-[#0a1628] text-xs font-bold">{stat.total_attendance} records</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
