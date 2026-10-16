/**
 * The Primer mark: a small stack of building blocks (the first block is lifted
 * into place) beside the name. Original artwork. The mark is decorative; the
 * name is the accessible text.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-extrabold ${className}`}
    >
      <svg
        viewBox="0 0 40 40"
        aria-hidden="true"
        focusable="false"
        className="size-[1.15em] shrink-0"
      >
        <rect x="3" y="22" width="16" height="15" rx="4" fill="var(--brand)" />
        <rect x="21" y="22" width="16" height="15" rx="4" fill="var(--brand)" />
        <rect
          x="12"
          y="3"
          width="16"
          height="15"
          rx="4"
          fill="var(--highlight)"
          transform="rotate(-8 20 10)"
        />
      </svg>
      <span className="tracking-tight">Primer</span>
    </span>
  );
}
