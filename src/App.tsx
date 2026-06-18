/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import { RoleLayout } from './layouts/RoleLayout'

import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminCourses from './pages/admin/Courses'
import AdminAnalytics from './pages/admin/Analytics'

import LecturerDashboard from './pages/lecturer/Dashboard'
import LecturerSessions from './pages/lecturer/Sessions'
import LecturerLiveSession from './pages/lecturer/LiveSession'

import StudentDashboard from './pages/student/Dashboard'
import StudentAttend from './pages/student/Attend'
import StudentHistory from './pages/student/History'

import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function HomeRedirect() {
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setRole('guest')
        setLoading(false)
        return
      }
      supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => {
        const typedData = data as any;
        setRole(typedData?.role || 'guest')
        setLoading(false)
      })
    })
  }, [])

  if (loading) return <div className="min-h-screen bg-navy-900 flex items-center justify-center p-8"><div className="w-8 h-8 border-2 border-[#c9a227] border-t-transparent rounded-full animate-spin" /></div>
  
  if (role === 'admin') return <Navigate to="/admin" />
  if (role === 'lecturer') return <Navigate to="/lecturer" />
  if (role === 'student') return <Navigate to="/student" />
  
  return <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />

        {/* Admin Routes */}
        <Route element={<RoleLayout role="admin" navItems={[
            { href: '/admin', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { href: '/admin/users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { href: '/admin/courses', label: 'Courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
            { href: '/admin/analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
        ]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
        </Route>

        {/* Lecturer Routes */}
        <Route element={<RoleLayout role="lecturer" navItems={[
            { href: '/lecturer', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { href: '/lecturer/sessions', label: 'Sessions', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
        ]} />}>
          <Route path="/lecturer" element={<LecturerDashboard />} />
          <Route path="/lecturer/sessions" element={<LecturerSessions />} />
          <Route path="/lecturer/sessions/:id" element={<LecturerLiveSession />} />
        </Route>

        {/* Student Routes */}
        <Route element={<RoleLayout role="student" navItems={[
            { href: '/student', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { href: '/student/attend', label: 'Mark Attendance', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
            { href: '/student/history', label: 'History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
        ]} />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/attend" element={<StudentAttend />} />
          <Route path="/student/history" element={<StudentHistory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

