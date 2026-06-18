import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const [statsData, setStatsData] = useState<any>({ studentsCount: 0, lecturersCount: 0, coursesCount: 0, sessionsToday: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const { count: studentsCount } = await supabase.from('students').select('*', { count: 'exact', head: true })
      const { count: lecturersCount } = await supabase.from('lecturers').select('*', { count: 'exact', head: true })
      const { count: coursesCount } = await supabase.from('courses').select('*', { count: 'exact', head: true })

      const today = new Date().toISOString().split('T')[0]
      const { count: sessionsToday } = await supabase.from('attendance_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', `${today}T00:00:00Z`)

      setStatsData({ studentsCount, lecturersCount, coursesCount, sessionsToday })
      setLoading(false)
    }
    fetchStats()
  }, [])

  const stats = [
    { label: 'Total Students', value: statsData.studentsCount || 0, icon: '🎓', color: 'bg-blue-600' },
    { label: 'Total Lecturers', value: statsData.lecturersCount || 0, icon: '👨‍🏫', color: 'bg-green-600' },
    { label: 'Total Courses', value: statsData.coursesCount || 0, icon: '📚', color: 'bg-purple-600' },
    { label: 'Sessions Today', value: statsData.sessionsToday || 0, icon: '📅', color: 'bg-[#c9a227]' },
  ]

  if (loading) return <div className="animate-pulse space-y-4">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#0f1f3a] rounded-xl p-6 border border-[#1e3a5f]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#0f1f3a] rounded-xl p-6 border border-[#1e3a5f]">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/admin/users" className="bg-[#162a4d] hover:bg-[#1e3a5f] p-4 rounded-lg transition-colors">
            <p className="text-[#c9a227] font-medium">Manage Users</p>
            <p className="text-gray-400 text-sm mt-1">Add, edit, or deactivate users</p>
          </Link>
          <Link to="/admin/courses" className="bg-[#162a4d] hover:bg-[#1e3a5f] p-4 rounded-lg transition-colors">
            <p className="text-[#c9a227] font-medium">Manage Courses</p>
            <p className="text-gray-400 text-sm mt-1">Create and assign courses</p>
          </Link>
          <Link to="/admin/analytics" className="bg-[#162a4d] hover:bg-[#1e3a5f] p-4 rounded-lg transition-colors">
            <p className="text-[#c9a227] font-medium">View Analytics</p>
            <p className="text-gray-400 text-sm mt-1">Attendance reports and insights</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
