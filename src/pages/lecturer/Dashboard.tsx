import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'

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

  if (loading) return <div className="animate-pulse space-y-4">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Lecturer Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#0f1f3a] rounded-xl p-6 border border-[#1e3a5f]">
          <p className="text-gray-400 text-sm">My Courses</p>
          <p className="text-3xl font-bold text-white mt-1">{data.courses?.length || 0}</p>
        </div>
        <div className="bg-[#0f1f3a] rounded-xl p-6 border border-[#1e3a5f]">
          <p className="text-gray-400 text-sm">Active Sessions</p>
          <p className="text-3xl font-bold text-[#c9a227] mt-1">{data.activeSessions?.length || 0}</p>
        </div>
        <div className="bg-[#0f1f3a] rounded-xl p-6 border border-[#1e3a5f]">
          <p className="text-gray-400 text-sm">Total Sessions</p>
          <p className="text-3xl font-bold text-white mt-1">
            {data.courses?.reduce((sum: number, c: any) => sum + (c.attendance_sessions?.[0]?.count || 0), 0) || 0}
          </p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">My Courses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.courses?.map((course: any) => (
          <div key={course.id} className="bg-[#0f1f3a] rounded-xl p-5 border border-[#1e3a5f]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#c9a227] font-mono text-sm">{course.course_code}</span>
            </div>
            <h3 className="text-white font-medium mb-4">{course.course_name}</h3>
            <Link
              to={`/lecturer/sessions?course=${course.id}`}
              className="block w-full text-center bg-[#c9a227] hover:bg-[#d4b43a] text-[#0a1628] font-semibold py-2 rounded-lg transition-colors"
            >
              Manage Sessions
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
