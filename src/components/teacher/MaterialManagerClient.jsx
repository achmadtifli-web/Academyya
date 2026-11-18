'use client';

import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Clock,
  Eye,
  Globe,
  Pencil,
  Plus,
  Trash2,
  Video,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { InputField, TextareaField } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';

export function MaterialManagerClient({ initialCourse, initialMaterials = [] }) {
  const { showToast } = useToast();
  const [course, setCourse] = useState(initialCourse);
  const [materials, setMaterials] = useState(initialMaterials);

  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('15');
  const [videoUrl, setVideoUrl] = useState('');
  const [content, setContent] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [reordering, setReordering] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDuration('15');
    setVideoUrl('');
    setContent('');
    setFieldErrors({});
  };

  const startEdit = (mat) => {
    setEditingId(mat.id);
    setTitle(mat.title);
    setDuration(String(mat.duration_minutes ?? 0));
    setVideoUrl(mat.video_url || '');
    setContent(mat.content || '');
    setFieldErrors({});
  };

  const handleSubmitMaterial = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});

    try {
      const url = editingId
        ? `/api/teacher/materials/${editingId}`
        : `/api/teacher/courses/${course.id}/materials`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          duration_minutes: duration === '' ? 0 : Number(duration),
          video_url: videoUrl,
          content,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        throw new Error(json.error || 'Gagal menyimpan materi.');
      }

      if (editingId) {
        setMaterials((prev) =>
          prev.map((m) => (m.id === editingId ? json.data.material : m))
        );
      } else {
        setMaterials((prev) => [...prev, json.data.material]);
      }

      showToast({ type: 'success', message: json.message });
      resetForm();
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal menyimpan materi.' });
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= materials.length) return;

    const updated = [...materials];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const orderedIds = updated.map((m) => m.id);
    setReordering(true);
    try {
      const res = await fetch(`/api/teacher/courses/${course.id}/materials`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengubah urutan materi.');
      }
      setMaterials(json.data.materials);
      showToast({ type: 'success', message: json.message });
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal mengubah urutan materi.' });
    } finally {
      setReordering(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/teacher/materials/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghapus materi.');
      }

      // Refresh ordered list so positions 1..N stay synchronized with DB compaction.
      const listRes = await fetch(`/api/teacher/courses/${course.id}/materials`);
      const listJson = await listRes.json();
      if (listJson.success) {
        setMaterials(listJson.data.materials);
      }
      if (editingId === deleteTarget.id) resetForm();
      showToast({ type: 'success', message: json.message });
      setDeleteTarget(null);
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal menghapus materi.' });
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePublish = async () => {
    const nextStatus = course.status === 'published' ? 'draft' : 'published';
    setPublishing(true);
    try {
      const res = await fetch(`/api/teacher/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengubah status publikasi.');
      }
      setCourse((prev) => ({ ...prev, status: nextStatus }));
      showToast({ type: 'success', message: json.message });
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal mengubah status publikasi.' });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="rounded-3xl bg-white border border-line p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={course.status} />
            <span className="text-sm text-muted">{materials.length} materi</span>
          </div>
          <h2 className="font-heading text-xl font-bold text-ink">{course.title}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button href={`/learn/${course.slug}`} variant="outline" size="sm">
            <Eye className="w-4 h-4" aria-hidden="true" />
            <span>Pratinjau Kelas</span>
          </Button>
          <Button
            variant={course.status === 'published' ? 'outline' : 'success'}
            size="sm"
            loading={publishing}
            onClick={handleTogglePublish}
          >
            <Globe className="w-4 h-4" aria-hidden="true" />
            <span>
              {course.status === 'published' ? 'Simpan ke Draft' : 'Publikasikan Course'}
            </span>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Add / Edit Material Form */}
        <form
          onSubmit={handleSubmitMaterial}
          className="lg:col-span-5 rounded-3xl bg-white border border-line p-6 space-y-4"
        >
          <h3 className="font-heading text-lg font-semibold text-ink">
            {editingId ? 'Edit Materi Terpilih' : 'Tambah Materi Baru'}
          </h3>

          <InputField
            id="material-title"
            label="Judul Materi"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={fieldErrors.title}
            placeholder="Contoh: Struktur Dokumen HTML Semantik"
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <InputField
              id="material-duration"
              label="Durasi (Menit)"
              type="number"
              min="0"
              max="600"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              error={fieldErrors.duration_minutes}
            />
            <InputField
              id="material-video"
              label="URL Video (Opsional)"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              error={fieldErrors.video_url}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <TextareaField
            id="material-content"
            label="Isi Materi / Penjelasan"
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            error={fieldErrors.content}
            placeholder="Tulis penjelasan lengkap langkah demi langkah untuk siswa..."
          />

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
            {editingId && (
              <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                Batal Edit
              </Button>
            )}
            <Button type="submit" variant="primary" loading={saving}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>
                {saving
                  ? 'Menyimpan...'
                  : editingId
                  ? 'Simpan Materi'
                  : 'Tambah Materi'}
              </span>
            </Button>
          </div>
        </form>

        {/* Ordered Material List */}
        <div className="lg:col-span-7 space-y-3">
          {materials.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Belum ada materi di course ini"
              description="Gunakan formulir di samping untuk menambahkan materi pertama sebelum mempublikasikan course."
            />
          ) : (
            materials.map((mat, index) => (
              <div
                key={mat.id}
                className="rounded-3xl border border-line bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <span className="min-w-10 h-10 px-2.5 rounded-full bg-primary-light text-primary-dark font-heading font-bold text-sm flex items-center justify-center shrink-0">
                    #{mat.position}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-heading font-semibold text-base text-ink">
                      {mat.title}
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        <span>{mat.duration_minutes} mnt</span>
                      </span>
                      {mat.video_url && (
                        <span className="inline-flex items-center gap-1 text-primary-dark font-medium">
                          <Video className="w-4 h-4" aria-hidden="true" />
                          <span>Video Embed</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0 || reordering}
                    aria-label={`Naikkan urutan ${mat.title}`}
                    className="min-h-11 min-w-11 rounded-full border border-line bg-white hover:bg-page disabled:opacity-40 flex items-center justify-center"
                  >
                    <ArrowUp className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 1)}
                    disabled={index === materials.length - 1 || reordering}
                    aria-label={`Turunkan urutan ${mat.title}`}
                    className="min-h-11 min-w-11 rounded-full border border-line bg-white hover:bg-page disabled:opacity-40 flex items-center justify-center"
                  >
                    <ArrowDown className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <Button variant="outline" size="sm" onClick={() => startEdit(mat)}>
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="dangerOutline"
                    size="sm"
                    onClick={() => setDeleteTarget(mat)}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span>Hapus</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Materi?"
        message={
          deleteTarget
            ? `Materi "${deleteTarget.title}" akan dihapus dan urutan materi lainnya akan dirapikan otomatis.`
            : ''
        }
        confirmLabel="Ya, Hapus Materi"
        loading={deleting}
      />
    </div>
  );
}
