import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="min-h-screen flex items-center justify-center bg-[#0a1628] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#c9a227] rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#0a1628]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">KSAS</h1>
          <p className="text-[#c9a227] text-sm">Kabarak Smart Attendance System</p>
        </div>

        <div className="bg-[#0f1f3a] rounded-xl p-8 shadow-2xl border border-[#1e3a5f]">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">Sign In</h2>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#162a4d] border border-[#1e3a5f] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                placeholder="your.email@kabarak.ac.ke"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#162a4d] border border-[#1e3a5f] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c9a227] hover:bg-[#d4b43a] text-[#0a1628] font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          Kabarak University &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
