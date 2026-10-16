/** Decorative, original artwork. Hidden from assistive tech: the blocks carry the meaning. */
export function BridgeScene() {
  return (
    <svg
      viewBox="0 0 600 200"
      aria-hidden="true"
      focusable="false"
      className="h-auto w-full rounded-lg border border-border"
    >
      <rect width="600" height="200" fill="#bfe3f5" />
      <circle cx="520" cy="42" r="22" fill="#fde68a" />
      <rect y="150" width="600" height="50" fill="#38a3d6" />
      <path
        d="M0 168 q25 -10 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0"
        fill="none"
        stroke="#e0f4fb"
        strokeWidth="4"
      />
      {/* Left and right banks with the gap in the middle */}
      <path d="M0 110 H210 V160 H0 Z" fill="#7c5a3a" />
      <path d="M0 110 H210 V122 H0 Z" fill="#5f9f4a" />
      <path d="M390 110 H600 V160 H390 Z" fill="#7c5a3a" />
      <path d="M390 110 H600 V122 H390 Z" fill="#5f9f4a" />
      {/* Broken planks hanging at each edge of the gap */}
      <rect x="196" y="122" width="24" height="12" fill="#c4863f" />
      <rect x="380" y="122" width="24" height="12" fill="#c4863f" />
      {/* Builder */}
      <g transform="translate(70 40)">
        <rect x="-16" y="30" width="32" height="40" rx="8" fill="#f97316" />
        <circle cx="0" cy="18" r="16" fill="#f5c9a0" />
        <path d="M-18 14 a18 14 0 0 1 36 0 Z" fill="#facc15" />
        <rect x="-20" y="12" width="40" height="5" rx="2" fill="#eab308" />
        <circle cx="-5" cy="20" r="2" fill="#1f2937" />
        <circle cx="5" cy="20" r="2" fill="#1f2937" />
        <path
          d="M-5 27 q5 4 10 0"
          fill="none"
          stroke="#1f2937"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="-10" y="68" width="8" height="16" rx="3" fill="#1e3a8a" />
        <rect x="2" y="68" width="8" height="16" rx="3" fill="#1e3a8a" />
      </g>
    </svg>
  );
}
