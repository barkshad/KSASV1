import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useSession() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)

      if (authUser) {
        const { data: userProfile } = await supabase
          .from('profiles').select('*').eq('id', authUser.id).single()
        setProfile(userProfile)
      }

      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => setProfile(data))
      } else {
        setProfile(null)
      }
    })

    return () => { subscription.unsubscribe() }
  }, [])

  return { user, profile, loading }
}
