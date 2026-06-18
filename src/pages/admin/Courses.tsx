import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type Course = {
  id: string
  course_code: string
  course_name: string
  lecturer_id: string | null
  lecturer_name?: string
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

  useEffect(() => { fetchCourses(); fetchLecturers() }, [])

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*, lecturers(full_name)')
      .order('course_code')

    if (error) { showToast('Failed to load courses', 'error') }
    else { setCourses(data?.map((c: any) => ({ ...c, lecturer_name: c.lecturers?.full_name })) || []) }
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

  const deleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return
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
        <h1 className="text-2xl font-bold text-white">Course Management</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="bg-[#c9a227] hover:bg-[#d4b43a] text-[#0a1628] font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Add Course
        </button>
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {toast.message}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1f3a] rounded-xl p-6 w-full max-w-md border border-[#1e3a5f]">
            <h2 className="text-xl font-bold text-white mb-4">{editingCourse ? 'Edit Course' : 'Add Course'}</h2>
            <form onSubmit={saveCourse} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Course Code</label>
                <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} required
                  className="w-full bg-[#162a4d] border border-[#1e3a5f] text-white rounded-lg px-4 py-2" placeholder="CS101" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Course Name</label>
                <input value={courseName} onChange={(e) => setCourseName(e.target.value)} required
                  className="w-full bg-[#162a4d] border border-[#1e3a5f] text-white rounded-lg px-4 py-2" placeholder="Introduction to Programming" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Lecturer</label>
                <select value={selectedLecturer} onChange={(e) => setSelectedLecturer(e.target.value)}
                  className="w-full bg-[#162a4d] border border-[#1e3a5f] text-white rounded-lg px-4 py-2">
                  <option value="">Unassigned</option>
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>{l.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-[#c9a227] hover:bg-[#d4b43a] text-[#0a1628] font-semibold py-2 rounded-lg">
                  {editingCourse ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-[#162a4d] hover:bg-[#1e3a5f] text-white py-2 rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-[#0f1f3a] rounded-xl border border-[#1e3a5f] overflow-hidden">
        {loading ? (
          <div className="animate-pulse p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-[#162a4d] rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-[#1e3a5f]">
                  <th className="pb-3 px-4 pt-4">Code</th>
                  <th className="pb-3 px-4 pt-4">Name</th>
                  <th className="pb-3 px-4 pt-4">Lecturer</th>
                  <th className="pb-3 px-4 pt-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-b border-[#1e3a5f]/50 hover:bg-[#162a4d]/50">
                    <td className="py-3 px-4 text-[#c9a227] font-mono">{course.course_code}</td>
                    <td className="py-3 px-4 text-white">{course.course_name}</td>
                    <td className="py-3 px-4 text-gray-300">{course.lecturer_name || 'Unassigned'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => editCourse(course)} className="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
                        <button onClick={() => deleteCourse(course.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
