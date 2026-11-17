export function StatCard({ label, value, helper, icon: Icon, tone = 'blue' }) {
  const toneClasses =
    tone === 'coral'
      ? 'bg-coral-light text-coral-ink'
      : tone === 'green'
      ? 'bg-success-light text-success'
      : tone === 'amber'
      ? 'bg-accent-light text-ink'
      : tone === 'purple'
      ? 'bg-purple-light text-purple'
      : 'bg-primary-light text-primary-dark';

  return (
    <div className="rounded-3xl border border-line bg-white p-5 sm:p-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-muted">{label}</p>
        <p className="mt-2 font-heading text-3xl font-bold text-ink tracking-tight">{value}</p>
        {helper && <p className="mt-1 text-sm text-muted">{helper}</p>}
      </div>
      {Icon && (
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${toneClasses}`}
        >
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
