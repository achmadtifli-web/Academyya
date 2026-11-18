import Link from 'next/link';
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react';

export function MaterialSidebar({ courseSlug, materials = [], activeMaterialId, onSelect }) {
  return (
    <div className="bg-white rounded-3xl border border-line p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold text-ink">Daftar Materi</h2>
        <span className="text-sm font-medium text-muted">{materials.length} sesi</span>
      </div>

      <ol className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
        {materials.map((item) => {
          const isActive = Number(item.id) === Number(activeMaterialId);
          return (
            <li key={item.id}>
              <Link
                href={`/learn/${courseSlug}/${item.id}`}
                onClick={onSelect}
                aria-current={isActive ? 'step' : undefined}
                className={`min-h-12 rounded-2xl px-3.5 py-2.5 flex items-start gap-3 transition border ${
                  isActive
                    ? 'bg-primary-light border-primary-hover text-primary-dark font-semibold'
                    : item.is_completed
                    ? 'bg-success-light/45 border-transparent text-ink hover:border-success/30'
                    : 'bg-white border-transparent text-ink hover:bg-page'
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {item.is_completed ? (
                    <CheckCircle2 className="w-5 h-5 text-success" aria-hidden="true" />
                  ) : isActive ? (
                    <PlayCircle className="w-5 h-5 text-primary-hover" aria-hidden="true" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-snug">
                    {item.position}. {item.title}
                  </span>
                  {item.duration_minutes > 0 && (
                    <span className="block text-xs text-muted mt-0.5 font-normal">
                      {item.duration_minutes} menit
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
