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
    <div className="min-h-screen flex animate-in fade-in duration-500 bg-white">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#111] p-12 relative overflow-hidden text-white">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\\"40\\" height=\\"40\\" viewBox=\\"0 0 40 40\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cpath d=\\"M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z\\" fill=\\"%23ffffff\\" fill-rule=\\"evenodd\\"%3E%3C/path%3E%3C/svg%3E")' }}></div>
        
        <div className="relative z-10 flex items-center gap-3">
           <div className="w-10 h-10 bg-white text-[#111] font-display font-bold flex items-center justify-center text-xl rounded">
            K
          </div>
          <span className="font-display font-semibold tracking-tight text-white text-xl">Kabarak UMS</span>
        </div>

        <div className="relative z-10 max-w-md">
           <h1 className="text-4xl font-display font-bold leading-[1.1] tracking-tight mb-6">
            Join the new era of University Management.
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Create an account to track your academic progress, log attendance, and manage your university profile seamlessly.
          </p>

          <div className="mt-12 space-y-5">
             <div className="flex items-center gap-4 text-gray-300">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">1</div>
                <p>Register with your university details.</p>
             </div>
             <div className="flex items-center gap-4 text-gray-300">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">2</div>
                <p>Access your personalized portal instantly.</p>
             </div>
          </div>
        </div>
        
        <div className="relative z-10 text-sm text-gray-500 flex justify-between w-full">
           <span>Standard User Registration</span>
           <span>v2.0.0</span>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center items-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-[440px] py-12">
          
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-[#111] text-white font-display font-bold flex items-center justify-center text-xl rounded">
              K
            </div>
            <span className="font-display font-bold tracking-tight text-[#111] text-2xl">Kabarak UMS</span>
          </div>

          <div className="mb-10 text-left">
            <h2 className="text-[28px] font-display font-bold text-[#111] tracking-tight mb-2">Create an account</h2>
            <p className="text-[#666]">Enter your details below to get started</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[#fff1f2] border border-[#fecdd3] text-[#be123c] rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#111]">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="ksas-input" placeholder="e.g. Jane Doe" />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#111]">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="ksas-input" placeholder="your@kabarak.ac.ke" />
              {email && !email.endsWith('@kabarak.ac.ke') && (
                <p className="text-[#f59e0b] text-xs font-semibold">Note: Official @kabarak.ac.ke email is recommended.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#111]">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="ksas-input pr-10" placeholder="Min 8 chars" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#111] transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#111]">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="ksas-input pr-10" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#111] transition-colors">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-[#e5e5e5]">
              <label className="block text-sm font-semibold text-[#111]">Account Type (Role)</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} required className="ksas-input bg-white cursor-pointer">
                <option value="student">Student Profile</option>
                <option value="lecturer">Lecturer Profile</option>
              </select>
            </div>

            {role === 'student' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#111]">Student Number</label>
                  <input type="text" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} required className="ksas-input font-mono" placeholder="KAB/XX/XXXXX" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#111]">Course</label>
                    <input type="text" value={course} onChange={(e) => setCourse(e.target.value)} required className="ksas-input" placeholder="e.g. BSc Comp Sci" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#111]">Year of Study</label>
                    <select value={year} onChange={(e) => setYear(e.target.value)} required className="ksas-input bg-white cursor-pointer">
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {role === 'lecturer' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-semibold text-[#111]">Department</label>
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} required className="ksas-input" placeholder="e.g. Computer Science" />
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full h-11 bg-[#111] text-white mt-6">
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm text-[#666] hover:text-[#111] transition-colors font-medium">
              Already have an account? <span className="underline decoration-[#e5e5e5] underline-offset-4">Sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

