'use client';

import { useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

/**
 * Reusable password input with an accessible show/hide visibility toggle.
 */
export function PasswordField({
  id,
  label,
  error,
  hint,
  required = false,
  className = '',
  ...props
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-ink">
          {label}
          {required && <span className="text-danger-ink ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`w-full min-h-12 rounded-2xl border bg-white pl-4 pr-12 text-base text-ink placeholder:text-muted/70 transition ${
            error ? 'border-danger focus:border-danger' : 'border-line-strong focus:border-primary-hover'
          } ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-pressed={visible}
          aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 inline-flex items-center justify-center rounded-xl text-muted hover:text-ink hover:bg-page transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-hover"
        >
          {visible ? (
            <EyeOff className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Eye className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </div>
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
