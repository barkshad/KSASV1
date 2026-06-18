import { useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type NavItem = {
  href: string
  label: string
  icon: string
}

export default function Sidebar({ navItems, userName, userRole }: {
  navItems: NavItem[]
  userName: string
  userRole: string
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const pathname = location.pathname
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate(userRole === 'admin' ? '/admin/login' : '/login')
  }

  const renderIcon = (path: string) => (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  )

  return (
    <>
      <button onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white shadow-sm p-2 rounded-lg border border-[#e5e5e5] text-[#111]">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <aside className={`
        fixed lg:sticky top-0 h-screen z-40 bg-white border-r border-[#e5e5e5]
        transition-all duration-300 flex flex-col
        ${collapsed ? 'w-20' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-[#e5e5e5]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${userRole === 'admin' ? 'bg-[#111] text-white' : 'bg-[#f3f3f3] text-[#111]'} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <span className="font-display font-medium text-lg">U</span>
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-[#111] font-display font-semibold text-sm tracking-tight">KABARAK UNIV.</h2>
                <p className="text-[#666] text-[11px] uppercase tracking-wider">{userRole.toUpperCase()} PORTAL</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-wider text-[#999] font-medium mb-3 px-3">
            {!collapsed && "Platform Menu"}
          </div>
          {navItems.map((item) => {
            const isExactMatch = pathname === item.href
            
            return (
              <Link key={item.href} to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                  ${isExactMatch ? 'bg-[#111] text-white shadow-md' : 'text-[#666] hover:bg-[#f3f3f3] hover:text-[#111]'}
                `}
                title={collapsed ? item.label : undefined}>
                {renderIcon(item.icon)}
                {!collapsed && <span className="text-[13px] font-medium tracking-wide">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#e5e5e5] bg-[#fafafa]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 bg-white border border-[#e5e5e5] shadow-sm rounded-full flex items-center justify-center flex-shrink-0 text-[#111] font-medium text-sm">
              {userName?.charAt(0)}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[#111] font-medium text-[13px] truncate">{userName}</p>
                <p className="text-[#666] text-[11px] capitalize">{userRole}</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout}
            className={`flex items-center gap-3 w-full text-[#666] hover:bg-[#fef2f2] hover:text-[#dc2626] transition-colors py-2 rounded-lg text-sm font-medium ${collapsed ? 'justify-center border border-transparent' : 'px-3 border border-[#e5e5e5] bg-white shadow-sm'}`}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        <button onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3.5 top-20 w-7 h-7 bg-white border border-[#e5e5e5] shadow-sm rounded-full items-center justify-center text-[#666] hover:text-[#111] hover:shadow-md transition-all">
          <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-[#111]/20 backdrop-blur-sm z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
    </>
  )
}

