import Link from 'next/link';
import { CheckCircle2, Clock, Lock, PlayCircle } from 'lucide-react';

export function SyllabusList({ materials = [], courseSlug, canAccessLessons = false }) {
  if (materials.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6 text-center text-base text-muted">
        Materi pembelajaran untuk course ini sedang disiapkan oleh pengajar.
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {materials.map((material) => {
        const inner = (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4 sm:px-5 hover:border-primary/50 transition">
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="w-9 h-9 rounded-full bg-primary-light text-primary-dark font-heading font-bold text-sm flex items-center justify-center shrink-0">
                {material.position}
              </span>
              <div className="min-w-0">
                <p className="font-heading font-semibold text-base text-ink truncate">
                  {material.title}
                </p>
                <p className="text-sm text-muted flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{material.duration_minutes} menit</span>
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {!canAccessLessons ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-page border border-line px-3 py-1 text-xs sm:text-sm font-medium text-muted">
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Terkunci</span>
                </span>
              ) : material.is_completed ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-light px-3 py-1 text-xs sm:text-sm font-semibold text-success">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>Selesai</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-xs sm:text-sm font-semibold text-primary-dark">
                  <PlayCircle className="w-4 h-4" aria-hidden="true" />
                  <span>Buka</span>
                </span>
              )}
            </div>
          </div>
        );

        return (
          <li key={material.id}>
            {canAccessLessons ? (
              <Link href={`/learn/${courseSlug}/${material.id}`} className="block">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ol>
  );
}
