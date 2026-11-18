'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export function TeacherStudentsClient({ initialStudents = [], courses = [] }) {
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const filtered = selectedCourseId
    ? initialStudents.filter((row) => String(row.course_id) === selectedCourseId)
    : initialStudents;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-base text-muted">
          Menampilkan <strong className="text-ink">{filtered.length}</strong> pendaftaran siswa.
        </p>

        <div className="sm:w-72">
          <label htmlFor="teacher-student-course-filter" className="sr-only">
            Filter berdasarkan course
          </label>
          <select
            id="teacher-student-course-filter"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full min-h-11 rounded-full border border-line-strong bg-white px-4 text-base text-ink"
          >
            <option value="">Semua Course Saya</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada siswa terdaftar"
          description="Siswa yang mendaftar ke course Anda akan muncul di sini beserta progres penyelesaian materinya."
        />
      ) : (
        <>
          <div className="hidden md:block rounded-3xl bg-white border border-line overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-page border-b border-line text-sm font-semibold text-muted">
                <tr>
                  <th className="py-4 px-5">Siswa</th>
                  <th className="py-4 px-5">Course</th>
                  <th className="py-4 px-5">Progres</th>
                  <th className="py-4 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((row) => (
                  <tr key={row.enrollment_id} className="hover:bg-page/50">
                    <td className="py-4 px-5">
                      <p className="font-semibold text-ink">{row.student_name}</p>
                      <p className="text-sm text-muted">{row.student_email}</p>
                    </td>
                    <td className="py-4 px-5 text-sm font-medium text-ink">
                      {row.course_title}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-28 h-2.5 rounded-full bg-page border border-line overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              row.progress_percent === 100 ? 'bg-success' : 'bg-primary-hover'
                            }`}
                            style={{ width: `${row.progress_percent}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-ink">
                          {row.progress_percent}% ({row.completed_materials}/{row.total_materials})
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <StatusBadge status={row.enrollment_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((row) => (
              <div
                key={row.enrollment_id}
                className="rounded-3xl bg-white border border-line p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{row.student_name}</p>
                    <p className="text-sm text-muted truncate">{row.student_email}</p>
                  </div>
                  <StatusBadge status={row.enrollment_status} />
                </div>
                <p className="text-sm font-medium text-ink">{row.course_title}</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Progres</span>
                    <span>
                      {row.progress_percent}% ({row.completed_materials}/{row.total_materials})
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-page overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        row.progress_percent === 100 ? 'bg-success' : 'bg-primary-hover'
                      }`}
                      style={{ width: `${row.progress_percent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
