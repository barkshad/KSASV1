import { useEffect, useState } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

export function RoleLayout({ role, navItems }: { role: 'admin' | 'lecturer' | 'student', navItems: any[] }) {
  const [authorized, setAuthorized] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate(role === 'admin' ? '/admin/login' : '/login')
        return
      }

      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        const typedData = data as any;
        if (!typedData || (typedData.role !== role && typedData.role !== 'admin')) {
          navigate(role === 'admin' ? '/admin/login' : '/login')
        } else {
          setProfile(typedData)
          setAuthorized(true)
        }
        setLoading(false)
      })
    })
  }, [role, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="flex min-h-screen bg-[#f8f8f8]">
      <Sidebar navItems={navItems} userName={profile?.name || role} userRole={profile?.role || role} />
      <main className="flex-1 p-6 lg:p-8 overflow-auto max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}

