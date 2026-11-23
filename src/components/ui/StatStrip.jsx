const STAT_TONES = [
  {
    badgeClass: 'bg-accent text-ink',
  },
  {
    badgeClass: 'bg-primary-hover text-white',
  },
  {
    badgeClass: 'bg-coral text-ink',
  },
];

export function StatStrip({ items = [], surface = 'white' }) {
  const cardSurfaceClass =
    surface === 'page' ? 'bg-page border-line' : 'bg-white border-line shadow-xs';

  return (
    <ul
      role="list"
      className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2"
    >
      {items.map((item, index) => {
        const tone = STAT_TONES[index % STAT_TONES.length];
        return (
          <li
            key={item.label}
            className={`min-w-0 rounded-2xl border p-3.5 sm:p-4 flex items-center gap-3.5 sm:flex-col sm:items-start sm:gap-3 ${cardSurfaceClass}`}
          >
            <div
              className={`inline-flex items-center justify-center min-w-12 h-11 px-3.5 rounded-full font-heading text-2xl font-bold tracking-tight shrink-0 ${tone.badgeClass}`}
            >
              {item.value}
            </div>
            <p className="text-sm font-semibold text-ink leading-snug">
              {item.label}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
