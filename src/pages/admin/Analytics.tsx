import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { BarChart3 } from 'lucide-react'

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

    setStats(statsData.sort((a, b) => b.avg_attendance_rate - a.avg_attendance_rate))
    setLoading(false)
  }

  const maxRate = Math.max(...stats.map(s => s.avg_attendance_rate), 100)

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-[#111] tracking-tight">Analytics Overview</h1>
          <p className="text-sm text-[#666] mt-1">Review university attendance performance and engagement metrics.</p>
        </div>
      </div>

      <div className="ksas-card">
        <div className="flex items-center gap-2 mb-8 pb-4 border-b border-[#e5e5e5]">
          <BarChart3 className="text-[#111]" size={20} />
          <h2 className="text-lg font-semibold text-[#111]">Average Attendance Rate by Course</h2>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-5 py-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-[#f3f3f3] rounded w-1/4" />
                <div className="h-10 bg-[#f3f3f3] rounded-lg w-full" />
              </div>
            ))}
          </div>
        ) : stats.length === 0 ? (
          <div className="text-center py-12 text-[#666]">
            No statistical data available yet.
          </div>
        ) : (
          <div className="space-y-6">
            {stats.map((stat) => (
              <div key={stat.course_name} className="group">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-medium text-[#111]">{stat.course_name}</span>
                  <div className="text-right">
                    <span className="text-[#111] font-display font-semibold text-lg">{stat.avg_attendance_rate}%</span>
                  </div>
                </div>
                <div className="h-8 bg-[#f8f8f8] rounded-lg overflow-hidden border border-[#e5e5e5]">
                  <div
                    className="h-full bg-[#111] transition-all duration-1000 ease-out flex items-center justify-end pr-3 relative"
                    style={{ width: `${Math.max((stat.avg_attendance_rate / maxRate) * 100, 5)}%` }}
                  >
                    <span className="text-white text-xs font-medium mix-blend-difference whitespace-nowrap z-10 absolute right-3">
                      {stat.total_attendance} Logs / {stat.total_sessions} Sessions
                    </span>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
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

