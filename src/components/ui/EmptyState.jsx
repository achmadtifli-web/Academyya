import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function EmptyState({
  icon: Icon = BookOpen,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}) {
  return (
    <div className="rounded-3xl border border-line bg-white p-8 sm:p-12 text-center max-w-xl mx-auto">
      <div className="w-14 h-14 mx-auto rounded-full bg-primary-light text-primary-dark flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>
      <h3 className="font-heading text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-base text-muted leading-relaxed">{description}</p>
      {(actionHref || onAction) && actionLabel && (
        <div className="mt-6 flex justify-center">
          {actionHref ? (
            <Button href={actionHref} variant="primary">
              {actionLabel}
            </Button>
          ) : (
            <Button type="button" onClick={onAction} variant="outline">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
