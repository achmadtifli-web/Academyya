import { AlertCircle } from 'lucide-react';

export function InputField({
  id,
  label,
  error,
  hint,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-ink">
          {label}
          {required && <span className="text-danger-ink ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`w-full min-h-12 rounded-2xl border bg-white px-4 text-base text-ink placeholder:text-muted/70 transition ${
          error ? 'border-danger focus:border-danger' : 'border-line-strong focus:border-primary-hover'
        } ${className}`}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger-ink font-medium flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export function TextareaField({
  id,
  label,
  error,
  hint,
  required = false,
  rows = 4,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-ink">
          {label}
          {required && <span className="text-danger-ink ml-1">*</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-base text-ink placeholder:text-muted/70 transition ${
          error ? 'border-danger focus:border-danger' : 'border-line-strong focus:border-primary-hover'
        } ${className}`}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger-ink font-medium flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export function SelectField({
  id,
  label,
  error,
  required = false,
  children,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-ink">
          {label}
          {required && <span className="text-danger-ink ml-1">*</span>}
        </label>
      )}
      <select
        id={id}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full min-h-12 rounded-2xl border bg-white px-4 text-base text-ink transition ${
          error ? 'border-danger focus:border-danger' : 'border-line-strong focus:border-primary-hover'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger-ink font-medium flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
