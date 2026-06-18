import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { BookOpen, Radio, Calendar, Activity, Play, ChevronRight } from 'lucide-react'

export default function LecturerDashboard() {
  const [data, setData] = useState<any>({ courses: [], activeSessions: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: lecturer } = await supabase
        .from('lecturers')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (lecturer) {
        const { data: courses } = await supabase
          .from('courses')
          .select('*, attendance_sessions(count)')
          .eq('lecturer_id', lecturer.id)

        const { data: activeSessions } = await supabase
          .from('attendance_sessions')
          .select('*, courses(course_name)')
          .eq('lecturer_id', lecturer.id)
          .eq('status', 'active')

        setData({ courses, activeSessions })
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-[#e5e5e5] rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-[#e5e5e5] rounded-xl"></div>)}
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#e5e5e5] pb-6">
        <div>
          <h1 className="text-3xl font-display font-semibold text-[#111] tracking-tight">Dashboard</h1>
          <p className="text-[#666] mt-1 text-sm">Welcome back. Here is your overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/lecturer/sessions" className="btn-primary space-x-2">
            <Play size={16} />
            <span>Start Session</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="ksas-card overflow-hidden relative">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#f3f3f3] text-[#111] rounded-lg"><BookOpen size={20} /></div>
          </div>
          <p className="text-[#666] text-xs font-medium uppercase tracking-wider mb-1">My Courses</p>
          <p className="text-3xl font-display font-semibold text-[#111]">{data.courses?.length || 0}</p>
        </div>
        <div className="ksas-card overflow-hidden relative border-[#111]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#111] text-white rounded-lg animate-pulse"><Radio size={20} /></div>
          </div>
          <p className="text-[#666] text-xs font-medium uppercase tracking-wider mb-1">Active Sessions</p>
          <p className="text-3xl font-display font-semibold text-[#111]">{data.activeSessions?.length || 0}</p>
        </div>
        <div className="ksas-card overflow-hidden relative">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#f3f3f3] text-[#111] rounded-lg"><Calendar size={20} /></div>
          </div>
          <p className="text-[#666] text-xs font-medium uppercase tracking-wider mb-1">Total History</p>
          <p className="text-3xl font-display font-semibold text-[#111]">
            {data.courses?.reduce((sum: number, c: any) => sum + (c.attendance_sessions?.[0]?.count || 0), 0) || 0}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-[#111]">My Courses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.courses?.map((course: any) => (
              <div key={course.id} className="ksas-card flex flex-col h-full group hover:border-[#111]">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-[#f3f3f3] text-[#111] px-2.5 py-1 rounded text-xs font-mono font-medium">{course.course_code}</span>
                </div>
                <h3 className="text-[#111] font-semibold mb-6 flex-1 line-clamp-2">{course.course_name}</h3>
                <Link
                  to={`/lecturer/sessions?course=${course.id}`}
                  className="flex items-center justify-between w-full text-sm font-medium text-[#666] group-hover:text-[#111] transition-colors mt-auto pt-4 border-t border-[#e5e5e5]"
                >
                  Manage Sessions <ChevronRight size={16} />
                </Link>
              </div>
            ))}
            {data.courses?.length === 0 && (
              <div className="col-span-2 text-center text-[#666] text-sm py-12 border border-dashed border-[#e5e5e5] rounded-xl bg-[#fafafa]">
                You are not assigned to any courses yet.
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#111]">Upcoming Schedule</h2>
          <div className="ksas-card text-center py-12 text-[#666] text-sm">
            No upcoming schedule found.
          </div>
        </div>
      </div>
    </div>
  )
}

