/**
 * Decorative, original artwork. Hidden from assistive tech: the modules and the
 * story text carry the meaning. The dashed cells on the right arm are the goal.
 */
export function SpaceScene() {
  const stars: [number, number, number][] = [
    [40, 30, 1.5],
    [110, 74, 1],
    [170, 22, 1.5],
    [250, 54, 1],
    [330, 18, 1.5],
    [420, 40, 1],
    [480, 86, 1.5],
    [560, 24, 1],
    [30, 130, 1],
    [90, 190, 1.5],
    [270, 200, 1],
    [440, 200, 1.5],
    [585, 190, 1],
  ];
  return (
    <svg
      viewBox="0 0 600 220"
      aria-hidden="true"
      focusable="false"
      className="block h-auto w-full"
    >
      <rect width="600" height="220" fill="#10194d" />
      {stars.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#f8fafc" />
      ))}
      {/* Planet with a ring, and a small moon */}
      <circle cx="520" cy="156" r="44" fill="#f472b6" />
      <path
        d="M486 138 a44 44 0 0 1 68 -8 a50 50 0 0 0 -68 8z"
        fill="#db2777"
      />
      <ellipse
        cx="520"
        cy="156"
        rx="70"
        ry="13"
        fill="none"
        stroke="#fde68a"
        strokeWidth="4"
        transform="rotate(-18 520 156)"
      />
      <circle cx="430" cy="40" r="12" fill="#cbd5e1" />
      <circle cx="426" cy="36" r="3" fill="#94a3b8" />
      {/* Orbit path */}
      <path
        d="M20 190 Q300 120 580 60"
        fill="none"
        stroke="#818cf8"
        strokeWidth="1.5"
        strokeDasharray="2 7"
        strokeLinecap="round"
      />
      {/* Station: hub, left arm with solar panels, right arm with a gap */}
      <rect x="170" y="98" width="110" height="16" rx="4" fill="#94a3b8" />
      <rect x="340" y="98" width="26" height="16" rx="4" fill="#94a3b8" />
      <circle
        cx="300"
        cy="106"
        r="32"
        fill="#cbd5e1"
        stroke="#64748b"
        strokeWidth="4"
      />
      <circle cx="300" cy="106" r="13" fill="#38bdf8" />
      <circle cx="300" cy="106" r="5" fill="#e0f2fe" />
      <g fill="#1d4ed8" stroke="#93c5fd" strokeWidth="1.5">
        <rect x="150" y="64" width="22" height="84" rx="3" />
        <rect x="366" y="64" width="22" height="84" rx="3" />
      </g>
      <path
        d="M150 92 H172 M150 120 H172 M366 92 H388 M366 120 H388"
        stroke="#93c5fd"
        strokeWidth="1.5"
      />
      {/* Goal: the missing modules, outlined */}
      <g fill="none" stroke="#fde047" strokeWidth="3" strokeDasharray="6 5">
        <rect x="398" y="92" width="34" height="28" rx="5" />
        <rect x="438" y="92" width="34" height="28" rx="5" />
      </g>
      {/* Space engineer */}
      <g transform="translate(74 74)">
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
        {/* Tether to the station */}
        <path
          d="M20 40 Q60 70 96 52"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="2"
          strokeDasharray="1 4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
