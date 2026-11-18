'use client';

import { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';

export function MarkAsDoneButton({
  courseId,
  materialId,
  initialCompleted,
  onProgressChange,
}) {
  const { showToast } = useToast();
  const [completed, setCompleted] = useState(Boolean(initialCompleted));
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/progress/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          material_id: materialId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memperbarui status materi.');
      }

      setCompleted(json.data.is_completed);
      showToast({ type: 'success', message: json.message });
      if (onProgressChange) {
        onProgressChange(json.data);
      }
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal memperbarui status materi.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      aria-pressed={completed}
      className={`inline-flex items-center justify-center gap-2 min-h-12 px-7 rounded-full font-semibold text-base transition disabled:opacity-60 ${
        completed
          ? 'bg-success-light text-success border-2 border-success hover:bg-green-200/70'
          : 'bg-success text-white hover:bg-green-800 shadow-xs'
      }`}
    >
      {completed ? (
        <>
          <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          <span>{loading ? 'Menyimpan...' : 'Materi Selesai'}</span>
        </>
      ) : (
        <>
          <Circle className="w-5 h-5" aria-hidden="true" />
          <span>{loading ? 'Menyimpan...' : 'Mark as Done'}</span>
        </>
      )}
    </button>
  );
}
