import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { Users, GraduationCap, BookOpen, Clock, Activity, Plus, FileText, ChevronRight } from 'lucide-react'

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
    { label: 'Total Students', value: statsData.studentsCount || 0, icon: <GraduationCap size={20} />, active: true },
    { label: 'Total Lecturers', value: statsData.lecturersCount || 0, icon: <Users size={20} />, active: false },
    { label: 'Total Courses', value: statsData.coursesCount || 0, icon: <BookOpen size={20} />, active: false },
    { label: 'Classes Today', value: statsData.sessionsToday || 0, icon: <Clock size={20} />, active: false },
  ]

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-[#e5e5e5] rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-[#e5e5e5] rounded-xl"></div>)}
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#e5e5e5] pb-6">
        <div>
          <h1 className="text-3xl font-display font-semibold text-[#111] tracking-tight">Overview</h1>
          <p className="text-[#666] mt-1 text-sm">Welcome back to the administrator platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary text-sm">
            <Activity className="w-4 h-4 mr-2" /> System Status: Optimal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="ksas-card relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${stat.active ? 'bg-[#111] text-white' : 'bg-[#f3f3f3] text-[#111]'}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-[#666] text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</p>
            <h3 className="text-3xl font-display font-semibold text-[#111]">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="ksas-card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[#111] font-semibold tracking-tight">Quick Actions</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/admin/users" className="flex items-start p-4 border border-[#e5e5e5] rounded-xl hover:border-[#111] transition-colors group">
              <div className="bg-[#f3f3f3] p-2 rounded-lg text-[#111] mr-4 group-hover:bg-[#111] group-hover:text-white transition-colors">
                <Users size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-[#111] font-medium text-sm">Manage Directory</h4>
                <p className="text-[#666] text-[13px] mt-0.5">Add or update system users</p>
              </div>
              <ChevronRight className="text-[#999] group-hover:text-[#111]" size={18} />
            </Link>
            <Link to="/admin/courses" className="flex items-start p-4 border border-[#e5e5e5] rounded-xl hover:border-[#111] transition-colors group">
              <div className="bg-[#f3f3f3] p-2 rounded-lg text-[#111] mr-4 group-hover:bg-[#111] group-hover:text-white transition-colors">
                <BookOpen size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-[#111] font-medium text-sm">Course Catalog</h4>
                <p className="text-[#666] text-[13px] mt-0.5">Manage academic courses</p>
              </div>
              <ChevronRight className="text-[#999] group-hover:text-[#111]" size={18} />
            </Link>
          </div>
        </div>

        <div className="ksas-card">
          <h2 className="text-[#111] font-semibold tracking-tight mb-6">Recent Activity</h2>
          <div className="space-y-4">
            <div className="text-center text-[#666] text-sm py-8 border border-dashed border-[#e5e5e5] rounded-lg">
              No recent system activity to display.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

