import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type Profile = {
  id: string
  name: string
  email: string
  role: string
  status: string
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const itemsPerPage = 10

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) { showToast('Failed to load users', 'error') }
    else { setUsers(data || []) }
    setLoading(false)
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id)
    if (error) { showToast('Failed to update status', 'error') }
    else { showToast(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success'); fetchUsers() }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">User Management</h1>

      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {toast.message}
        </div>
      )}

      <div className="bg-[#0f1f3a] rounded-xl p-6 border border-[#1e3a5f]">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-[#162a4d] border border-[#1e3a5f] text-white rounded-lg px-4 py-2"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#162a4d] border border-[#1e3a5f] text-white rounded-lg px-4 py-2"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="lecturer">Lecturer</option>
            <option value="student">Student</option>
          </select>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-[#162a4d] rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-[#1e3a5f]">
                    <th className="pb-3 px-4">Name</th>
                    <th className="pb-3 px-4">Email</th>
                    <th className="pb-3 px-4">Role</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="border-b border-[#1e3a5f]/50 hover:bg-[#162a4d]/50">
                      <td className="py-3 px-4 text-white">{user.name}</td>
                      <td className="py-3 px-4 text-gray-300">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-red-500/20 text-red-300' :
                          user.role === 'lecturer' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>{user.role}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                        }`}>{user.status}</span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleStatus(user.id, user.status)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            user.status === 'active'
                              ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                              : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                          }`}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg ${currentPage === i + 1 ? 'bg-[#c9a227] text-[#0a1628]' : 'bg-[#162a4d] text-white'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
