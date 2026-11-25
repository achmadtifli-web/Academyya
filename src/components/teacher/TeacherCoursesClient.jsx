'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Eye, Layers, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';
import { formatCourseDateRange, getCourseDeleteGuard } from '@/lib/validators';

export function TeacherCoursesClient({ initialCourses = [] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [courses, setCourses] = useState(initialCourses);
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [finalizeTarget, setFinalizeTarget] = useState(null);

  const handleTogglePublish = async (course) => {
    const nextStatus = course.status === 'published' ? 'draft' : 'published';
    setBusyId(course.id);
    try {
      const res = await fetch(`/api/teacher/courses/${course.id}`, {
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
      const res = await fetch(`/api/teacher/courses/${deleteTarget.id}`, {
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
      const res = await fetch(`/api/teacher/courses/${finalizeTarget.id}`, {
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-base text-muted">
          Anda memiliki <strong className="text-ink">{courses.length}</strong> course.
        </p>
        <Button href="/teacher/courses/new" variant="primary">
          <Plus className="w-5 h-5" aria-hidden="true" />
          <span>Buat Course Baru</span>
        </Button>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Belum ada course yang dibuat"
          description="Mulai bagikan keahlian Anda dengan membuat course pertama. Tambahkan materi terstruktur lalu publikasikan ke katalog."
          actionLabel="Buat Course Pertama"
          actionHref="/teacher/courses/new"
        />
      ) : (
        <div className="space-y-4">
          {courses.map((course) => {
            const isPublished = course.status === 'published';
            const isFinalized = Boolean(course.finalized_at);
            const isBusy = busyId === course.id;
            const guard = getCourseDeleteGuard(course);
            const noteId = `teacher-course-delete-note-${course.id}`;

            return (
              <article
                key={course.id}
                className="rounded-3xl border border-line bg-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={course.status} />
                    {isFinalized && <StatusBadge status="finalized" />}
                    <StatusBadge status={course.level} />
                    <span className="text-sm font-medium text-muted">{course.category_name}</span>
                  </div>
                  <h2 className="font-heading text-xl font-semibold text-ink">
                    <Link
                      href={`/teacher/courses/${course.id}/materials`}
                      className="min-h-11 inline-flex items-center hover:text-primary-hover"
                    >
                      {course.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted">
                    {course.total_materials} Materi · {course.total_duration} menit ·{' '}
                    {course.total_students} Siswa terdaftar
                    {course.active_students > 0 ? ` (${course.active_students} aktif)` : ''}
                    {' · '}
                    {formatCourseDateRange(course.start_date, course.end_date)}
                  </p>
                  {guard.blocked && (
                    <p id={noteId} className="text-sm text-muted">
                      Tidak dapat dihapus: {guard.shortReason}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-3 shrink-0">
                  {isPublished && !isFinalized && course.total_materials > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => setFinalizeTarget(course)}
                    >
                      <Lock className="w-4 h-4" aria-hidden="true" />
                      <span>Finalisasi</span>
                    </Button>
                  )}

                  {/* Publish / Draft Switch Toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isPublished}
                    aria-label={
                      isFinalized
                        ? `${course.title} sudah final`
                        : isPublished
                        ? `Ubah status ${course.title} ke Draft`
                        : `Publikasikan ${course.title}`
                    }
                    title={
                      isFinalized
                        ? 'Course sudah final dan tidak dapat dikembalikan ke draft'
                        : undefined
                    }
                    disabled={isBusy || isFinalized}
                    onClick={() => handleTogglePublish(course)}
                    className="min-h-11 px-3 py-1.5 rounded-full border border-line bg-page inline-flex items-center gap-2.5 text-sm font-semibold text-ink hover:border-primary/50 disabled:opacity-50 transition"
                  >
                    <span
                      aria-hidden="true"
                      className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-colors ${
                        isPublished ? 'bg-success' : 'bg-slate-500'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                          isPublished ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </span>
                    <span>{isPublished ? 'Published' : 'Draft'}</span>
                  </button>

                  {/* 2x2 Icon-Only Action Grid */}
                  <div className="grid grid-cols-2 gap-2 shrink-0">
                    <Link
                      href={`/teacher/courses/${course.id}/materials`}
                      aria-label={`Kelola materi ${course.title}`}
                      title="Kelola Materi"
                      className="w-11 h-11 rounded-2xl bg-primary-hover text-white hover:bg-primary-dark active:scale-[0.98] inline-flex items-center justify-center shadow-xs transition"
                    >
                      <Layers className="w-5 h-5" aria-hidden="true" />
                    </Link>
                    <Link
                      href={`/teacher/courses/${course.id}/edit`}
                      aria-label={`Edit info ${course.title}`}
                      title="Edit Info"
                      className="w-11 h-11 rounded-2xl bg-white text-primary-dark border-2 border-primary-hover hover:bg-primary-light/60 inline-flex items-center justify-center transition"
                    >
                      <Pencil className="w-5 h-5" aria-hidden="true" />
                    </Link>
                    <Link
                      href={`/learn/${course.slug}`}
                      aria-label={`Pratinjau ${course.title}`}
                      title="Pratinjau"
                      className="w-11 h-11 rounded-2xl bg-white text-ink border border-slate-500/60 hover:bg-page hover:border-primary-hover inline-flex items-center justify-center transition"
                    >
                      <Eye className="w-5 h-5" aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      aria-label={`Hapus ${course.title}`}
                      aria-describedby={guard.blocked ? noteId : undefined}
                      title={guard.blocked ? guard.shortReason : 'Hapus Course'}
                      disabled={isBusy || guard.blocked}
                      onClick={() => setDeleteTarget(course)}
                      className="w-11 h-11 rounded-2xl bg-white text-danger-ink border-2 border-danger hover:bg-danger-light disabled:opacity-50 inline-flex items-center justify-center transition"
                    >
                      <Trash2 className="w-5 h-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Course?"
        message={
          deleteTarget
            ? `Course "${deleteTarget.title}" beserta seluruh materinya akan dihapus permanen.`
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
