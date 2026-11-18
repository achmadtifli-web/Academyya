export function HighlightUnderline({ children }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      <span className="relative z-10">{children}</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 220 18"
        fill="none"
        className="pointer-events-none absolute -bottom-2 left-0 w-full h-3.5 text-accent"
        preserveAspectRatio="none"
      >
        <path
          d="M3 14C58 4 152 3 217 12"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
