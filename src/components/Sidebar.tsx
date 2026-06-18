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
    navigate('/login')
  }

  const renderIcon = (path: string) => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  )

  return (
    <>
      <button onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#0f1f3a] p-2 rounded-lg border border-[#1e3a5f] text-white">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 bg-[#0f1f3a] border-r border-[#1e3a5f]
        transition-all duration-300 flex flex-col
        ${collapsed ? 'w-20' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-[#1e3a5f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#c9a227] rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-[#0a1628] font-bold text-lg">K</span>
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-white font-bold text-sm">KSAS</h2>
                <p className="text-[#c9a227] text-xs">Kabarak University</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && item.href !== '/lecturer' && item.href !== '/student' && pathname.startsWith(`${item.href}/`)) || (pathname.startsWith(item.href) && item.href !== '/admin' && item.href !== '/lecturer' && item.href !== '/student' && item.href.length > 2)
            
            // Fix active logic to account for root routes
            const isExactMatch = pathname === item.href;
            
            return (
              <Link key={item.href} to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                  ${isExactMatch ? 'bg-[#c9a227]/20 text-[#c9a227]' : 'text-gray-300 hover:bg-[#162a4d] hover:text-white'}
                `}
                title={collapsed ? item.label : undefined}>
                {renderIcon(item.icon)}
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#1e3a5f]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-[#162a4d] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[#c9a227] text-sm font-bold">{userName?.charAt(0)}</span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-white text-sm truncate">{userName}</p>
                <p className="text-gray-400 text-xs capitalize">{userRole}</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout}
            className={`flex items-center gap-3 text-gray-400 hover:text-red-400 transition-colors text-sm ${collapsed ? 'justify-center w-full' : 'px-3'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        <button onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-[#c9a227] rounded-full items-center justify-center text-[#0a1628]">
          <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
    </>
  )
}
