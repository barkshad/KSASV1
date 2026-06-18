import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Download, MonitorX, QrCode } from 'lucide-react'

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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
        <div className="mb-12 text-center space-y-2">
          <h1 className="text-5xl font-display font-bold text-[#111] tracking-tight">{session?.courses?.course_name}</h1>
          <p className="text-2xl text-[#666] font-mono">{session?.courses?.course_code}</p>
        </div>
        
        <div className="bg-white p-12 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-[#e5e5e5]">
          <QRCodeSVG value={session?.qr_payload || ''} size={480} level="H" includeMargin={false} fgColor="#111111" />
        </div>
        
        <div className="mt-12 text-center space-y-4">
          <p className="text-[#666] text-xl font-medium tracking-wide pb-2">SESSION CODE</p>
          <div className="inline-block px-10 py-4 bg-[#f8f8f8] border-2 border-[#111] rounded-2xl">
            <p className="text-[#111] text-6xl font-mono font-bold tracking-[0.2em]">{session?.session_code}</p>
          </div>
          <p className="text-[#999] mt-6 max-w-sm mx-auto leading-relaxed">Scan the QR code with the student portal or enter the session code to log presence.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8 pb-6 border-b border-[#e5e5e5]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm bg-[#111] text-white px-2.5 py-1 rounded-md font-semibold">{session?.courses?.course_code}</span>
            <span className="font-mono text-sm border border-[#e5e5e5] text-[#111] bg-white px-2.5 py-1 rounded-md font-semibold">CODE: {session?.session_code}</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-[#111] tracking-tight">Live Observation Room</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {session?.status === 'active' && (
            <button onClick={endSession}
              className="btn-danger flex items-center gap-2">
              <MonitorX size={16} /> Close Session
            </button>
          )}
          <button onClick={downloadCSV}
            className="btn-secondary flex items-center gap-2">
            <Download size={16} /> Export Logs
          </button>
          <a href={`/lecturer/sessions/${sessionId}?view=qr`} target="_blank" rel="noreferrer"
            className="btn-primary bg-[#111] text-white flex items-center gap-2">
            <QrCode size={16} /> Spotlight QR
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="ksas-card overflow-hidden relative">
          <p className="text-[#666] text-xs font-medium uppercase tracking-wider mb-2">Present Today</p>
          <p className="text-4xl font-display font-bold text-green-600">{records.length}</p>
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-green-500 rounded-r-xl opacity-20"></div>
        </div>
        <div className="ksas-card overflow-hidden relative">
          <p className="text-[#666] text-xs font-medium uppercase tracking-wider mb-2">Total Roster</p>
          <p className="text-4xl font-display font-bold text-[#111]">{enrolledCount}</p>
        </div>
        <div className="ksas-card overflow-hidden relative">
          <p className="text-[#666] text-xs font-medium uppercase tracking-wider mb-2">Current Turnout</p>
          <p className="text-4xl font-display font-bold text-[#111]">
            {enrolledCount > 0 ? Math.round((records.length / enrolledCount) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="ksas-card !p-0 overflow-hidden border-[#e5e5e5] shadow-sm">
        <div className="px-6 py-4 border-b border-[#e5e5e5] bg-[#f8f8f8] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[#111] tracking-tight">Real-time Feed</h2>
          {session?.status === 'active' && (
             <div className="flex items-center gap-2">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
               </span>
               <span className="text-xs font-medium text-green-700">Listening for signals...</span>
             </div>
          )}
        </div>
        
        {loading ? (
          <div className="animate-pulse p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-[#f3f3f3] rounded-lg" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="p-16 text-center text-[#666]">
            <QrCode className="mx-auto h-12 w-12 text-[#ccc] mb-4" />
            <p className="font-medium text-[#111] mb-1">Awaiting Initial Check-in</p>
            <p className="text-sm">The roster will populate automatically as students submit their presence.</p>
          </div>
        ) : (
          <div className="ksas-table-container">
            <table className="ksas-table !border-0 text-sm">
              <thead className="bg-white">
                <tr>
                  <th className="font-semibold text-[#111]">Student Identification</th>
                  <th className="font-semibold text-[#111]">Status Flag</th>
                  <th className="font-semibold text-[#111] text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-[#f3f3f3] hover:bg-[#fafafa] transition-colors last:border-0">
                    <td className="py-3">
                      <div className="font-medium text-[#111]">{record.students?.full_name}</div>
                      <div className="text-xs font-mono text-[#666] mt-0.5">{record.students?.student_number}</div>
                    </td>
                    <td className="py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#f0fdf4] text-green-700 border border-green-200 inline-block">
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                       <span className="text-xs text-[#666] font-mono bg-[#f3f3f3] px-2 py-1 rounded">
                         {new Date(record.attendance_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                       </span>
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
