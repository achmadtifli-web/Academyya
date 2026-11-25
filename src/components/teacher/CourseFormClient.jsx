'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AlertCircle, Save, Trash2, Undo2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InputField, SelectField, TextareaField } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastContext';
import { getCourseThumbnail } from '@/lib/courseThumbnails';
import { useImageUploadField } from '@/lib/useImageUploadField';

const MAX_COURSE_THUMBNAIL_BYTES = 5 * 1024 * 1024;

const FIELD_INPUT_IDS = {
  title: 'course-title',
  teacher_id: 'course-teacher',
  category_id: 'course-category',
  level: 'course-level',
  start_date: 'course-start-date',
  end_date: 'course-end-date',
  thumbnail: 'course-thumbnail',
  thumbnail_url: 'course-thumbnail',
  description: 'course-description',
};

export function CourseFormClient({
  categories = [],
  initialCourse = null,
  isAdmin = false,
  teachers = [],
  teacherName = '',
  cancelHref = '/teacher/courses',
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const isEditing = Boolean(initialCourse);

  const [title, setTitle] = useState(initialCourse?.title || '');
  const [teacherId, setTeacherId] = useState(
    initialCourse?.teacher_id
      ? String(initialCourse.teacher_id)
      : String(teachers[0]?.id || '')
  );
  const [categoryId, setCategoryId] = useState(
    initialCourse?.category_id ? String(initialCourse.category_id) : String(categories[0]?.id || '')
  );
  const [level, setLevel] = useState(initialCourse?.level || 'pemula');
  const [startDate, setStartDate] = useState(initialCourse?.start_date || '');
  const [endDate, setEndDate] = useState(initialCourse?.end_date || '');
  const [savedThumbnailUrl] = useState(initialCourse?.thumbnail_url || '');
  const [description, setDescription] = useState(initialCourse?.description || '');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const {
    fileInputRef,
    selectedFile,
    localPreviewUrl,
    removeImage: removeThumbnail,
    setRemoveImage: setRemoveThumbnail,
    handleFileChange,
    handleCancelSelectedFile,
    handleRemoveImage: handleRemoveThumbnail,
  } = useImageUploadField({
    maxBytes: MAX_COURSE_THUMBNAIL_BYTES,
    sizeErrorMessage: 'Ukuran foto sampul course maksimal 5 MB.',
    onError: (msg) => setFieldErrors((prev) => ({ ...prev, thumbnail: msg })),
    onClearError: () => {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.thumbnail;
        delete next.thumbnail_url;
        return next;
      });
    },
  });

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
      const url = isAdmin
        ? isEditing
          ? `/api/admin/courses/${initialCourse.id}`
          : '/api/admin/courses'
        : isEditing
        ? `/api/teacher/courses/${initialCourse.id}`
        : '/api/teacher/courses';
      const method = isEditing ? 'PUT' : 'POST';

      const formData = new FormData();
      formData.append('title', title);
      if (isAdmin) {
        formData.append('teacher_id', String(teacherId));
      }
      formData.append('category_id', String(categoryId));
      formData.append('level', level);
      formData.append('start_date', startDate);
      formData.append('end_date', endDate);
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
      if (isAdmin) {
        router.push('/admin/courses');
      } else if (isEditing) {
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

      {isAdmin ? (
        <SelectField
          id="course-teacher"
          name="teacher_id"
          label="Nama Teacher"
          required
          value={teacherId}
          onChange={(e) => {
            setTeacherId(e.target.value);
            clearFieldError('teacher_id');
          }}
          error={fieldErrors.teacher_id}
          disabled={teachers.length === 0}
        >
          {teachers.length === 0 ? (
            <option value="">Belum ada pengajar terdaftar</option>
          ) : (
            teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} ({teacher.email})
              </option>
            ))
          )}
        </SelectField>
      ) : (
        <InputField
          id="course-teacher"
          name="teacher_name"
          label="Nama Teacher"
          value={teacherName}
          readOnly
          disabled
          hint="Terisi otomatis sesuai akun pengajar Anda."
        />
      )}

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

      <fieldset className="rounded-2xl border border-line bg-page/50 p-4 space-y-3">
        <legend className="px-2 text-sm font-semibold text-ink">
          Rentang Waktu Kelas (Opsional)
        </legend>
        <p className="text-xs text-muted">
          Kosongkan tanggal mulai dan tanggal selesai jika kelas bersifat lifetime access
          (tanpa batas waktu). Jika tanggal mulai diisi di masa depan, siswa baru dapat
          mengikuti course saat tanggal tersebut tiba.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <InputField
            id="course-start-date"
            name="start_date"
            type="date"
            label="Tanggal Mulai"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              clearFieldError('start_date');
              clearFieldError('end_date');
            }}
            error={fieldErrors.start_date}
          />
          <InputField
            id="course-end-date"
            name="end_date"
            type="date"
            label="Tanggal Selesai"
            min={startDate || undefined}
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              clearFieldError('end_date');
              clearFieldError('start_date');
            }}
            error={fieldErrors.end_date}
          />
        </div>
      </fieldset>

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
        <Button href={cancelHref} variant="outline">
          Batal
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={saving}
          disabled={isAdmin && teachers.length === 0}
        >
          <Save className="w-4 h-4" aria-hidden="true" />
          <span>
            {saving
              ? 'Menyimpan...'
              : isEditing
              ? 'Simpan Perubahan'
              : isAdmin
              ? 'Simpan Course'
              : 'Buat Draft & Tambah Materi'}
          </span>
        </Button>
      </div>
    </form>
  );
}
