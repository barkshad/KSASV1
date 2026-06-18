import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useSearchParams, Link } from 'react-router-dom'

type Course = { id: string; course_code: string; course_name: string }
type Session = {
  id: string
  session_code: string
  status: string
  start_time: string
  end_time: string | null
  courses: { course_name: string; course_code: string }
}

export default function SessionsPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [searchParams] = useSearchParams()
  const initialCourse = searchParams.get('course') || ''
  const [selectedCourse, setSelectedCourse] = useState(initialCourse)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) fetchSessions()
  }, [selectedCourse])

  const fetchCourses = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: lecturer } = await supabase
      .from('lecturers').select('id').eq('profile_id', user.id).single()

    const { data } = await supabase
      .from('courses').select('id, course_code, course_name').eq('lecturer_id', lecturer?.id)

    setCourses(data || [])
    setLoading(false)
  }

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('attendance_sessions')
      .select('*, courses(course_name, course_code)')
      .eq('course_id', selectedCourse)
      .order('start_time', { ascending: false })

    setSessions(data || [])
  }

  const createSession = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !selectedCourse) return

    const { data: lecturer } = await supabase
      .from('lecturers').select('id').eq('profile_id', user.id).single()

    const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const qrPayload = JSON.stringify({
      sessionId: crypto.randomUUID(),
      courseId: selectedCourse,
      code: sessionCode,
    })

    const { data, error } = await supabase
      .from('attendance_sessions')
      .insert({
        course_id: selectedCourse,
        lecturer_id: lecturer?.id,
        session_code: sessionCode,
        qr_payload: qrPayload,
        status: 'active',
      })
      .select()
      .single()

    if (error) { alert('Failed to create session') }
    else { fetchSessions() }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Attendance Sessions</h1>
        <div className="flex gap-3">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="bg-[#162a4d] border border-[#1e3a5f] text-white rounded-lg px-4 py-2"
          >
            <option value="">Select Course</option>
            {courses.map((c) => (
               <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>
            ))}
          </select>
          <button
            onClick={createSession}
            disabled={!selectedCourse}
            className="bg-[#c9a227] hover:bg-[#d4b43a] text-[#0a1628] font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            + New Session
          </button>
        </div>
      </div>

      <div className="bg-[#0f1f3a] rounded-xl border border-[#1e3a5f] overflow-hidden">
        {loading ? (
          <div className="animate-pulse p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-[#162a4d] rounded-lg" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No sessions yet. Select a course and create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-[#1e3a5f]">
                  <th className="pb-3 px-4 pt-4">Code</th>
                  <th className="pb-3 px-4 pt-4">Course</th>
                  <th className="pb-3 px-4 pt-4">Status</th>
                  <th className="pb-3 px-4 pt-4">Started</th>
                  <th className="pb-3 px-4 pt-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-b border-[#1e3a5f]/50 hover:bg-[#162a4d]/50">
                    <td className="py-3 px-4 text-[#c9a227] font-mono font-bold">{session.session_code}</td>
                    <td className="py-3 px-4 text-white">{session.courses?.course_name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                      }`}>{session.status}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm">
                      {new Date(session.start_time).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Link to={`/lecturer/sessions/${session.id}`} className="text-[#c9a227] hover:text-[#d4b43a] text-sm font-medium">Live View</Link>
                        <Link to={`/lecturer/sessions/${session.id}?view=qr`} className="text-blue-400 hover:text-blue-300 text-sm">QR Code</Link>
                      </div>
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
