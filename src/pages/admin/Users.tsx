import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Search, Edit2, Trash2, X, Loader2, Download } from 'lucide-react'
import Papa from 'papaparse'

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
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const itemsPerPage = 10

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
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

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch('/api/admin/users/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users: results.data })
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Upload failed')
          
          if (data.errors?.length > 0) {
            showToast(`Imported ${data.successCount}. Failed: ${data.errors.length}`, 'error')
          } else {
            showToast(`Successfully imported ${data.successCount} users`, 'success')
          }
          fetchUsers()
        } catch (err: any) {
          showToast(err.message, 'error')
        } finally {
          setIsUploading(false)
          e.target.value = ''
        }
      },
      error: (error) => {
        showToast(error.message, 'error')
        setIsUploading(false)
        e.target.value = ''
      }
    })
  }

  const deleteUser = async () => {
    if (!userToDelete) return
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      showToast('User deleted successfully', 'success')
      setIsDeleteModalOpen(false)
      fetchUsers()
    } catch (e: any) {
      showToast(e.message, 'error')
    }
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
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-[#111] tracking-tight">Directory</h1>
          <p className="text-sm text-[#666] mt-1">Manage system accounts across all roles.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="btn-secondary cursor-pointer relative overflow-hidden group">
             {isUploading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2 group-hover:text-[#111]" />}
             {isUploading ? 'Uploading...' : 'Import CSV'}
             <input type="file" accept=".csv" onChange={handleCsvUpload} disabled={isUploading} className="absolute inset-0 opacity-0 cursor-pointer" />
          </label>
          <button className="btn-primary flex items-center gap-2 bg-[#111] text-white" onClick={() => { setEditingUser(null); setIsModalOpen(true); }}>
            <Plus size={16} /> New User
          </button>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg z-50 shadow-lg border text-sm font-medium animate-in slide-in-from-bottom-4 ${toast.type === 'success' ? 'bg-white border-green-200 text-green-700' : 'bg-white border-red-200 text-red-700'}`}>
          {toast.message}
        </div>
      )}

      <div className="ksas-card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-48 appearance-none bg-white"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="lecturer">Lecturer</option>
            <option value="student">Student</option>
          </select>
        </div>
      </div>

      <div className="ksas-card overflow-hidden !p-0 border-[#e5e5e5] shadow-sm">
        <div className="ksas-table-container">
          <table className="ksas-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-12 text-[#666]">Loading directory...</td></tr>
              ) : paginatedUsers.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-[#666]">No records found.</td></tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="group">
                    <td>
                      <div className="font-medium text-[#111]">{user.name}</div>
                      <div className="text-sm text-[#666] mt-0.5">{user.email}</div>
                    </td>
                    <td>
                      <span className={`badge ${
                        user.role === 'admin' ? 'badge-admin' :
                        user.role === 'lecturer' ? 'badge-lecturer' :
                        'badge-student'
                      }`}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        user.status === 'active' ? 'badge-success' : 'badge-error'
                      }`}>{user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => toggleStatus(user.id, user.status)}
                          className="text-xs text-[#666] hover:text-[#111] px-2.5 py-1.5 rounded border border-[#e5e5e5] hover:border-[#111] transition-colors font-medium bg-white"
                        >
                          {user.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} className="w-8 h-8 flex items-center justify-center text-[#666] hover:text-[#111] hover:bg-[#f3f3f3] rounded border border-transparent hover:border-[#e5e5e5] transition-all">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => { setUserToDelete(user); setIsDeleteModalOpen(true); }} className="w-8 h-8 flex items-center justify-center text-[#666] hover:text-[#dc2626] hover:bg-[#fef2f2] rounded border border-transparent hover:border-[#fee2e2] transition-all">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-[#111] text-white shadow-sm' : 'bg-transparent border border-[#e5e5e5] text-[#666] hover:bg-[#f3f3f3] hover:text-[#111]'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={editingUser}
        onSuccess={() => { setIsModalOpen(false); fetchUsers(); }}
      />

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-[#111]/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="ksas-card max-w-sm w-full animate-in zoom-in-95 shadow-xl">
            <h3 className="text-xl font-bold text-[#111] tracking-tight mb-2">Confirm Deletion</h3>
            <p className="text-[#666] text-sm mb-6 leading-relaxed">Are you sure you want to permanently delete <strong className="text-[#111] font-medium">{userToDelete?.name}</strong>? This action cannot be reversed.</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsDeleteModalOpen(false)} className="btn-secondary">Cancel</button>
              <button onClick={deleteUser} className="btn-danger">Delete User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function UserModal({ isOpen, onClose, user, onSuccess }: { isOpen: boolean, onClose: () => void, user: Profile | null, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'student',
    studentNumber: '', course: '', year: '1', department: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && user) {
      setFormData(prev => ({ ...prev, name: user.name, email: user.email, role: user.role }))
    } else if (isOpen && !user) {
      setFormData({ name: '', email: '', password: '', role: 'student', studentNumber: '', course: '', year: '1', department: '' })
    }
  }, [isOpen, user])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Inline validation
    if (!user && formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const url = user ? `/api/admin/users/${user.id}` : '/api/admin/users'
      const method = user ? 'PATCH' : 'POST'
      
      const payload: any = { ...formData }
      if (user && !payload.password) delete payload.password // Don't send empty pass on edit

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#111]/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="ksas-card max-w-md w-full animate-in zoom-in-95 shadow-xl my-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold font-display text-[#111] tracking-tight">{user ? 'Edit Details' : 'Add Profile'}</h2>
          <button onClick={onClose} className="p-2 text-[#999] hover:text-[#111] hover:bg-[#f3f3f3] rounded-md transition-colors"><X size={18} /></button>
        </div>

        {error && <div className="bg-[#fef2f2] border border-[#fee2e2] text-[#dc2626] px-4 py-2.5 rounded-lg mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#111]">Full Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#111]">Email Address</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required disabled={!!user} className="w-full disabled:opacity-50 disabled:bg-[#f8f8f8]" />
            {!user && formData.email && !formData.email.endsWith('@kabarak.ac.ke') && (
               <p className="text-[#f59e0b] text-xs">Consider using an @kabarak.ac.ke email.</p>
            )}
          </div>

          <div className="space-y-1.5">
             <label className="block text-sm font-medium text-[#111]">{user ? 'New Password (Optional)' : 'Password'}</label>
             <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!user} className="w-full" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#111]">Account Role</label>
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required className="w-full appearance-none">
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {formData.role === 'student' && (
            <>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#111]">Registration Number</label>
                <input type="text" value={formData.studentNumber} onChange={e => setFormData({...formData, studentNumber: e.target.value})} className="w-full" required />
              </div>
              <div className="flex gap-4">
                <div className="space-y-1.5 flex-1">
                  <label className="block text-sm font-medium text-[#111]">Course Code</label>
                  <input type="text" value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} className="w-full" required />
                </div>
                <div className="space-y-1.5 flex-[0.7]">
                  <label className="block text-sm font-medium text-[#111]">Year</label>
                  <select value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full appearance-none" required>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {formData.role === 'lecturer' && (
             <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#111]">Department</label>
                <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full" required />
             </div>
          )}

          <div className="flex justify-end gap-3 mt-8 border-t border-[#e5e5e5] pt-5">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary bg-[#111] text-white">
              {loading ? <Loader2 className="animate-spin w-5 h-5 mx-6" /> : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

