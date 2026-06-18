import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BookOpen, Radio, ScanLine, Clock } from 'lucide-react'

export default function StudentDashboard() {
  const [data, setData] = useState<any>({ enrollments: [], activeSessions: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (student) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('*, courses(*, lecturers(full_name))')
          .eq('student_id', student.id)

        const { data: activeSessions } = await supabase
          .from('attendance_sessions')
          .select('*, courses(course_name, course_code)')
          .eq('status', 'active')

        const myActiveSessions = activeSessions?.filter((s) =>
          enrollments?.some((e) => e.course_id === s.course_id)
        )

        setData({ enrollments, activeSessions: myActiveSessions })
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-[#e5e5e5] rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map(i => <div key={i} className="h-32 bg-[#e5e5e5] rounded-xl"></div>)}
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#e5e5e5] pb-6">
        <div>
          <h1 className="text-3xl font-display font-semibold text-[#111] tracking-tight">Dashboard</h1>
          <p className="text-[#666] mt-1 text-sm">Welcome back. Here is your academic overview.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="ksas-card overflow-hidden relative">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#f3f3f3] text-[#111] rounded-lg"><BookOpen size={20} /></div>
          </div>
          <p className="text-[#666] text-xs font-medium uppercase tracking-wider mb-1">Enrolled Courses</p>
          <p className="text-3xl font-display font-semibold text-[#111]">{data.enrollments?.length || 0}</p>
        </div>
        <div className="ksas-card overflow-hidden relative border-[#111]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#111] text-white rounded-lg animate-pulse"><Radio size={20} /></div>
          </div>
          <p className="text-[#666] text-xs font-medium uppercase tracking-wider mb-1">Active Classes Right Now</p>
          <p className="text-3xl font-display font-semibold text-[#111]">{data.activeSessions?.length || 0}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {data.activeSessions && data.activeSessions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#111] flex items-center gap-2">
                <Radio className="text-green-500 animate-pulse" size={18} />
                Live Sessions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.activeSessions.map((session: any) => (
                  <div key={session.id} className="ksas-card flex flex-col h-full border-[#111]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-[#f3f3f3] text-[#111] px-2.5 py-1 rounded text-xs font-mono font-medium">{session.courses?.course_code}</span>
                      <span className="flex items-center text-xs font-medium text-green-600">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div> Active
                      </span>
                    </div>
                    <h3 className="text-[#111] font-semibold mb-2 line-clamp-2">{session.courses?.course_name}</h3>
                    <p className="text-[#666] text-sm mb-6 flex items-center gap-1.5">
                      <Clock size={14} /> Started {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <Link to={`/student/attend?session=${session.id}`}
                      className="btn-primary w-full mt-auto bg-[#111] text-white space-x-2">
                      <ScanLine size={16} />
                      <span>Log Attendance</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#111]">Enrolled Courses</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.enrollments?.map((enrollment: any) => (
                <div key={enrollment.id} className="ksas-card flex flex-col h-full">
                  <span className="text-[#111] font-mono text-xs font-medium mb-1">{enrollment.courses?.course_code}</span>
                  <h3 className="text-[#111] font-semibold flex-1 line-clamp-2">{enrollment.courses?.course_name}</h3>
                  <p className="text-[#666] text-sm mt-4 border-t border-[#e5e5e5] pt-3">
                    Prof. {enrollment.courses?.lecturers?.full_name || 'TBA'}
                  </p>
                </div>
              ))}
              {data.enrollments?.length === 0 && (
                <div className="col-span-2 text-center text-[#666] text-sm py-12 border border-dashed border-[#e5e5e5] rounded-xl bg-[#fafafa]">
                  You have not enrolled in any courses yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#111]">Upcoming Classes</h2>
          <div className="ksas-card text-center py-12 text-[#666] text-sm">
            No upcoming academic schedule to display.
          </div>
        </div>
      </div>
    </div>
  )
}

