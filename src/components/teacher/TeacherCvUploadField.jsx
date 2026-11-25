'use client';

import { useRef, useState } from 'react';
import { AlertCircle, FileText, Upload, X } from 'lucide-react';

const MAX_CV_BYTES = 5 * 1024 * 1024;
const PDF_EXT_REGEX = /\.pdf$/i;

function formatFileSize(bytes) {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Reusable required PDF CV uploader shared across teacher registration, profile application, and re-apply forms.
 */
export function TeacherCvUploadField({
  id = 'teacher-cv',
  file,
  onChange,
  error,
  onErrorChange,
}) {
  const inputRef = useRef(null);
  const [localError, setLocalError] = useState('');
  const activeError = error || localError;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const isPdf =
      selected.type === 'application/pdf' ||
      (!selected.type && PDF_EXT_REGEX.test(selected.name)) ||
      PDF_EXT_REGEX.test(selected.name);

    if (!isPdf) {
      const message = 'File CV harus berupa dokumen PDF (.pdf).';
      setLocalError(message);
      onErrorChange?.(message);
      e.target.value = '';
      return;
    }

    if (selected.size > MAX_CV_BYTES) {
      const message = 'Ukuran file CV maksimal 5 MB.';
      setLocalError(message);
      onErrorChange?.(message);
      e.target.value = '';
      return;
    }

    setLocalError('');
    onErrorChange?.('');
    onChange(selected);
  };

  const handleClear = () => {
    setLocalError('');
    onErrorChange?.('');
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        Upload CV (PDF) <span className="text-danger-ink ml-1">*</span>
      </label>

      <div
        className={`rounded-2xl border bg-page p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          activeError ? 'border-danger' : 'border-line-strong'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary-light text-primary-dark flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            {file ? (
              <>
                <p className="text-sm font-semibold text-ink truncate">{file.name}</p>
                <p className="text-xs text-muted">{formatFileSize(file.size)} · Siap dikirim</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-ink">Belum ada file CV dipilih</p>
                <p className="text-xs text-muted">Format PDF (.pdf), maksimal 5 MB. Wajib diisi.</p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            ref={inputRef}
            id={id}
            name="cv"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            aria-invalid={activeError ? 'true' : undefined}
            aria-describedby={activeError ? `${id}-error` : `${id}-hint`}
            className="sr-only peer"
          />
          <label
            htmlFor={id}
            className="min-h-11 px-4 rounded-full bg-white text-primary-dark border-2 border-primary-hover hover:bg-primary-light/60 font-semibold text-sm inline-flex items-center gap-2 transition cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-hover"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span>{file ? 'Ganti CV' : 'Pilih File PDF'}</span>
          </label>

          {file && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Hapus file CV terpilih"
              className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-full border border-line bg-white text-muted hover:text-danger-ink hover:border-danger transition"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {!activeError && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          Unggah CV terbaru Anda dalam format PDF agar Admin dapat memverifikasi latar belakang mengajar Anda.
        </p>
      )}
      {activeError && (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger-ink font-medium flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{activeError}</span>
        </p>
      )}
    </div>
  );
}
