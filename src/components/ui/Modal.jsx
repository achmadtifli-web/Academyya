'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`w-full ${maxWidth} rounded-3xl bg-white border border-line p-6 sm:p-7 shadow-xl`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 id="modal-title" className="font-heading text-xl font-bold text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="min-h-11 min-w-11 -mr-2 -mt-2 flex items-center justify-center rounded-full text-muted hover:bg-page hover:text-ink transition"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  confirmVariant = 'danger',
  loading = false,
  children,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-base text-muted leading-relaxed">{message}</p>
      {children && <div className="mt-4">{children}</div>}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
          {loading ? 'Memproses...' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
