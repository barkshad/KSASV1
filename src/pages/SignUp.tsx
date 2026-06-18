import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('student')
  const [studentNumber, setStudentNumber] = useState('')
  const [course, setCourse] = useState('')
  const [year, setYear] = useState('1st Year')
  const [department, setDepartment] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Inline validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }
    if (password.length < 8 || !/\d/.test(password)) {
      setError('Password must be at least 8 characters and contain 1 number')
      setLoading(false)
      return
    }
    if (!email.endsWith('@kabarak.ac.ke')) {
      // Allow but warn could be tricky, using error for simplicity, or just bypass for testing.
      // But rules requested: "Email must match @kabarak.ac.ke or show warning" -> Let's just allow it for now
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!user) throw new Error('User creation failed')

      // Insert profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: user.id, name, email, role, status: 'active' })

      if (profileError) throw profileError

      if (role === 'student') {
        const { error: studentError } = await supabase.from('students').insert({
          profile_id: user.id,
          student_number: studentNumber,
          full_name: name,
          email,
          course,
          year: parseInt(year.charAt(0)) || 1
        })
        if (studentError) throw studentError
      } else if (role === 'lecturer') {
         const { error: lecturerError } = await supabase.from('lecturers').insert({
          profile_id: user.id,
          full_name: name,
          email,
          department
        })
        if (lecturerError) throw lecturerError
      }

      // Navigate based on role
      if (role === 'lecturer') navigate('/lecturer')
      else navigate('/student')

    } catch (err: any) {
      setError(err.message || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-center items-center w-[45%] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0idHJhbnNwYXJlbnQiPjwvcmVjdD4KPHBhdGggZD0iTTAgNDBMIQwgMEwwIDQwWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWUzMzU4IiBzdHJva2Utb3BhY2l0eT0iMC4yIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] bg-[#0a1628] relative px-12 text-center border-r border-[#1e3358]">
        <div className="w-20 h-20 rounded-full border-2 border-[#c9a227] flex items-center justify-center mb-6">
          <span className="font-display text-[#c9a227] text-3xl font-bold">K</span>
        </div>
        <h1 className="font-display text-4xl text-[#f0f4ff] font-bold mb-4 leading-tight">
          Kabarak Smart<br/>Attendance System
        </h1>
        <p className="text-[#8ba0c4] text-[15px] mb-12">Precision attendance for every lecture.</p>
        
        <div className="flex flex-col gap-4 items-center">
          <div className="border border-[#1e3358] rounded-full px-4 py-1.5 text-[12px] text-[#8ba0c4] flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#c9a227]"></div>
            Fraud-proof QR codes
          </div>
          <div className="border border-[#1e3358] rounded-full px-4 py-1.5 text-[12px] text-[#8ba0c4] flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#c9a227]"></div>
            Real-time tracking
          </div>
          <div className="border border-[#1e3358] rounded-full px-4 py-1.5 text-[12px] text-[#8ba0c4] flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#c9a227]"></div>
            Instant CSV export
          </div>
        </div>

        <div className="absolute bottom-8 text-[#4d6285] text-[11px]">
          Powered by Kabarak University
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-[55%] flex items-center justify-center bg-[#0a1628] px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-[440px]">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#f0f4ff] mb-2">Create your account</h2>
            <p className="text-[#8ba0c4] text-sm">Join the Kabarak Smart Attendance System</p>
          </div>

          {error && (
            <div className="bg-red-900/20 border-l-4 border-[#ef4444] text-red-300 px-4 py-3 rounded-lg mb-6 text-sm animate-in fade-in slide-in-from-top-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#f0f4ff]">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full" placeholder="John Doe" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#f0f4ff]">Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full" placeholder="your@kabarak.ac.ke" />
              {email && !email.endsWith('@kabarak.ac.ke') && (
                <p className="text-[#f59e0b] text-xs">Warning: It is recommended to use your @kabarak.ac.ke email.</p>
              )}
            </div>

            <div className="space-y-1.5 relative">
              <label className="block text-sm font-medium text-[#f0f4ff]">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pr-10" placeholder="Min 8 chars, 1 number" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba0c4] hover:text-[#f0f4ff]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 relative">
              <label className="block text-sm font-medium text-[#f0f4ff]">Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full pr-10" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba0c4] hover:text-[#f0f4ff]">
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#f0f4ff]">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} required className="w-full">
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
              </select>
            </div>

            {role === 'student' && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#f0f4ff]">Student Number</label>
                  <input type="text" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} required className="w-full" placeholder="KAB/XX/XXXXX" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#f0f4ff]">Course</label>
                  <input type="text" value={course} onChange={(e) => setCourse(e.target.value)} required className="w-full" placeholder="e.g. BSc Computer Science" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#f0f4ff]">Year of Study</label>
                  <select value={year} onChange={(e) => setYear(e.target.value)} required className="w-full">
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                  </select>
                </div>
              </>
            )}

            {role === 'lecturer' && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#f0f4ff]">Department</label>
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} required className="w-full" placeholder="e.g. Computer Science" />
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
              {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-[#8ba0c4] text-sm hover:text-[#f0f4ff]">
              Already have an account? <span className="text-[#f0c84a]">Sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
