import { toEmbedVideoUrl } from '@/lib/validators';

export function MaterialViewer({ material, totalMaterials }) {
  const embedUrl = toEmbedVideoUrl(material.video_url);
  const paragraphs = String(material.content || '')
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {embedUrl && (
        <div className="aspect-video w-full rounded-3xl overflow-hidden bg-ink border border-line shadow-xs">
          <iframe
            src={embedUrl}
            title={`Video materi ${material.title}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <article className="bg-white rounded-3xl border border-line p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-primary-light text-primary-dark px-3.5 py-1 text-sm font-semibold">
            Materi {material.position} dari {totalMaterials}
          </span>
          {material.duration_minutes > 0 && (
            <span className="text-sm font-medium text-muted">
              Estimasi {material.duration_minutes} menit
            </span>
          )}
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-ink leading-tight">
          {material.title}
        </h1>

        <div className="pt-2 space-y-4 text-base sm:text-[1.0625rem] leading-relaxed text-ink max-w-prose">
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, idx) => (
              <p key={idx} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-muted">
              Tonton video pembelajaran di atas dan ajukan pertanyaan di forum diskusi apabila ada hal yang ingin didalami.
            </p>
          )}
        </div>
      </article>
    </div>
  );
}
