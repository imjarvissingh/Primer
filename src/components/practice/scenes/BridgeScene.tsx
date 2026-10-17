import { NOT_STARTED, type ConstructionProgress } from "./progress";
import { Celebrate, Glow, GoalPad, SceneFrame } from "./parts";

/** Block Builder: a river canyon with a broken bridge and a small building site. */
export function BridgeScene({
  progress = NOT_STARTED,
}: {
  progress?: ConstructionProgress;
}) {
  return (
    <SceneFrame name="bridge">
      <defs>
        <linearGradient id="br-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cc8f0" />
          <stop offset="1" stopColor="#e6f6fb" />
        </linearGradient>
        <linearGradient id="br-river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#52b2e6" />
          <stop offset="1" stopColor="#1f6fb2" />
        </linearGradient>
        <linearGradient id="br-cliff" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a8714a" />
          <stop offset="1" stopColor="#8a5a38" />
        </linearGradient>
      </defs>
      <rect width="600" height="340" fill="url(#br-sky)" />
      <Glow id="br-sun" cx={90} cy={56} r={100} color="#fff3b0" />
      <circle cx="90" cy="56" r="22" fill="#fde68a" />
      <g className="drift" fill="#fff" opacity="0.95">
        <ellipse cx="300" cy="50" rx="40" ry="11" />
        <ellipse cx="324" cy="41" rx="24" ry="10" />
        <ellipse cx="500" cy="84" rx="34" ry="10" />
      </g>
      <path
        d="M0 150 Q90 96 190 138 Q300 90 410 136 Q510 96 600 140 V210 H0Z"
        fill="#a9d68e"
      />
      <path
        d="M0 176 Q130 138 260 168 Q400 132 600 170 V230 H0Z"
        fill="#8cc472"
      />
      {/* Far waterfall */}
      <path d="M262 168 V232" stroke="#d9f1fb" strokeWidth="9" opacity="0.8" />
      {/* River and ripples */}
      <rect y="214" width="600" height="126" fill="url(#br-river)" />
      <g
        className="ripple"
        fill="none"
        stroke="#e0f4fb"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.8"
      >
        <path d="M-30 246 q25 -9 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" />
        <path d="M-30 282 q25 -9 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" />
        <path d="M-30 318 q25 -9 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" />
      </g>
      {/* Cliffs with the gap between them */}
      <path d="M0 176 H196 L214 214 V340 H0Z" fill="url(#br-cliff)" />
      <path d="M0 176 H196 V190 H0Z" fill="#5fae4a" />
      <path d="M404 176 H600 V340 H386 V214Z" fill="url(#br-cliff)" />
      <path d="M404 176 H600 V190 H404Z" fill="#5fae4a" />
      <g stroke="#6b4423" strokeWidth="2" opacity="0.45" fill="none">
        <path d="M30 212 l30 12 M90 240 l34 8 M20 276 l40 -6 M520 220 l-34 10 M560 262 l-40 8" />
      </g>
      {/* Building site: crane, scaffolding, cones (none look like the blocks) */}
      <g>
        <path
          d="M54 176 V70 M54 70 H170 M54 90 L112 70"
          stroke="#f59e0b"
          strokeWidth="5"
          fill="none"
          strokeLinejoin="round"
        />
        <path d="M150 70 V104" stroke="#334155" strokeWidth="2" />
        <path d="M144 104 H156 L152 116 H148Z" fill="#334155" />
        <rect
          x="36"
          y="150"
          width="40"
          height="26"
          fill="#fbbf24"
          stroke="#92400e"
          strokeWidth="2"
        />
        <rect x="42" y="156" width="10" height="10" fill="#7dd3fc" />
        <path
          d="M150 190 l7 -22 l7 22Z M168 190 l7 -22 l7 22Z"
          fill="#fb923c"
          stroke="#9a3412"
          strokeWidth="1.5"
        />
      </g>
      <g>
        <path
          d="M548 176 V120 M584 176 V120 M548 120 H584 M548 148 H584"
          stroke="#a16207"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="flag"
          d="M566 120 V92 H592 L584 100 L592 108 H566Z"
          fill="#ef4444"
        />
      </g>
      {/* Broken planks at the edges of the gap */}
      <rect
        x="180"
        y="178"
        width="30"
        height="13"
        rx="2"
        fill="#c4863f"
        stroke="#6b4423"
        strokeWidth="2"
      />
      <rect
        x="390"
        y="178"
        width="30"
        height="13"
        rx="2"
        fill="#c4863f"
        stroke="#6b4423"
        strokeWidth="2"
      />
      <path d="M196 140 V178 M404 140 V178" stroke="#6b4423" strokeWidth="6" />
      <path
        d="M196 148 Q300 120 404 148"
        stroke="#6b4423"
        strokeWidth="3"
        fill="none"
        strokeDasharray="2 6"
        opacity="0.55"
      />
      {/* The gap, with the goal pad hovering as the bridge deck to build */}
      <GoalPad
        progress={progress}
        shape="plank"
        padFill="#fff7d6"
        y={186}
        width={236}
        render={(x, y, s) => (
          <>
            <rect
              x={x - s / 2}
              y={y - 9}
              width={s}
              height="18"
              rx="3"
              fill="#c4863f"
              stroke="#6b4423"
              strokeWidth="2"
            />
            <path
              d={`M${x - s / 2 + 4} ${y - 3} H${x + s / 2 - 4} M${x - s / 2 + 4} ${y + 3} H${x + s / 2 - 8}`}
              stroke="#a86f2f"
              strokeWidth="1.4"
            />
            <circle cx={x - s / 2 + 5} cy={y} r="1.5" fill="#6b4423" />
            <circle cx={x + s / 2 - 5} cy={y} r="1.5" fill="#6b4423" />
          </>
        )}
      />
      {/* Foreground rocks */}
      <path
        d="M0 340 L0 318 Q20 304 44 318 L60 340Z M540 340 L560 316 Q584 302 600 320 V340Z"
        fill="#6b4a30"
      />
      <Celebrate />
    </SceneFrame>
  );
}
