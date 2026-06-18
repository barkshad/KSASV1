import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import { useParams, useSearchParams } from 'react-router-dom'

type AttendanceRecord = {
  id: string
  attendance_time: string
  status: string
  students: { student_number: string; full_name: string; email: string }
}

export default function LiveSessionPage() {
  const { id: sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const view = searchParams.get('view')

  const [session, setSession] = useState<any>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [enrolledCount, setEnrolledCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchSession = useCallback(async () => {
    if (!sessionId) return
    const { data } = await supabase
      .from('attendance_sessions')
      .select('*, courses(course_name, course_code)')
      .eq('id', sessionId)
      .single()

    setSession(data)

    if (data) {
      const { count } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', data.course_id)

      setEnrolledCount(count || 0)
    }
  }, [sessionId])

  const fetchRecords = useCallback(async () => {
    if (!sessionId) return
    const { data } = await supabase
      .from('attendance_records')
      .select('*, students(student_number, full_name, email)')
      .eq('session_id', sessionId)
      .order('attendance_time', { ascending: false })

    setRecords(data || [])
    setLoading(false)
  }, [sessionId])

  useEffect(() => {
    fetchSession()
    fetchRecords()

    if (!sessionId) return
    const channel = supabase
      .channel('attendance_records')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records',
          filter: `session_id=eq.${sessionId}`,
        },
        () => { fetchRecords() }
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [fetchSession, fetchRecords, sessionId])

  const endSession = async () => {
    if (!sessionId) return
    const { error } = await supabase
      .from('attendance_sessions')
      .update({ status: 'ended', end_time: new Date().toISOString() })
      .eq('id', sessionId)

    if (!error) { fetchSession() }
  }

  const downloadCSV = () => {
    const headers = ['Student Number', 'Name', 'Email', 'Status', 'Time']
    const rows = records.map((r) => [
      r.students?.student_number || '',
      r.students?.full_name || '',
      r.students?.email || '',
      r.status,
      new Date(r.attendance_time).toLocaleString(),
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${session?.session_code || 'session'}.csv`
    a.click()
  }

  if (view === 'qr') {
    return (
      <div className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center p-8">
        <div className="bg-white p-8 rounded-2xl">
          <QRCodeSVG value={session?.qr_payload || ''} size={400} level="H" includeMargin />
        </div>
        <p className="text-[#c9a227] text-2xl font-bold mt-6">{session?.session_code}</p>
        <p className="text-white text-lg mt-2">{session?.courses?.course_name}</p>
        <p className="text-gray-400 text-sm mt-4">Scan to mark attendance</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {session?.courses?.course_code} - Live Session
          </h1>
          <p className="text-[#c9a227] font-mono text-lg mt-1">{session?.session_code}</p>
        </div>
        <div className="flex gap-3">
          {session?.status === 'active' && (
            <button onClick={endSession}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
              End Session
            </button>
          )}
          <button onClick={downloadCSV}
            className="bg-[#162a4d] hover:bg-[#1e3a5f] text-white px-4 py-2 rounded-lg transition-colors">
            Download CSV
          </button>
          <a href={`/lecturer/sessions/${sessionId}?view=qr`} target="_blank" rel="noreferrer"
            className="bg-[#c9a227] hover:bg-[#d4b43a] text-[#0a1628] font-semibold px-4 py-2 rounded-lg transition-colors">
            Show QR
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#0f1f3a] rounded-xl p-6 border border-[#1e3a5f]">
          <p className="text-gray-400 text-sm">Present</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{records.length}</p>
        </div>
        <div className="bg-[#0f1f3a] rounded-xl p-6 border border-[#1e3a5f]">
          <p className="text-gray-400 text-sm">Enrolled</p>
          <p className="text-3xl font-bold text-white mt-1">{enrolledCount}</p>
        </div>
        <div className="bg-[#0f1f3a] rounded-xl p-6 border border-[#1e3a5f]">
          <p className="text-gray-400 text-sm">Attendance Rate</p>
          <p className="text-3xl font-bold text-[#c9a227] mt-1">
            {enrolledCount > 0 ? Math.round((records.length / enrolledCount) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="bg-[#0f1f3a] rounded-xl border border-[#1e3a5f] overflow-hidden">
        <h2 className="text-lg font-semibold text-white p-4 border-b border-[#1e3a5f]">Attendance Records</h2>
        {loading ? (
          <div className="animate-pulse p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-[#162a4d] rounded-lg" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No attendance yet. Students will appear here when they scan the QR code.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-[#1e3a5f]">
                  <th className="pb-3 px-4 pt-4">Student #</th>
                  <th className="pb-3 px-4 pt-4">Name</th>
                  <th className="pb-3 px-4 pt-4">Status</th>
                  <th className="pb-3 px-4 pt-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-[#1e3a5f]/50">
                    <td className="py-3 px-4 text-[#c9a227] font-mono">{record.students?.student_number}</td>
                    <td className="py-3 px-4 text-white">{record.students?.full_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm">
                      {new Date(record.attendance_time).toLocaleTimeString()}
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
