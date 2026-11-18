import Link from 'next/link';

const VARIANT_CLASSES = {
  primary:
    'bg-primary-hover text-white hover:bg-primary-dark active:scale-[0.99] shadow-xs',
  outline:
    'bg-white text-primary-dark border-2 border-primary-hover hover:bg-primary-light/60',
  success:
    'bg-success text-white hover:bg-green-800 active:scale-[0.99] shadow-xs',
  danger:
    'bg-danger text-white hover:bg-red-700 active:scale-[0.99] shadow-xs',
  dangerOutline:
    'bg-white text-danger-ink border-2 border-danger hover:bg-danger-light',
  accent:
    'bg-accent text-ink hover:bg-yellow-400 active:scale-[0.99] shadow-xs',
  ghost:
    'bg-transparent text-ink hover:bg-page border border-transparent hover:border-line',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  className = '',
  loading = false,
  disabled = false,
  type = 'button',
  ...props
}) {
  const sizeClass =
    size === 'lg'
      ? 'min-h-12 px-7 text-base'
      : size === 'sm'
      ? 'min-h-11 px-4 text-sm'
      : 'min-h-11 px-6 text-base';

  const baseClass = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:opacity-50 ${sizeClass} ${
    VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary
  } ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={baseClass} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={baseClass}
      {...props}
    >
      {children}
    </button>
  );
}
