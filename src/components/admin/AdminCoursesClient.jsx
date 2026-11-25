'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, ExternalLink, EyeOff, Globe, Lock, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';
import { formatCourseDateRange, getCourseDeleteGuard } from '@/lib/validators';

export function AdminCoursesClient({ initialCourses = [] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [courses, setCourses] = useState(initialCourses);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [finalizeTarget, setFinalizeTarget] = useState(null);

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
      router.refresh();
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
      router.refresh();
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal menghapus course.' });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleFinalize = async () => {
    if (!finalizeTarget) return;
    setBusyId(finalizeTarget.id);
    try {
      const res = await fetch(`/api/admin/courses/${finalizeTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalize' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memfinalisasi course.');
      }

      setCourses((prev) =>
        prev.map((c) =>
          c.id === finalizeTarget.id
            ? { ...c, finalized_at: json.data.course.finalized_at }
            : c
        )
      );
      showToast({ type: 'success', message: json.message });
      setFinalizeTarget(null);
      router.refresh();
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal memfinalisasi course.' });
      setFinalizeTarget(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
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

        <div className="flex flex-wrap items-center gap-2">
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
          <Button href="/admin/courses/new" variant="primary">
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Buat Course Baru</span>
          </Button>
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
                  <th scope="col" className="py-4 px-5">Course</th>
                  <th scope="col" className="py-4 px-5">Pengajar</th>
                  <th scope="col" className="py-4 px-5">Status</th>
                  <th scope="col" className="py-4 px-5">Siswa</th>
                  <th scope="col" className="py-4 px-5 text-right">Moderasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleCourses.map((course) => {
                  const guard = getCourseDeleteGuard(course);
                  const noteId = `admin-course-delete-note-${course.id}`;
                  return (
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
                          {course.category_name} · {course.total_materials} materi ·{' '}
                          {formatCourseDateRange(course.start_date, course.end_date)}
                        </p>
                      </td>
                      <td className="py-4 px-5 text-sm text-ink">{course.teacher_name}</td>
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={course.status} />
                          {Boolean(course.finalized_at) && <StatusBadge status="finalized" />}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-sm">
                        <p className="font-semibold text-ink">{course.total_students}</p>
                        {course.active_students > 0 && (
                          <p className="text-muted">{course.active_students} aktif</p>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center justify-end gap-2 shrink-0">
                            <Link
                              href={`/admin/courses/${course.id}/edit`}
                              aria-label={`Edit ${course.title}`}
                              title="Edit Course"
                              className="w-11 h-11 rounded-2xl bg-white text-primary-dark border-2 border-primary-hover hover:bg-primary-light/60 inline-flex items-center justify-center transition"
                            >
                              <Pencil className="w-5 h-5" aria-hidden="true" />
                            </Link>
                            {course.status === 'published' &&
                              !course.finalized_at &&
                              course.total_materials > 0 && (
                                <button
                                  type="button"
                                  aria-label={`Finalisasi ${course.title}`}
                                  title="Finalisasi Course"
                                  disabled={busyId === course.id}
                                  onClick={() => setFinalizeTarget(course)}
                                  className="w-11 h-11 rounded-2xl bg-purple-light text-purple border border-purple/30 hover:bg-purple/15 disabled:opacity-50 inline-flex items-center justify-center transition"
                                >
                                  <Lock className="w-5 h-5" aria-hidden="true" />
                                </button>
                              )}
                            <button
                              type="button"
                              aria-label={
                                course.status === 'published'
                                  ? course.finalized_at
                                    ? `${course.title} sudah final`
                                    : `Turunkan ${course.title} ke draft`
                                  : `Publikasikan ${course.title}`
                              }
                              title={
                                course.status === 'published'
                                  ? course.finalized_at
                                    ? 'Course sudah final dan tidak bisa diturunkan ke draft'
                                    : 'Turunkan ke Draft'
                                  : 'Publikasikan Course'
                              }
                              disabled={
                                busyId === course.id ||
                                (course.status === 'published' && Boolean(course.finalized_at))
                              }
                              onClick={() => handleToggleStatus(course)}
                              className={`w-11 h-11 rounded-2xl border inline-flex items-center justify-center disabled:opacity-50 transition ${
                                course.status === 'published'
                                  ? 'bg-white text-ink border-line-strong hover:bg-page hover:border-primary-hover'
                                  : 'bg-success-light/60 text-success border-success/40 hover:bg-success-light'
                              }`}
                            >
                              {course.status === 'published' ? (
                                <EyeOff className="w-5 h-5" aria-hidden="true" />
                              ) : (
                                <Globe className="w-5 h-5" aria-hidden="true" />
                              )}
                            </button>
                            <button
                              type="button"
                              aria-label={`Hapus ${course.title}`}
                              aria-describedby={guard.blocked ? noteId : undefined}
                              title={guard.blocked ? guard.shortReason : 'Hapus Course'}
                              disabled={guard.blocked || busyId === course.id}
                              onClick={() => setDeleteTarget(course)}
                              className="w-11 h-11 rounded-2xl bg-white text-danger-ink border-2 border-danger hover:bg-danger-light disabled:opacity-50 inline-flex items-center justify-center transition"
                            >
                              <Trash2 className="w-5 h-5" aria-hidden="true" />
                            </button>
                          </div>
                          {guard.blocked && (
                            <span id={noteId} className="text-xs text-muted text-right">
                              {guard.shortReason}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {visibleCourses.map((course) => {
              const guard = getCourseDeleteGuard(course);
              const noteId = `mobile-admin-course-delete-note-${course.id}`;
              return (
                <div key={course.id} className="rounded-3xl bg-white border border-line p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/courses/${course.slug}`} className="min-h-11 inline-flex items-center font-semibold text-ink">
                      {course.title}
                    </Link>
                    <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                      <StatusBadge status={course.status} />
                      {Boolean(course.finalized_at) && <StatusBadge status="finalized" />}
                    </div>
                  </div>
                  <p className="text-sm text-muted">
                    {course.teacher_name} · {course.total_materials} materi · {course.total_students} siswa
                    {course.active_students > 0 ? ` (${course.active_students} aktif)` : ''}
                    {' · '}
                    {formatCourseDateRange(course.start_date, course.end_date)}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      href={`/admin/courses/${course.id}/edit`}
                      variant="outline"
                      size="sm"
                      className="col-span-2"
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                      <span>Edit</span>
                    </Button>
                    {course.status === 'published' &&
                      !course.finalized_at &&
                      course.total_materials > 0 && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="col-span-2"
                          disabled={busyId === course.id}
                          onClick={() => setFinalizeTarget(course)}
                        >
                          <Lock className="w-4 h-4" aria-hidden="true" />
                          <span>Finalisasi Course</span>
                        </Button>
                      )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        busyId === course.id ||
                        (course.status === 'published' && Boolean(course.finalized_at))
                      }
                      onClick={() => handleToggleStatus(course)}
                    >
                      {course.status === 'published' ? 'Turunkan' : 'Publikasikan'}
                    </Button>
                    <Button
                      variant="dangerOutline"
                      size="sm"
                      disabled={guard.blocked || busyId === course.id}
                      aria-describedby={guard.blocked ? noteId : undefined}
                      onClick={() => setDeleteTarget(course)}
                    >
                      Hapus
                    </Button>
                  </div>
                  {guard.blocked && (
                    <p id={noteId} className="text-sm text-muted">
                      Tidak dapat dihapus: {guard.shortReason}
                    </p>
                  )}
                </div>
              );
            })}
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
            ? `Course "${deleteTarget.title}" beserta seluruh materi, riwayat belajar, dan diskusinya akan dihapus permanen.`
            : ''
        }
        confirmLabel="Ya, Hapus Course"
        loading={busyId === deleteTarget?.id}
      />

      <ConfirmModal
        open={Boolean(finalizeTarget)}
        onClose={() => setFinalizeTarget(null)}
        onConfirm={handleFinalize}
        title="Finalisasi Course Ini?"
        message={
          finalizeTarget
            ? `Setelah difinalisasi, seluruh materi pada "${finalizeTarget.title}" akan dikunci permanen dan sertifikat langsung diterbitkan bagi siswa yang telah selesai 100%.`
            : ''
        }
        confirmLabel="Ya, Finalisasi Course"
        confirmVariant="primary"
        loading={busyId === finalizeTarget?.id}
      />
    </div>
  );
}
