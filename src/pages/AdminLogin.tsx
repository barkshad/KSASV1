import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react'

export default function AdminLogin() {
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
        } else {
          // Explicitly reject non-admins
          await supabase.auth.signOut()
          setError('Access denied. Administrator privileges required.')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-[#f8f8f8]">
      <div className="w-full flex items-center justify-center bg-white px-6 py-12 relative flex-col">
        <Link to="/" className="absolute top-8 left-8 flex items-center text-[#666] hover:text-[#111] text-sm font-medium transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Back to Portals
        </Link>
        <div className="w-full max-w-[400px]">
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-[#f8f8f8] rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <ShieldCheck className="w-8 h-8 text-[#111]" />
            </div>
            <h2 className="text-3xl font-semibold text-[#111] mb-2 font-display tracking-tight">Admin Services</h2>
            <p className="text-[#666] text-sm">Sign in to manage the university platform.</p>
          </div>

          {error && (
            <div className="bg-[#fef2f2] border border-[#fee2e2] text-[#dc2626] px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#111]">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
                placeholder="admin@kabarak.ac.ke"
              />
            </div>

            <div className="space-y-1.5 relative">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-[#111]">Password</label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#111] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-4 bg-[#111] text-white"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : 'Authenticate'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
