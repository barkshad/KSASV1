import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Edit2, Trash2, X, Users, Loader2, Search } from 'lucide-react'

type Course = {
  id: string
  course_code: string
  course_name: string
  lecturer_id: string | null
  lecturer_name?: string
  student_count?: number
}

type Lecturer = {
  id: string
  full_name: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  
  const [courseCode, setCourseCode] = useState('')
  const [courseName, setCourseName] = useState('')
  const [selectedLecturer, setSelectedLecturer] = useState('')
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // Student Enrollment state
  const [enrollModalCourse, setEnrollModalCourse] = useState<Course | null>(null)

  useEffect(() => { fetchCourses(); fetchLecturers() }, [])

  const fetchCourses = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('courses')
      .select('*, lecturers(full_name)')
      .order('course_code')

    if (error) { 
      showToast('Failed to load courses', 'error') 
    } else { 
      const mapped = data?.map((c: any) => ({ ...c, lecturer_name: c.lecturers?.full_name, student_count: 0 })) || [] 
      
      try {
        const { data: enrollData } = await supabase.from('enrollments').select('course_id')
        if (enrollData) {
          const counts = enrollData.reduce((acc: any, row: any) => {
             acc[row.course_id] = (acc[row.course_id] || 0) + 1
             return acc
          }, {})
          mapped.forEach((m: any) => m.student_count = counts[m.id] || 0)
        }
      } catch (e) {
      }
      
      setCourses(mapped)
    }
    setLoading(false)
  }

  const fetchLecturers = async () => {
    const { data } = await supabase.from('lecturers').select('id, full_name').order('full_name')
    setLecturers(data || [])
  }

  const saveCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    const courseData = { course_code: courseCode, course_name: courseName, lecturer_id: selectedLecturer || null }

    if (editingCourse) {
      const { error } = await supabase.from('courses').update(courseData).eq('id', editingCourse.id)
      if (error) showToast('Failed to update course', 'error')
      else showToast('Course updated successfully', 'success')
    } else {
      const { error } = await supabase.from('courses').insert(courseData)
      if (error) showToast('Failed to create course', 'error')
      else showToast('Course created successfully', 'success')
    }

    setShowModal(false)
    resetForm()
    fetchCourses()
  }

  const deleteCourse = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) showToast('Failed to delete course', 'error')
    else { showToast('Course deleted successfully', 'success'); fetchCourses() }
  }

  const editCourse = (course: Course) => {
    setEditingCourse(course)
    setCourseCode(course.course_code)
    setCourseName(course.course_name)
    setSelectedLecturer(course.lecturer_id || '')
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingCourse(null)
    setCourseCode('')
    setCourseName('')
    setSelectedLecturer('')
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const filteredCourses = courses.filter(course => 
    course.course_code.toLowerCase().includes(search.toLowerCase()) || 
    course.course_name.toLowerCase().includes(search.toLowerCase()) ||
    (course.lecturer_name && course.lecturer_name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-[#111] tracking-tight">Course Catalog</h1>
          <p className="text-sm text-[#666] mt-1">Manage subjects, assign lecturers, and view enrollments.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 bg-[#111] text-white" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={16} /> New Course
        </button>
      </div>

      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg z-50 shadow-lg border text-sm font-medium animate-in slide-in-from-bottom-4 ${toast.type === 'success' ? 'bg-white border-green-200 text-green-700' : 'bg-white border-red-200 text-red-700'}`}>
          {toast.message}
        </div>
      )}

      <div className="ksas-card mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" size={18} />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10"
          />
        </div>
      </div>

      <div className="ksas-card overflow-hidden !p-0 border-[#e5e5e5] shadow-sm">
        <div className="ksas-table-container">
          <table className="ksas-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Details</th>
                <th>Lecturer</th>
                <th>Students</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan={5} className="text-center py-12 text-[#666]">Loading catalog...</td></tr>
              ) : filteredCourses.length === 0 ? (
                 <tr><td colSpan={5} className="text-center py-12 text-[#666]">No courses match your search.</td></tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course.id} className="group">
                    <td>
                      <span className="font-mono text-xs font-semibold bg-[#f3f3f3] text-[#111] px-2 py-1 rounded">
                        {course.course_code}
                      </span>
                    </td>
                    <td className="font-medium text-[#111]">{course.course_name}</td>
                    <td className="text-[#666]">{course.lecturer_name || <span className="italic text-[#999]">Awaiting Assignment</span>}</td>
                    <td>
                      <span className="badge bg-[#f3f3f3] text-[#111] flex w-max items-center gap-1.5 border border-[#e5e5e5]">
                        <Users size={12} /> {course.student_count || 0}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEnrollModalCourse(course)} className="px-3 py-1.5 text-xs text-[#666] font-medium bg-white border border-[#e5e5e5] hover:border-[#111] hover:text-[#111] rounded transition-colors flex items-center gap-1">
                          Manage Roster
                        </button>
                        <button onClick={() => editCourse(course)} className="w-8 h-8 flex items-center justify-center bg-white text-[#666] hover:text-[#111] hover:bg-[#f3f3f3] rounded border border-transparent hover:border-[#e5e5e5] transition-all" title="Edit">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => deleteCourse(course.id, course.course_name)} className="w-8 h-8 flex items-center justify-center bg-white text-[#666] hover:text-[#dc2626] hover:bg-[#fef2f2] rounded border border-transparent hover:border-[#fee2e2] transition-all" title="Delete">
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

      {showModal && (
        <div className="fixed inset-0 bg-[#111]/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="ksas-card max-w-md w-full animate-in zoom-in-95 my-auto shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-display text-[#111] tracking-tight">{editingCourse ? 'Edit Catalog Entry' : 'Create New Course'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-[#999] hover:text-[#111] hover:bg-[#f3f3f3] rounded-md transition-colors"><X size={18} /></button>
            </div>
            
            <form onSubmit={saveCourse} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#111]">Course Code</label>
                <input type="text" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} required className="w-full font-mono uppercase" placeholder="e.g. COMP 101" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#111]">Course Name</label>
                <input type="text" value={courseName} onChange={(e) => setCourseName(e.target.value)} required className="w-full" placeholder="e.g. Intro to Computer Science" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#111]">Assign Lecturer</label>
                <select value={selectedLecturer} onChange={(e) => setSelectedLecturer(e.target.value)} className="w-full appearance-none">
                  <option value="">-- Leave Unassigned --</option>
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>Prof. {l.full_name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-3 mt-8 border-t border-[#e5e5e5] pt-5">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary bg-[#111] text-white py-2 px-4 shadow-sm">{editingCourse ? 'Save Changes' : 'Create Course'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {enrollModalCourse && (
        <EnrollStudentsModal course={enrollModalCourse} onClose={() => { setEnrollModalCourse(null); fetchCourses() }} />
      )}
    </div>
  )
}

function EnrollStudentsModal({ course, onClose }: { course: Course, onClose: () => void }) {
  const [students, setStudents] = useState<any[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all students
      const { data: allStudents } = await supabase.from('students').select('*')
      
      // Fetch enrollments for this course
      let eSet = new Set<string>()
      try {
        const { data: enrollments } = await supabase.from('enrollments').select('student_id').eq('course_id', course.id)
         if (enrollments) {
           eSet = new Set(enrollments.map(e => e.student_id))
         }
      } catch (e) {}

      setStudents(allStudents || [])
      setEnrolledIds(eSet)
      setLoading(false)
    }
    fetchData()
  }, [course.id])

  const toggleEnrollment = (studentId: string) => {
    const next = new Set(enrolledIds)
    if (next.has(studentId)) next.delete(studentId)
    else next.add(studentId)
    setEnrolledIds(next)
  }

  const saveEnrollments = async () => {
    setSaving(true)
    try {
      await supabase.from('enrollments').delete().eq('course_id', course.id)
      
      const insertData = Array.from(enrolledIds).map(student_id => ({ course_id: course.id, student_id }))
      if (insertData.length > 0) {
        await supabase.from('enrollments').insert(insertData)
      }
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const filtered = students.filter(s => s.full_name?.toLowerCase().includes(search.toLowerCase()) || s.student_number?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fixed inset-0 bg-[#111]/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="ksas-card max-w-2xl w-full flex flex-col max-h-[85vh] animate-in zoom-in-95 shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
             <h2 className="text-xl font-bold font-display text-[#111] tracking-tight">Course Roster</h2>
             <div className="mt-1 flex items-center gap-2">
               <span className="font-mono text-xs bg-[#f3f3f3] text-[#111] px-1.5 py-0.5 rounded font-semibold">{course.course_code}</span>
               <span className="text-sm text-[#666] font-medium">{course.course_name}</span>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#999] hover:text-[#111] hover:bg-[#f3f3f3] rounded-md transition-colors"><X size={18} /></button>
        </div>

        <input 
           type="text" 
           placeholder="Search students to enroll..." 
           value={search} 
           onChange={e => setSearch(e.target.value)} 
           className="w-full mb-6 py-2 px-3 focus:ring-1 focus:ring-[#111] border-[#e5e5e5]" 
        />

        <div className="overflow-y-auto flex-1 mb-6 border border-[#e5e5e5] rounded-xl bg-white shadow-sm">
          <table className="ksas-table !border-0 text-sm">
            <thead className="sticky top-0 z-10 shadow-sm border-b border-[#e5e5e5]">
              <tr>
                <th className="w-12 text-center bg-[#fafafa]">Enrolled</th>
                <th className="bg-[#fafafa]">Student Name</th>
                <th className="bg-[#fafafa]">Registration No.</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center py-12 text-[#666]">Loading directory...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-12 text-[#666]">No students found.</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} onClick={() => toggleEnrollment(s.id)} className="cursor-pointer hover:bg-[#f8f8f8] transition-colors border-b border-[#f3f3f3]">
                  <td className="text-center">
                    <input type="checkbox" checked={enrolledIds.has(s.id)} onChange={() => toggleEnrollment(s.id)} 
                      className="w-4 h-4 rounded text-[#111] focus:ring-[#111] bg-white border-[#e5e5e5] cursor-pointer" />
                  </td>
                  <td className="font-medium text-[#111]">{s.full_name}</td>
                  <td className="text-[#666] font-mono text-xs">{s.student_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-auto border-t border-[#e5e5e5] pt-5">
          <span className="text-sm text-[#111] font-semibold bg-[#f3f3f3] px-3 py-1.5 rounded-full">{enrolledIds.size} student(s) selected</span>
          <div className="flex gap-3">
             <button onClick={onClose} className="btn-secondary">Cancel</button>
             <button onClick={saveEnrollments} disabled={saving} className="btn-primary bg-[#111] text-white">
               {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
               {saving ? 'Saving...' : 'Save Roster'}
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}

