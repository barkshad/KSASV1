import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://skwwzbetgbugzdrjequx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrd3d6YmV0Z2J1Z3pkcmplcXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzQyNTksImV4cCI6MjA5NzIxMDI1OX0.CBOSihJuB8RXmUS_M7h9sgFBhSxUssYFfYdDhH7Q1Nc'

export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey)
