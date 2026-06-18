import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

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

  if (loading) return <div className="animate-pulse space-y-4">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Student Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#0f1f3a] rounded-xl p-6 border border-[#1e3a5f]">
          <p className="text-gray-400 text-sm">My Courses</p>
          <p className="text-3xl font-bold text-white mt-1">{data.enrollments?.length || 0}</p>
        </div>
        <div className="bg-[#0f1f3a] rounded-xl p-6 border border-[#1e3a5f]">
          <p className="text-gray-400 text-sm">Active Sessions</p>
          <p className="text-3xl font-bold text-[#c9a227] mt-1">{data.activeSessions?.length || 0}</p>
        </div>
      </div>

      {data.activeSessions && data.activeSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Active Attendance Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.activeSessions.map((session: any) => (
              <div key={session.id} className="bg-[#0f1f3a] rounded-xl p-5 border border-[#1e3a5f]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#c9a227] font-mono font-bold">{session.session_code}</span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">Active</span>
                </div>
                <h3 className="text-white font-medium mb-2">{session.courses?.course_name}</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Started: {new Date(session.start_time).toLocaleTimeString()}
                </p>
                <Link to={`/student/attend?session=${session.id}`}
                  className="block w-full text-center bg-[#c9a227] hover:bg-[#d4b43a] text-[#0a1628] font-semibold py-2 rounded-lg transition-colors">
                  Mark Attendance
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold text-white mb-4">My Courses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.enrollments?.map((enrollment: any) => (
          <div key={enrollment.id} className="bg-[#0f1f3a] rounded-xl p-5 border border-[#1e3a5f]">
            <span className="text-[#c9a227] font-mono text-sm">{enrollment.courses?.course_code}</span>
            <h3 className="text-white font-medium mt-1">{enrollment.courses?.course_name}</h3>
            <p className="text-gray-400 text-sm mt-2">
              Lecturer: {enrollment.courses?.lecturers?.full_name || 'TBA'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
