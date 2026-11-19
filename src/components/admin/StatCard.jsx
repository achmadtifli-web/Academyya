export function StatCard({ label, value, helper, tone = 'blue' }) {
  const valueColor =
    tone === 'coral'
      ? 'text-coral-text'
      : tone === 'green'
      ? 'text-success'
      : tone === 'amber'
      ? 'text-accent-dark'
      : tone === 'purple'
      ? 'text-purple'
      : 'text-primary-dark';

  return (
    <div className="rounded-3xl border border-line bg-white p-5 sm:p-6">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className={`mt-2 font-heading text-3xl font-bold tracking-tight ${valueColor}`}>
        {value}
      </p>
      {helper && <p className="mt-1 text-sm text-muted">{helper}</p>}
    </div>
  );
}
