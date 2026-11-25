'use client';

import { ConfirmModal } from '@/components/ui/Modal';

/**
 * Shared confirmation modal for finalizing a published course across Teacher and Admin views.
 */
export function FinalizeCourseModal({
  open,
  courseTitle = '',
  onClose,
  onConfirm,
  loading = false,
}) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Finalisasi Course Ini?"
      message={
        courseTitle
          ? `Setelah difinalisasi, seluruh materi pada "${courseTitle}" akan dikunci permanen dan sertifikat langsung diterbitkan bagi siswa yang telah selesai 100%.`
          : ''
      }
      confirmLabel="Ya, Finalisasi Course"
      confirmVariant="primary"
      loading={loading}
    />
  );
}
