import React from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, ShieldCheck, ChevronRight } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-[#111111] mb-4 tracking-tight">
            UNIVERSITY MANAGEMENT SYSTEM
          </h1>
          <p className="text-lg text-[#666666] max-w-2xl mx-auto">
            A modern platform for students, lecturers, and administrators.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Student & Lecturer Card */}
          <Link to="/login" className="ksas-card group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block bg-white">
            <div className="p-2 mb-6 w-14 h-14 bg-[#f8f8f8] rounded-xl flex items-center justify-center group-hover:bg-[#111111] transition-colors duration-300">
              <GraduationCap className="w-8 h-8 text-[#111111] group-hover:text-white transition-colors duration-300" />
            </div>
            <h2 className="text-2xl font-semibold text-[#111111] mb-2">Student & Lecturer Portal</h2>
            <p className="text-[#666666] mb-8 line-clamp-2">
              Access courses, grades, academic records, and learning resources.
            </p>
            <div className="flex items-center text-[#111111] font-medium mt-auto group-hover:translate-x-1 transition-transform duration-300">
              Access Portal <ChevronRight className="w-5 h-5 ml-1" />
            </div>
          </Link>

          {/* Administrator Card */}
          <Link to="/admin/login" className="ksas-card group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block bg-white border-[#e5e5e5]">
            <div className="p-2 mb-6 w-14 h-14 bg-[#f8f8f8] rounded-xl flex items-center justify-center group-hover:bg-[#111111] transition-colors duration-300">
              <ShieldCheck className="w-8 h-8 text-[#111111] group-hover:text-white transition-colors duration-300" />
            </div>
            <h2 className="text-2xl font-semibold text-[#111111] mb-2">Administrator Portal</h2>
            <p className="text-[#666666] mb-8 line-clamp-2">
              Manage students, lecturers, courses, results, and university operations.
            </p>
            <div className="flex items-center text-[#111111] font-medium mt-auto group-hover:translate-x-1 transition-transform duration-300">
              Access Portal <ChevronRight className="w-5 h-5 ml-1" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
