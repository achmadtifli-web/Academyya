'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ExternalLink, EyeOff, Globe, Search, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';

export function AdminCoursesClient({ initialCourses = [] }) {
  const { showToast } = useToast();
  const [courses, setCourses] = useState(initialCourses);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const visibleCourses = courses.filter((course) => {
    const matchStatus = statusFilter === 'all' || course.status === statusFilter;
    const term = q.trim().toLowerCase();
    const matchSearch =
      !term ||
      course.title.toLowerCase().includes(term) ||
      course.teacher_name.toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  const handleToggleStatus = async (course) => {
    const nextStatus = course.status === 'published' ? 'draft' : 'published';
    setBusyId(course.id);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memperbarui status course.');
      }

      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, status: nextStatus } : c))
      );
      showToast({ type: 'success', message: json.message });
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal memperbarui status course.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      const res = await fetch(`/api/admin/courses/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghapus course.');
      }
      setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      showToast({ type: 'success', message: json.message });
      setDeleteTarget(null);
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal menghapus course.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="admin-course-search" className="sr-only">
            Cari judul course atau nama pengajar
          </label>
          <Search
            className="w-5 h-5 text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="admin-course-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari judul course atau pengajar..."
            className="w-full min-h-11 pl-12 pr-4 rounded-full border border-line-strong bg-white text-base text-ink"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'Semua' },
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Draft' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`min-h-11 px-4 rounded-full text-sm font-semibold border transition ${
                statusFilter === tab.value
                  ? 'bg-primary-hover text-white border-primary-hover'
                  : 'bg-white text-ink border-line hover:border-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {visibleCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Tidak ada course yang cocok"
          description="Belum ada course dengan filter pencarian tersebut."
        />
      ) : (
        <>
          <div className="hidden md:block rounded-3xl bg-white border border-line overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-page border-b border-line text-sm font-semibold text-muted">
                <tr>
                  <th className="py-4 px-5">Course</th>
                  <th className="py-4 px-5">Pengajar</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Siswa</th>
                  <th className="py-4 px-5 text-right">Moderasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-page/50">
                    <td className="py-4 px-5">
                      <Link
                        href={`/courses/${course.slug}`}
                        className="min-h-11 font-semibold text-ink hover:text-primary-hover inline-flex items-center gap-1.5"
                      >
                        <span>{course.title}</span>
                        <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
                      </Link>
                      <p className="text-sm text-muted mt-0.5">
                        {course.category_name} · {course.total_materials} materi
                      </p>
                    </td>
                    <td className="py-4 px-5 text-sm text-ink">{course.teacher_name}</td>
                    <td className="py-4 px-5">
                      <StatusBadge status={course.status} />
                    </td>
                    <td className="py-4 px-5 text-sm font-semibold text-ink">
                      {course.total_students}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busyId === course.id}
                          onClick={() => handleToggleStatus(course)}
                        >
                          {course.status === 'published' ? (
                            <>
                              <EyeOff className="w-4 h-4" aria-hidden="true" />
                              <span>Turunkan</span>
                            </>
                          ) : (
                            <>
                              <Globe className="w-4 h-4" aria-hidden="true" />
                              <span>Publikasikan</span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="dangerOutline"
                          size="sm"
                          disabled={busyId === course.id}
                          onClick={() => setDeleteTarget(course)}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                          <span>Hapus</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {visibleCourses.map((course) => (
              <div key={course.id} className="rounded-3xl bg-white border border-line p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/courses/${course.slug}`} className="min-h-11 inline-flex items-center font-semibold text-ink">
                    {course.title}
                  </Link>
                  <StatusBadge status={course.status} />
                </div>
                <p className="text-sm text-muted">
                  {course.teacher_name} · {course.total_materials} materi · {course.total_students} siswa
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === course.id}
                    onClick={() => handleToggleStatus(course)}
                  >
                    {course.status === 'published' ? 'Turunkan' : 'Publikasikan'}
                  </Button>
                  <Button
                    variant="dangerOutline"
                    size="sm"
                    disabled={busyId === course.id}
                    onClick={() => setDeleteTarget(course)}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Course Secara Permanen?"
        message={
          deleteTarget
            ? `Course "${deleteTarget.title}" beserta seluruh materi, progres siswa, dan diskusinya akan dihapus permanen.`
            : ''
        }
        confirmLabel="Ya, Hapus Course"
        loading={busyId === deleteTarget?.id}
      />
    </div>
  );
}
