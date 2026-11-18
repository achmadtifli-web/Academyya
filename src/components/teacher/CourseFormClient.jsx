'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InputField, SelectField, TextareaField } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastContext';

export function CourseFormClient({ categories = [], initialCourse = null }) {
  const router = useRouter();
  const { showToast } = useToast();
  const isEditing = Boolean(initialCourse);

  const [title, setTitle] = useState(initialCourse?.title || '');
  const [categoryId, setCategoryId] = useState(
    initialCourse?.category_id ? String(initialCourse.category_id) : String(categories[0]?.id || '')
  );
  const [level, setLevel] = useState(initialCourse?.level || 'pemula');
  const [thumbnailUrl, setThumbnailUrl] = useState(initialCourse?.thumbnail_url || '');
  const [description, setDescription] = useState(initialCourse?.description || '');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});

    try {
      const url = isEditing
        ? `/api/teacher/courses/${initialCourse.id}`
        : '/api/teacher/courses';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category_id: Number(categoryId),
          level,
          thumbnail_url: thumbnailUrl,
          description,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        throw new Error(json.error || 'Gagal menyimpan course.');
      }

      showToast({ type: 'success', message: json.message });
      if (isEditing) {
        router.push('/teacher/courses');
      } else {
        router.push(`/teacher/courses/${json.data.course.id}/materials`);
      }
      router.refresh();
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal menyimpan course.' });
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl border border-line p-6 sm:p-8 space-y-5 max-w-3xl"
    >
      <InputField
        id="course-title"
        label="Judul Course"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={fieldErrors.title}
        placeholder="Contoh: Dasar Pemrograman Web Modern"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <SelectField
          id="course-category"
          label="Kategori"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          error={fieldErrors.category_id}
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </SelectField>

        <SelectField
          id="course-level"
          label="Tingkat Kesulitan"
          required
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          error={fieldErrors.level}
        >
          <option value="pemula">Pemula</option>
          <option value="menengah">Menengah</option>
          <option value="lanjut">Lanjut</option>
        </SelectField>
      </div>

      <InputField
        id="course-thumbnail"
        label="URL Gambar Sampul (Opsional)"
        type="url"
        value={thumbnailUrl}
        onChange={(e) => setThumbnailUrl(e.target.value)}
        error={fieldErrors.thumbnail_url}
        hint="Kosongkan untuk memakai sampul ikon kategori otomatis."
        placeholder="https://example.com/thumbnail.jpg"
      />

      <TextareaField
        id="course-description"
        label="Deskripsi Course"
        required
        rows={5}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={fieldErrors.description}
        placeholder="Jelaskan apa yang akan dipelajari siswa dan manfaat yang didapat..."
      />

      <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
        <Button href="/teacher/courses" variant="outline">
          Batal
        </Button>
        <Button type="submit" variant="primary" loading={saving}>
          <Save className="w-4 h-4" aria-hidden="true" />
          <span>
            {saving
              ? 'Menyimpan...'
              : isEditing
              ? 'Simpan Perubahan'
              : 'Buat Draft & Tambah Materi'}
          </span>
        </Button>
      </div>
    </form>
  );
}
