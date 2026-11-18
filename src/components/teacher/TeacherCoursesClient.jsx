'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Eye, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';

export function TeacherCoursesClient({ initialCourses = [] }) {
  const { showToast } = useToast();
  const [courses, setCourses] = useState(initialCourses);
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal menghapus course.' });
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
          {courses.map((course) => (
            <article
              key={course.id}
              className="rounded-3xl border border-line bg-white p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
            >
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={course.status} />
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
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Button
                  href={`/teacher/courses/${course.id}/materials`}
                  variant="primary"
                  size="sm"
                >
                  <Layers className="w-4 h-4" aria-hidden="true" />
                  <span>Kelola Materi</span>
                </Button>
                <Button
                  href={`/teacher/courses/${course.id}/edit`}
                  variant="outline"
                  size="sm"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                  <span>Edit Info</span>
                </Button>
                <Button href={`/learn/${course.slug}`} variant="ghost" size="sm">
                  <Eye className="w-4 h-4" aria-hidden="true" />
                  <span>Pratinjau</span>
                </Button>
                <Button
                  variant={course.status === 'published' ? 'outline' : 'success'}
                  size="sm"
                  disabled={busyId === course.id}
                  onClick={() => handleTogglePublish(course)}
                >
                  {course.status === 'published' ? 'Ubah ke Draft' : 'Publikasikan'}
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
            </article>
          ))}
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
    </div>
  );
}
