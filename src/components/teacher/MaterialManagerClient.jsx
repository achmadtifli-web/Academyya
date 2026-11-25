'use client';

import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Clock,
  Eye,
  Globe,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Video,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { InputField, SelectField, TextareaField } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';

export function MaterialManagerClient({ initialCourse, initialMaterials = [] }) {
  const { showToast } = useToast();
  const [course, setCourse] = useState(initialCourse);
  const [materials, setMaterials] = useState(initialMaterials);

  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [position, setPosition] = useState('1');
  const [duration, setDuration] = useState('15');
  const [videoUrl, setVideoUrl] = useState('');
  const [content, setContent] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [reordering, setReordering] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const isFinalized = Boolean(course.finalized_at);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setPosition('1');
    setDuration('15');
    setVideoUrl('');
    setContent('');
    setFieldErrors({});
  };

  const startEdit = (mat) => {
    setEditingId(mat.id);
    setTitle(mat.title);
    setPosition(String(mat.position ?? 1));
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

      const payload = {
        title,
        duration_minutes: duration === '' ? 0 : Number(duration),
        video_url: videoUrl,
        content,
      };
      if (editingId) {
        payload.position = Number(position);
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        throw new Error(json.error || 'Gagal menyimpan materi.');
      }

      if (editingId) {
        if (Array.isArray(json.data.materials)) {
          setMaterials(json.data.materials);
        } else {
          setMaterials((prev) =>
            prev.map((m) => (m.id === editingId ? json.data.material : m))
          );
        }
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

  const handleFinalizeCourse = async () => {
    setFinalizing(true);
    try {
      const res = await fetch(`/api/teacher/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalize' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memfinalisasi course.');
      }
      setCourse((prev) => ({
        ...prev,
        finalized_at: json.data.course.finalized_at,
      }));
      setEditingId(null);
      setFinalizeOpen(false);
      showToast({ type: 'success', message: json.message });
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal memfinalisasi course.' });
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="rounded-3xl bg-white border border-line p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={course.status} />
            {isFinalized && <StatusBadge status="finalized" />}
            <span className="text-sm text-muted">{materials.length} materi</span>
          </div>
          <h2 className="font-heading text-xl font-bold text-ink">{course.title}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button href={`/learn/${course.slug}`} variant="outline" size="sm">
            <Eye className="w-4 h-4" aria-hidden="true" />
            <span>Pratinjau Kelas</span>
          </Button>
          {!isFinalized && (
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
          )}
          {course.status === 'published' && !isFinalized && materials.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setFinalizeOpen(true)}
            >
              <Lock className="w-4 h-4" aria-hidden="true" />
              <span>Finalisasi Course</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Add / Edit Material Form or Finalized Lock Notice */}
        {isFinalized ? (
          <div className="lg:col-span-5 rounded-3xl bg-white border border-purple/30 p-6 space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-light text-purple flex items-center justify-center">
              <Lock className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-ink">
              Materi Terkunci (Course Final)
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Course ini sudah difinalisasi sehingga materi tidak dapat ditambah, diubah, dihapus, atau diurutkan ulang. Sertifikat digital otomatis terbit bagi siswa yang menyelesaikan 100% materi.
            </p>
          </div>
        ) : (
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

          {editingId && materials.length > 0 && (
            <SelectField
              id="material-position"
              label="Urutan Materi"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              error={fieldErrors.position}
            >
              {materials.map((mat, idx) => (
                <option key={mat.id} value={String(idx + 1)}>
                  Urutan #{idx + 1}
                </option>
              ))}
            </SelectField>
          )}

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
        )}

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

                {!isFinalized && (
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
                )}
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

      <ConfirmModal
        open={finalizeOpen}
        onClose={() => setFinalizeOpen(false)}
        onConfirm={handleFinalizeCourse}
        title="Finalisasi Course Ini?"
        message={`Setelah difinalisasi, seluruh materi pada "${course.title}" akan dikunci permanen (tidak bisa ditambah, diubah, atau dihapus), dan sertifikat akan langsung terbit bagi semua siswa yang sudah selesai 100%.`}
        confirmLabel="Ya, Finalisasi Course"
        confirmVariant="primary"
        loading={finalizing}
      />
    </div>
  );
}
