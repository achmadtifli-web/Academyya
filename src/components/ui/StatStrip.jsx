export function StatStrip({ items = [] }) {
  const colorClasses = [
    'text-accent-dark',
    'text-primary-hover',
    'text-coral-text',
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-8 pt-2">
      {items.map((item, index) => (
        <div key={item.label} className="min-w-0">
          <div
            className={`font-heading text-2xl sm:text-4xl font-bold tracking-tight ${
              colorClasses[index % colorClasses.length]
            }`}
          >
            {item.value}
          </div>
          <p className="mt-1 text-sm sm:text-base font-semibold text-ink leading-snug">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
