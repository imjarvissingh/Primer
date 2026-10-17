import { NOT_STARTED, type ConstructionProgress } from "./progress";
import { Celebrate, GoalPad, SceneFrame } from "./parts";

const STARS: [number, number, number][] = [
  [40, 30, 1.4],
  [92, 70, 1],
  [150, 24, 1.6],
  [214, 58, 1],
  [262, 18, 1.2],
  [338, 40, 1.5],
  [402, 22, 1],
  [466, 64, 1.4],
  [520, 28, 1.2],
  [570, 84, 1],
  [60, 120, 1.1],
  [120, 150, 1],
  [496, 130, 1.3],
  [556, 160, 1],
  [24, 190, 1.2],
  [574, 214, 1.1],
  [180, 96, 1],
  [430, 100, 1.1],
  [310, 84, 1],
  [370, 150, 1],
];

/** Space Explorer: a space station with a gap in its truss, planets and stars. */
export function SpaceScene({
  progress = NOT_STARTED,
}: {
  progress?: ConstructionProgress;
}) {
  return (
    <SceneFrame name="space">
      <defs>
        <linearGradient id="sp-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1040" />
          <stop offset="0.6" stopColor="#1b1b66" />
          <stop offset="1" stopColor="#3a1f6e" />
        </linearGradient>
        <radialGradient id="sp-neb1">
          <stop offset="0" stopColor="#c084fc" stopOpacity="0.5" />
          <stop offset="1" stopColor="#c084fc" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sp-neb2">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.4" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sp-planet" cx="0.35" cy="0.3">
          <stop offset="0" stopColor="#fb9fcf" />
          <stop offset="1" stopColor="#a02a7a" />
        </radialGradient>
        <radialGradient id="sp-moon" cx="0.35" cy="0.3">
          <stop offset="0" stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#94a3b8" />
        </radialGradient>
      </defs>
      <rect width="600" height="340" fill="url(#sp-bg)" />
      <ellipse cx="140" cy="250" rx="190" ry="110" fill="url(#sp-neb1)" />
      <ellipse cx="480" cy="90" rx="200" ry="100" fill="url(#sp-neb2)" />
      <g className="twinkle" fill="#fff">
        {STARS.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
        ))}
      </g>
      {/* Planet with rings, and a small moon */}
      <g transform="translate(500 250)">
        <ellipse
          rx="96"
          ry="22"
          fill="none"
          stroke="#fde68a"
          strokeWidth="9"
          opacity="0.5"
          transform="rotate(-14)"
        />
        <circle r="56" fill="url(#sp-planet)" />
        <path
          d="M-52 4 Q0 -14 52 6"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          opacity="0.2"
        />
        <path
          d="M-96 8 Q0 36 96 -10"
          fill="none"
          stroke="#fde68a"
          strokeWidth="9"
          opacity="0.75"
          transform="rotate(-6)"
        />
      </g>
      <circle cx="70" cy="76" r="26" fill="url(#sp-moon)" />
      <circle cx="62" cy="68" r="6" fill="#94a3b8" opacity="0.6" />
      <circle cx="80" cy="86" r="4" fill="#94a3b8" opacity="0.6" />
      {/* Station: hub, solar panels, truss with a gap in the middle */}
      <g>
        <g fill="#2563eb" stroke="#bfdbfe" strokeWidth="2">
          <rect x="88" y="110" width="44" height="64" rx="3" />
          <rect x="468" y="110" width="44" height="64" rx="3" />
        </g>
        <g stroke="#93c5fd" strokeWidth="1.2">
          <path d="M110 110 V174 M88 142 H132 M490 110 V174 M468 142 H512" />
        </g>
        <rect
          x="132"
          y="178"
          width="76"
          height="16"
          fill="#9aa8c7"
          stroke="#475569"
          strokeWidth="2"
        />
        <rect
          x="392"
          y="178"
          width="76"
          height="16"
          fill="#9aa8c7"
          stroke="#475569"
          strokeWidth="2"
        />
        <circle
          cx="132"
          cy="186"
          r="40"
          fill="#cbd5f5"
          stroke="#6366f1"
          strokeWidth="4"
        />
        <circle
          cx="132"
          cy="186"
          r="22"
          fill="#1e1b4b"
          stroke="#a5b4fc"
          strokeWidth="3"
        />
        <circle cx="132" cy="186" r="9" fill="#5eead4" />
        <circle
          cx="468"
          cy="186"
          r="40"
          fill="#cbd5f5"
          stroke="#6366f1"
          strokeWidth="4"
        />
        <circle
          cx="468"
          cy="186"
          r="22"
          fill="#1e1b4b"
          stroke="#a5b4fc"
          strokeWidth="3"
        />
        <circle cx="468" cy="186" r="9" fill="#fde047" />
        <path
          d="M208 182 L228 186 M392 182 L372 186"
          stroke="#fde047"
          strokeWidth="3"
          strokeDasharray="3 4"
        />
      </g>
      <GoalPad
        progress={progress}
        shape="pod"
        y={186}
        width={204}
        padFill="#a5f3fc"
        edge="#fde047"
        render={(x, y, s) => (
          <>
            <rect
              x={x - s / 2}
              y={y - 12}
              width={s}
              height="24"
              rx="10"
              fill="#a5b4fc"
              stroke="#312e81"
              strokeWidth="2"
            />
            <rect
              x={x - s / 2}
              y={y - 12}
              width={s}
              height="8"
              rx="4"
              fill="#e0e7ff"
              opacity="0.7"
            />
            <circle
              cx={x}
              cy={y + 1}
              r="5"
              fill="#1e1b4b"
              stroke="#e0e7ff"
              strokeWidth="1.5"
            />
            <circle cx={x} cy={y + 1} r="2" fill="#5eead4" />
          </>
        )}
      />
      {/* Foreground rocks (angular, nothing like the module capsules) */}
      <path
        d="M0 340 V300 L30 286 L56 308 L84 296 L110 340Z M500 340 L526 316 L556 322 L580 300 L600 312 V340Z"
        fill="#241a4d"
        stroke="#4c3a8a"
        strokeWidth="2"
      />
      <Celebrate color="#fde047" />
    </SceneFrame>
  );
}
