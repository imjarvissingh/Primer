/** Decorative, original artwork. Hidden from assistive tech: the modules carry the meaning. */
export function SpaceScene() {
  const stars: [number, number, number][] = [
    [40, 30, 1.5],
    [110, 70, 1],
    [170, 22, 1.5],
    [250, 54, 1],
    [330, 18, 1.5],
    [420, 40, 1],
    [480, 86, 1.5],
    [560, 24, 1],
    [30, 120, 1],
    [90, 170, 1.5],
    [560, 150, 1],
    [520, 188, 1.5],
  ];
  return (
    <svg
      viewBox="0 0 600 200"
      aria-hidden="true"
      focusable="false"
      className="h-auto w-full rounded-lg border border-border"
    >
      <rect width="600" height="200" fill="#10194d" />
      {stars.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#f8fafc" />
      ))}
      {/* Planet with a ring */}
      <circle cx="505" cy="140" r="46" fill="#f472b6" />
      <path
        d="M470 120 a46 46 0 0 1 70 -8 a52 52 0 0 0 -70 8z"
        fill="#db2777"
      />
      <ellipse
        cx="505"
        cy="140"
        rx="72"
        ry="14"
        fill="none"
        stroke="#fde68a"
        strokeWidth="4"
        transform="rotate(-18 505 140)"
      />
      {/* Station: hub and two arms, with a gap in the right arm */}
      <rect x="150" y="95" width="120" height="14" rx="4" fill="#94a3b8" />
      <rect x="378" y="95" width="12" height="14" rx="4" fill="#94a3b8" />
      <circle
        cx="300"
        cy="102"
        r="30"
        fill="#cbd5e1"
        stroke="#64748b"
        strokeWidth="4"
      />
      <circle cx="300" cy="102" r="12" fill="#38bdf8" />
      <rect x="150" y="62" width="20" height="80" rx="3" fill="#1d4ed8" />
      <rect x="378" y="62" width="20" height="80" rx="3" fill="#1d4ed8" />
      {/* Dashed outline where the missing modules will go */}
      <rect
        x="336"
        y="88"
        width="36"
        height="28"
        rx="4"
        fill="none"
        stroke="#fde047"
        strokeWidth="3"
        strokeDasharray="6 5"
      />
      {/* Astronaut */}
      <g transform="translate(70 70)">
        <rect x="-16" y="22" width="32" height="38" rx="10" fill="#f8fafc" />
        <rect x="-22" y="30" width="8" height="22" rx="4" fill="#e2e8f0" />
        <rect x="14" y="30" width="8" height="22" rx="4" fill="#e2e8f0" />
        <circle
          cx="0"
          cy="10"
          r="18"
          fill="#f8fafc"
          stroke="#94a3b8"
          strokeWidth="3"
        />
        <rect x="-11" y="2" width="22" height="16" rx="8" fill="#0ea5e9" />
        <circle cx="-4" cy="8" r="2.5" fill="#e0f2fe" />
        <rect x="-8" y="52" width="7" height="16" rx="3" fill="#cbd5e1" />
        <rect x="1" y="52" width="7" height="16" rx="3" fill="#cbd5e1" />
        <rect x="-8" y="38" width="16" height="8" rx="2" fill="#f97316" />
      </g>
    </svg>
  );
}
