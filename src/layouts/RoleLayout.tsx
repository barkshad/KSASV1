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
        navigate('/login')
        return
      }

      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        const typedData = data as any;
        if (!typedData || (typedData.role !== role && typedData.role !== 'admin')) {
          navigate('/login')
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
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c9a227] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="flex min-h-screen bg-[#0a1628]">
      <Sidebar navItems={navItems} userName={profile?.name || role} userRole={profile?.role || role} />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
