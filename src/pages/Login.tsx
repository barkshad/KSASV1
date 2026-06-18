import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin') {
          navigate('/admin')
        } else if (profile?.role === 'lecturer') {
          navigate('/lecturer')
        } else if (profile?.role === 'student') {
          navigate('/student')
        } else {
          setError('User role not found. Contact admin.')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
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
      <div className="w-full lg:w-[55%] flex items-center justify-center bg-[#0a1628] px-6 py-12">
        <div className="w-full max-w-[440px]">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#f0f4ff] mb-2">Welcome back</h2>
            <p className="text-[#8ba0c4] text-sm">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="bg-red-900/20 border-l-4 border-[#ef4444] text-red-300 px-4 py-3 rounded-lg mb-6 text-sm animate-in fade-in slide-in-from-top-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#f0f4ff]">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
                placeholder="your@kabarak.ac.ke"
              />
            </div>

            <div className="space-y-1.5 relative">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-[#f0f4ff]">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pr-10"
                  placeholder="Enter your password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba0c4] hover:text-[#f0f4ff]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <a href="#" className="text-[#f0c84a] text-[13px] hover:underline">Forgot password?</a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center">
            <div className="border-t border-[#1e3358] flex-1"></div>
            <span className="text-xs text-[#8ba0c4] px-4">Don't have an account?</span>
            <div className="border-t border-[#1e3358] flex-1"></div>
          </div>
          
          <div className="mt-6 text-center">
            <Link to="/sign-up" className="text-[#f0c84a] font-medium text-sm hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

