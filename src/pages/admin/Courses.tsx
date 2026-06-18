import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Edit2, Trash2, X, Users, BookOpen, Loader2 } from 'lucide-react'

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
      const mapped = data?.map((c: any) => ({ ...c, lecturer_name: c.lecturers?.full_name, student_count: 0 })) || [] // Mock count if enrollments table unsupported initially
      
      // Attempt to get counts if 'enrollments' table exists
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
        // quiet fail if no enrollments table
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Courses</h1>
          <p className="text-sm text-[#8ba0c4]">Manage subjects and assign lecturers.</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={16} /> New Course
        </button>
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg z-50 shadow-lg border ${toast.type === 'success' ? 'bg-[#0f1f3d] border-[#22c55e] text-[#22c55e]' : 'bg-[#0f1f3d] border-[#ef4444] text-[#ef4444]'}`}>
          {toast.message}
        </div>
      )}

      <div className="ksas-card overflow-hidden !p-0">
        <div className="ksas-table-container">
          <table className="ksas-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Lecturer</th>
                <th>Students</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan={5} className="text-center py-8 text-[#8ba0c4]">Loading courses...</td></tr>
              ) : courses.length === 0 ? (
                 <tr><td colSpan={5} className="text-center py-8 text-[#8ba0c4]">No courses found.</td></tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id}>
                    <td className="font-mono text-[#c9a227] font-medium">{course.course_code}</td>
                    <td className="font-medium text-white">{course.course_name}</td>
                    <td className="text-[#8ba0c4]">{course.lecturer_name || <span className="italic text-[#4d6285]">Unassigned</span>}</td>
                    <td>
                      <span className="badge bg-[#162444] text-white flex w-max items-center gap-1.5">
                        <Users size={12} /> {course.student_count || 0}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEnrollModalCourse(course)} className="px-2 py-1 text-xs text-[#8ba0c4] border border-[#1e3358] hover:border-[#8ba0c4] hover:text-white rounded transition-colors flex items-center gap-1">
                          Manage Students
                        </button>
                        <button onClick={() => editCourse(course)} className="p-1.5 text-[#8ba0c4] hover:text-[#c9a227] hover:bg-[#162444] rounded transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteCourse(course.id, course.course_name)} className="p-1.5 text-[#8ba0c4] hover:text-[#ef4444] hover:bg-[#162444] rounded transition-colors" title="Delete">
                          <Trash2 size={16} />
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
        <div className="fixed inset-0 bg-[#0a1628]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="ksas-card max-w-md w-full animate-in zoom-in-95 my-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-display text-white border-b-2 border-transparent">{editingCourse ? 'Edit Course' : 'Create Course'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#8ba0c4] hover:text-white"><X size={20} /></button>
            </div>
            
            <form onSubmit={saveCourse} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#f0f4ff]">Course Code</label>
                <input type="text" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} required className="w-full" placeholder="e.g. COMP 101" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#f0f4ff]">Course Name</label>
                <input type="text" value={courseName} onChange={(e) => setCourseName(e.target.value)} required className="w-full" placeholder="e.g. Intro to Computer Science" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#f0f4ff]">Lecturer</label>
                <select value={selectedLecturer} onChange={(e) => setSelectedLecturer(e.target.value)} className="w-full">
                  <option value="">Unassigned</option>
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>{l.full_name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingCourse ? 'Save Changes' : 'Create Course'}</button>
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
      // A full sync strategy: delete all for this course, insert current selection
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
    <div className="fixed inset-0 bg-[#0a1628]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="ksas-card max-w-2xl w-full flex flex-col max-h-[80vh] animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <div>
             <h2 className="text-xl font-bold font-display text-white">Enroll Students</h2>
             <p className="text-sm text-[#8ba0c4]">{course.course_code} - {course.course_name}</p>
          </div>
          <button onClick={onClose} className="text-[#8ba0c4] hover:text-white"><X size={20} /></button>
        </div>

        <input 
           type="text" 
           placeholder="Search students..." 
           value={search} 
           onChange={e => setSearch(e.target.value)} 
           className="w-full mb-4" 
        />

        <div className="overflow-y-auto flex-1 mb-6 border border-[#1e3358] rounded-xl bg-[#0a1628]">
          <table className="ksas-table !border-0 text-sm">
            <thead className="sticky top-0 z-10 shadow-sm border-b border-[#1e3358]">
              <tr>
                <th className="w-12 text-center">Enroll</th>
                <th>Student</th>
                <th>Number</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center py-4 text-[#8ba0c4]">Loading...</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} onClick={() => toggleEnrollment(s.id)} className="cursor-pointer">
                  <td className="text-center">
                    <input type="checkbox" checked={enrolledIds.has(s.id)} onChange={() => toggleEnrollment(s.id)} 
                      className="w-4 h-4 rounded text-[#c9a227] focus:ring-[#c9a227] bg-[#0f1f3d] border-[#1e3358]" />
                  </td>
                  <td className="font-medium text-white">{s.full_name}</td>
                  <td className="text-[#8ba0c4]">{s.student_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-auto">
          <span className="text-sm text-[#c9a227] font-medium">{enrolledIds.size} student(s) selected</span>
          <div className="flex gap-3">
             <button onClick={onClose} className="btn-secondary">Cancel</button>
             <button onClick={saveEnrollments} disabled={saving} className="btn-primary">
               {saving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save Enrollments'}
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}

