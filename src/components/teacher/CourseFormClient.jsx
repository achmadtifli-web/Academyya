'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AlertCircle, Save, Trash2, Undo2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InputField, SelectField, TextareaField } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastContext';
import { getCourseThumbnail } from '@/lib/courseThumbnails';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXT_REGEX = /\.(jpe?g|png|webp)$/i;
const MAX_COURSE_THUMBNAIL_BYTES = 5 * 1024 * 1024;

const FIELD_INPUT_IDS = {
  title: 'course-title',
  category_id: 'course-category',
  level: 'course-level',
  thumbnail: 'course-thumbnail',
  thumbnail_url: 'course-thumbnail',
  description: 'course-description',
};

export function CourseFormClient({ categories = [], initialCourse = null }) {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const isEditing = Boolean(initialCourse);

  const [title, setTitle] = useState(initialCourse?.title || '');
  const [categoryId, setCategoryId] = useState(
    initialCourse?.category_id ? String(initialCourse.category_id) : String(categories[0]?.id || '')
  );
  const [level, setLevel] = useState(initialCourse?.level || 'pemula');
  const [savedThumbnailUrl] = useState(initialCourse?.thumbnail_url || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  const [description, setDescription] = useState(initialCourse?.description || '');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const selectedCategory = categories.find((cat) => String(cat.id) === String(categoryId));
  const customThumbnailSrc = localPreviewUrl
    ? localPreviewUrl
    : removeThumbnail
    ? ''
    : savedThumbnailUrl;

  const previewSrc =
    customThumbnailSrc ||
    getCourseThumbnail({
      slug: initialCourse?.slug,
      category_slug: selectedCategory?.slug,
    });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validType =
      ALLOWED_IMAGE_TYPES.includes(file.type) ||
      (!file.type && ALLOWED_IMAGE_EXT_REGEX.test(file.name));

    if (!validType) {
      setFieldErrors((prev) => ({
        ...prev,
        thumbnail: 'Format foto harus JPG, PNG, atau WebP.',
      }));
      e.target.value = '';
      return;
    }

    if (file.size > MAX_COURSE_THUMBNAIL_BYTES) {
      setFieldErrors((prev) => ({
        ...prev,
        thumbnail: 'Ukuran foto sampul course maksimal 5 MB.',
      }));
      e.target.value = '';
      return;
    }

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.thumbnail;
      delete next.thumbnail_url;
      return next;
    });
    setSelectedFile(file);
    setLocalPreviewUrl(URL.createObjectURL(file));
    setRemoveThumbnail(false);
  };

  const handleCancelSelectedFile = () => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setSelectedFile(null);
    setLocalPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveThumbnail = () => {
    handleCancelSelectedFile();
    setRemoveThumbnail(true);
    clearFieldError('thumbnail');
  };

  const focusFirstError = (errors) => {
    for (const key of Object.keys(FIELD_INPUT_IDS)) {
      if (errors[key]) {
        document.getElementById(FIELD_INPUT_IDS[key])?.focus();
        break;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});

    try {
      const url = isEditing
        ? `/api/teacher/courses/${initialCourse.id}`
        : '/api/teacher/courses';
      const method = isEditing ? 'PUT' : 'POST';

      const formData = new FormData();
      formData.append('title', title);
      formData.append('category_id', String(categoryId));
      formData.append('level', level);
      formData.append('description', description);
      formData.append('removeThumbnail', removeThumbnail ? 'true' : 'false');
      if (selectedFile) {
        formData.append('thumbnail', selectedFile);
      }

      const res = await fetch(url, {
        method,
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.fieldErrors) {
          setFieldErrors(json.fieldErrors);
          focusFirstError(json.fieldErrors);
        }
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

  const thumbnailError = fieldErrors.thumbnail || fieldErrors.thumbnail_url;

  return (
    <form
      method="POST"
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl border border-line p-6 sm:p-8 space-y-5 max-w-3xl"
    >
      <InputField
        id="course-title"
        name="title"
        label="Judul Course"
        required
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          clearFieldError('title');
        }}
        error={fieldErrors.title}
        placeholder="Contoh: Dasar Pemrograman Web Modern"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <SelectField
          id="course-category"
          name="category_id"
          label="Kategori"
          required
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            clearFieldError('category_id');
          }}
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
          name="level"
          label="Tingkat Kesulitan"
          required
          value={level}
          onChange={(e) => {
            setLevel(e.target.value);
            clearFieldError('level');
          }}
          error={fieldErrors.level}
        >
          <option value="pemula">Pemula</option>
          <option value="menengah">Menengah</option>
          <option value="lanjut">Lanjut</option>
        </SelectField>
      </div>

      {/* File Upload & 16:9 Catalog Card Preview */}
      <fieldset className="space-y-2">
        <legend className="block text-sm font-semibold text-ink">
          Foto Sampul Katalog (Opsional)
        </legend>

        <div className="rounded-2xl border border-line bg-page p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="aspect-video w-full sm:w-56 rounded-2xl overflow-hidden border border-line bg-white shrink-0">
            <Image
              src={previewSrc}
              alt={
                title.trim()
                  ? `Pratinjau sampul katalog ${title.trim()}`
                  : 'Pratinjau sampul kartu katalog course'
              }
              width={640}
              height={360}
              unoptimized
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                ref={fileInputRef}
                id="course-thumbnail"
                name="thumbnail"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                aria-invalid={thumbnailError ? 'true' : undefined}
                aria-describedby={
                  thumbnailError ? 'course-thumbnail-error' : 'course-thumbnail-hint'
                }
                className="sr-only peer"
              />
              <label
                htmlFor="course-thumbnail"
                className="min-h-11 px-4 rounded-full bg-white text-primary-dark border-2 border-primary-hover hover:bg-primary-light/60 font-semibold text-sm inline-flex items-center gap-2 transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-hover"
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                <span>{customThumbnailSrc ? 'Ganti Foto' : 'Unggah Foto'}</span>
              </label>

              {selectedFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelSelectedFile}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  <span>Batal Pilih</span>
                </Button>
              )}

              {savedThumbnailUrl && !removeThumbnail && !selectedFile && (
                <Button
                  type="button"
                  variant="dangerOutline"
                  size="sm"
                  onClick={handleRemoveThumbnail}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  <span>Hapus Foto</span>
                </Button>
              )}

              {savedThumbnailUrl && removeThumbnail && !selectedFile && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRemoveThumbnail(false)}
                >
                  <Undo2 className="w-4 h-4" aria-hidden="true" />
                  <span>Batalkan Hapus</span>
                </Button>
              )}
            </div>

            {selectedFile ? (
              <p id="course-thumbnail-hint" className="text-sm font-medium text-ink truncate">
                File dipilih: {selectedFile.name} (tersimpan saat form dikirim)
              </p>
            ) : removeThumbnail ? (
              <p id="course-thumbnail-hint" className="text-sm font-medium text-muted">
                Foto kustom akan dihapus saat menyimpan; kartu memakai sampul kategori otomatis.
              </p>
            ) : savedThumbnailUrl ? (
              <p id="course-thumbnail-hint" className="text-sm text-muted">
                Foto kustom terpasang. Unggah foto baru berformat JPG, PNG, atau WebP (maks. 5 MB).
              </p>
            ) : (
              <p id="course-thumbnail-hint" className="text-sm text-muted">
                Unggah gambar JPG, PNG, atau WebP (maks. 5 MB, rasio 16:9 disarankan). Kosongkan
                untuk memakai sampul otomatis sesuai kategori.
              </p>
            )}
          </div>
        </div>

        {thumbnailError && (
          <p
            id="course-thumbnail-error"
            role="alert"
            className="text-sm text-danger-ink font-medium flex items-center gap-1.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{thumbnailError}</span>
          </p>
        )}
      </fieldset>

      <TextareaField
        id="course-description"
        name="description"
        label="Deskripsi Course"
        required
        rows={5}
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          clearFieldError('description');
        }}
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
