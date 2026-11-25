'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, Copy, ExternalLink, Mail, X } from 'lucide-react';
import { getTeacherGmailHref, getTeacherMailtoHref } from '@/lib/validators';

export function ContactTeacherButton({
  teacherName,
  teacherEmail,
  courseTitle = '',
  variant = 'primary-outline',
  className = '',
}) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const timerRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState('idle'); // 'idle' | 'copied' | 'failed'

  const cleanEmail = String(teacherEmail || '').trim();
  const mailtoHref = getTeacherMailtoHref(cleanEmail, courseTitle);
  const gmailHref = getTeacherGmailHref(cleanEmail, courseTitle);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!cleanEmail || !mailtoHref || !gmailHref) {
    return null;
  }

  const handleCopyEmail = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      await navigator.clipboard.writeText(cleanEmail);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
    timerRef.current = setTimeout(() => {
      setCopyStatus('idle');
    }, 2500);
  };

  const triggerVariantClass =
    variant === 'subtle'
      ? 'bg-white text-ink border border-line-strong hover:bg-page hover:border-primary-hover'
      : 'bg-white text-primary-dark border-2 border-primary-hover hover:bg-primary-light/60';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold min-h-11 px-4 text-sm transition ${triggerVariantClass} ${className}`}
      >
        <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Hubungi Teacher</span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => {
          setOpen(false);
          setCopyStatus('idle');
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-line bg-white p-6 text-ink shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-heading text-xl font-bold text-ink">
              Hubungi Teacher
            </h2>
            <p className="text-sm text-muted mt-0.5 truncate">{teacherName}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup dialog"
            className="min-h-11 min-w-11 -mr-2 -mt-2 flex items-center justify-center rounded-full text-muted hover:bg-page hover:text-ink transition shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-page p-4 space-y-2">
            {courseTitle && (
              <p className="text-xs text-muted line-clamp-2">
                Course: <strong className="text-ink">{courseTitle}</strong>
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-ink break-all">{cleanEmail}</span>
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  aria-label={`Salin alamat email ${cleanEmail}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full min-h-11 px-3.5 text-xs font-semibold border border-line-strong bg-white text-ink hover:bg-page hover:border-primary-hover transition"
                >
                  {copyStatus === 'copied' ? (
                    <Check className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>Salin Email</span>
                </button>
                <span
                  role="status"
                  className={`text-xs font-semibold transition-opacity ${
                    copyStatus === 'copied'
                      ? 'text-success opacity-100'
                      : copyStatus === 'failed'
                      ? 'text-danger-ink opacity-100'
                      : 'opacity-0 pointer-events-none'
                  }`}
                >
                  {copyStatus === 'copied'
                    ? 'Tersalin'
                    : copyStatus === 'failed'
                    ? 'Gagal menyalin'
                    : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <a
              href={gmailHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full font-semibold min-h-11 px-5 text-sm bg-primary-hover text-white hover:bg-primary-dark transition w-full"
            >
              <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Tulis Pesan via Gmail</span>
              <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
            </a>

            <a
              href={mailtoHref}
              className="inline-flex items-center justify-center gap-2 rounded-full font-semibold min-h-11 px-5 text-sm bg-white text-ink border border-line-strong hover:bg-page hover:border-primary-hover transition w-full"
            >
              <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Buka Aplikasi Email (mailto)</span>
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}
