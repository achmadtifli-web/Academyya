'use client';

import { useFontSize } from '@/components/ui/FontSizeContext';

export function FontSizeControl({ className = '' }) {
  const { currentScale, decrease, increase, canDecrease, canIncrease } = useFontSize();

  return (
    <div
      className={`inline-flex items-center rounded-full border border-line-strong bg-page p-0.5 ${className}`}
      role="group"
      aria-label={`Ukuran teks: ${currentScale.label}`}
    >
      <button
        type="button"
        onClick={decrease}
        disabled={!canDecrease}
        aria-label="Perkecil ukuran teks"
        title="Perkecil ukuran teks"
        className="min-h-11 min-w-11 px-3 rounded-full text-sm font-semibold text-ink hover:bg-white disabled:opacity-40 transition"
      >
        A−
      </button>
      <span className="sr-only">Ukuran teks saat ini {currentScale.label}</span>
      <button
        type="button"
        onClick={increase}
        disabled={!canIncrease}
        aria-label="Perbesar ukuran teks"
        title="Perbesar ukuran teks"
        className="min-h-11 min-w-11 px-3 rounded-full text-sm font-semibold text-ink hover:bg-white disabled:opacity-40 transition"
      >
        A+
      </button>
    </div>
  );
}
