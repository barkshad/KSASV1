import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Camera, Hash } from 'lucide-react'

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
        setMessage({ text: 'Presence registered successfully.', type: 'success' })
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

      if (!session) throw new Error('Invalid or expired access code')
      await markAttendance(session.id)
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to authorize access', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const startQRScan = () => {
    setScanning(true)
    setMessage({ text: 'Camera interface not detected. Please use manual code entry for now.', type: 'error' })
    setScanning(false)
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-display font-semibold text-[#111] tracking-tight">Log Attendance</h1>
        <p className="text-[#666] mt-2">Submit your presence for an active lecture session.</p>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-xl flex items-start gap-3 border ${message.type === 'success' ? 'bg-[#f0fdf4] border-[#bbf7d0] text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle2 className="shrink-0 mt-0.5 text-green-600" size={18} /> : <AlertCircle className="shrink-0 mt-0.5 text-red-600" size={18} />}
          <p className="font-medium text-sm">{message.text}</p>
        </div>
      )}

      {loading && (
        <div className="mb-8 p-6 text-center bg-white border border-[#e5e5e5] rounded-xl shadow-sm">
          <div className="inline-block w-6 h-6 border-2 border-[#111] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#666] text-sm font-medium mt-3">Verifying credentials and logging record...</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="ksas-card overflow-hidden group">
          <div className="w-12 h-12 bg-[#f3f3f3] rounded-2xl flex items-center justify-center mb-6 text-[#111] group-hover:scale-110 transition-transform duration-500">
            <Camera size={24} />
          </div>
          <h2 className="text-xl font-display font-semibold text-[#111] mb-2">QR Scan</h2>
          <p className="text-[#666] text-sm mb-8 leading-relaxed">
            Use your device camera to rapidly scan the QR code displayed by the instructor on the presentation screen.
          </p>
          <button onClick={startQRScan} disabled={scanning || loading}
            className="w-full btn-primary bg-[#111] text-white disabled:opacity-50 justify-center">
            {scanning ? 'Initializing...' : 'Launch Camera'}
          </button>
        </div>

        <div className="ksas-card overflow-hidden">
          <div className="w-12 h-12 bg-[#f3f3f3] rounded-2xl flex items-center justify-center mb-6 text-[#111]">
            <Hash size={24} />
          </div>
          <h2 className="text-xl font-display font-semibold text-[#111] mb-2">Access Code</h2>
          <p className="text-[#666] text-sm mb-8 leading-relaxed">Enter the 6-character alpha-numeric code provided by the instructor.</p>
          
          <form onSubmit={handleManualCode} className="space-y-4">
            <div>
              <input 
                type="text" 
                value={sessionCode} 
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                maxLength={6} 
                placeholder="000000"
                className="w-full bg-[#f8f8f8] border border-[#e5e5e5] text-[#111] rounded-xl px-4 py-4 text-center text-3xl tracking-[0.25em] font-mono font-bold focus:outline-none focus:border-[#111] focus:bg-white transition-colors" 
              />
            </div>
            <button type="submit" disabled={loading || sessionCode.length < 6}
              className="w-full btn-secondary justify-center disabled:opacity-50">
              {loading ? 'Authenticating...' : 'Submit Entry'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

