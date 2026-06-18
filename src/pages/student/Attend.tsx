import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useSearchParams, useNavigate } from 'react-router-dom'

export default function AttendPage() {
  const [sessionCode, setSessionCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [scanning, setScanning] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('session')

  useEffect(() => {
    if (sessionId) { handleSessionAttendance(sessionId) }
  }, [sessionId])

  const handleSessionAttendance = async (sid: string) => {
    setLoading(true)
    await markAttendance(sid)
    setLoading(false)
  }

  const markAttendance = async (sid: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: student } = await supabase
        .from('students').select('id').eq('profile_id', user.id).single()
      if (!student) throw new Error('Student record not found')

      const { data: session } = await supabase
        .from('attendance_sessions')
        .select('*, courses(id)')
        .eq('id', sid)
        .eq('status', 'active')
        .single()
      if (!session) throw new Error('Session not found or ended')

      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', student.id)
        .eq('course_id', session.course_id)
        .single()
      if (!enrollment) throw new Error('You are not enrolled in this course')

      const { error: insertError } = await supabase
        .from('attendance_records')
        .insert({ session_id: sid, student_id: student.id, status: 'Present' })

      if (insertError) {
        if (insertError.code === '23505') {
          setMessage({ text: 'You have already marked attendance for this session!', type: 'error' })
        } else { throw insertError }
      } else {
        setMessage({ text: 'Attendance marked successfully!', type: 'success' })
        setTimeout(() => navigate('/student/history'), 2000)
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to mark attendance', type: 'error' })
    }
  }

  const handleManualCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { data: session } = await supabase
        .from('attendance_sessions')
        .select('id')
        .eq('session_code', sessionCode.toUpperCase())
        .eq('status', 'active')
        .single()

      if (!session) throw new Error('Invalid or expired session code')
      await markAttendance(session.id)
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to mark attendance', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const startQRScan = () => {
    setScanning(true)
    setMessage({ text: 'Camera QR scanning requires a QR scanner library. Please use manual code entry for now.', type: 'error' })
    setScanning(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Mark Attendance</h1>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg ${message.type === 'success' ? 'bg-green-600/20 border border-green-500/50 text-green-300' : 'bg-red-600/20 border border-red-500/50 text-red-300'}`}>
          {message.text}
        </div>
      )}

      {loading && (
        <div className="mb-6 text-center">
          <div className="inline-block w-8 h-8 border-2 border-[#c9a227] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 mt-2">Processing...</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0f1f3a] rounded-xl p-6 border border-[#1e3a5f]">
          <h2 className="text-lg font-semibold text-white mb-4">Scan QR Code</h2>
          <p className="text-gray-400 text-sm mb-4">Use your device camera to scan the QR code displayed by your lecturer.</p>
          <button onClick={startQRScan} disabled={scanning || loading}
            className="w-full bg-[#c9a227] hover:bg-[#d4b43a] text-[#0a1628] font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
            {scanning ? 'Scanning...' : 'Start Camera Scan'}
          </button>
          {scanning && <p className="text-gray-400 text-sm mt-3 text-center">Point camera at the QR code...</p>}
        </div>

        <div className="bg-[#0f1f3a] rounded-xl p-6 border border-[#1e3a5f]">
          <h2 className="text-lg font-semibold text-white mb-4">Enter Session Code</h2>
          <p className="text-gray-400 text-sm mb-4">Type the 6-character code shown on screen.</p>
          <form onSubmit={handleManualCode}>
            <input type="text" value={sessionCode} onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              maxLength={6} placeholder="ABC123"
              className="w-full bg-[#162a4d] border border-[#1e3a5f] text-white rounded-lg px-4 py-3 text-center text-xl tracking-widest font-mono mb-4 focus:outline-none focus:ring-2 focus:ring-[#c9a227]" />
            <button type="submit" disabled={loading || sessionCode.length < 6}
              className="w-full bg-[#162a4d] hover:bg-[#1e3a5f] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Code'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
