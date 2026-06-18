import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useSearchParams, Link } from 'react-router-dom'
import { Plus, Eye, QrCode } from 'lucide-react'

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
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-[#111] tracking-tight">Active Sessions</h1>
          <p className="text-[#666] text-sm mt-1">Manage and launch classes for attendance logging.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="bg-white border border-[#e5e5e5] text-[#111] rounded-lg px-4 py-2 appearance-none min-w-[200px]"
          >
            <option value="">-- View All Assigned Courses --</option>
            {courses.map((c) => (
               <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>
            ))}
          </select>
          <button
            onClick={createSession}
            disabled={!selectedCourse}
            className="btn-primary bg-[#111] text-white disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Plus size={16} /> New Session
          </button>
        </div>
      </div>

      <div className="ksas-card overflow-hidden !p-0 shadow-sm border-[#e5e5e5]">
        {loading ? (
          <div className="animate-pulse p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-[#f3f3f3] rounded-lg" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-[#666]">
            No attendance sessions created yet. Select a course and launch a new session to begin.
          </div>
        ) : (
          <div className="ksas-table-container">
            <table className="ksas-table">
              <thead>
                <tr>
                  <th>Session Code</th>
                  <th>Course Segment</th>
                  <th>Status</th>
                  <th>Time Logged</th>
                  <th className="text-right">Monitoring</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="group border-b border-[#e5e5e5] last:border-0 hover:bg-[#f8f8f8]">
                    <td className="font-mono text-[#111] font-semibold text-sm bg-[#f3f3f3] px-2 py-1 rounded w-max inline-block my-3">
                      {session.session_code}
                    </td>
                    <td>
                      <div className="font-medium text-[#111]">{session.courses?.course_name}</div>
                      <div className="text-xs text-[#666] font-mono mt-0.5">{session.courses?.course_code}</div>
                    </td>
                    <td>
                      <span className={`badge ${
                        session.status === 'active' ? 'bg-[#f0fdf4] text-green-700 border-green-200' : 'bg-[#f3f3f3] text-[#666] border-[#e5e5e5]'
                      }`}>{session.status.charAt(0).toUpperCase() + session.status.slice(1)}</span>
                    </td>
                    <td className="text-[#666] text-sm">
                      {new Date(session.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/lecturer/sessions/${session.id}`} className="flex items-center gap-1.5 text-xs font-medium text-[#666] hover:text-[#111] transition-colors border border-transparent hover:bg-white hover:border-[#e5e5e5] px-2.5 py-1.5 rounded-md shadow-sm">
                          <Eye size={14} /> Live View
                        </Link>
                        <Link to={`/lecturer/sessions/${session.id}?view=qr`} className="flex items-center gap-1.5 text-xs font-medium text-[#666] hover:text-[#111] transition-colors border border-transparent hover:bg-white hover:border-[#e5e5e5] px-2.5 py-1.5 rounded-md shadow-sm">
                          <QrCode size={14} /> Display QR
                        </Link>
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

