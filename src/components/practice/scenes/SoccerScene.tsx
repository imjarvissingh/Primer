import { NOT_STARTED, type ConstructionProgress } from "./progress";
import { Celebrate, Glow, GoalPad, SceneFrame } from "./parts";

/** Soccer Quest: a bright training field with a goal, cones and floodlights. */
export function SoccerScene({
  progress = NOT_STARTED,
}: {
  progress?: ConstructionProgress;
}) {
  return (
    <SceneFrame name="soccer">
      <defs>
        <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5fb9ee" />
          <stop offset="1" stopColor="#dff4fb" />
        </linearGradient>
        <linearGradient id="sc-field" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6fc56a" />
          <stop offset="1" stopColor="#2f9444" />
        </linearGradient>
      </defs>
      <rect width="600" height="340" fill="url(#sc-sky)" />
      <Glow id="sc-sun" cx={80} cy={50} r={90} color="#fff3b0" />
      <circle cx="80" cy="50" r="22" fill="#fde68a" />
      <g className="drift" fill="#fff" opacity="0.95">
        <ellipse cx="300" cy="52" rx="38" ry="11" />
        <ellipse cx="322" cy="43" rx="22" ry="9" />
        <ellipse cx="470" cy="86" rx="32" ry="9" />
      </g>
      <path
        d="M0 140 Q100 108 210 134 Q330 100 440 132 Q530 110 600 134 V176 H0Z"
        fill="#9bd28a"
      />
      {/* Floodlight towers */}
      <g>
        <path d="M44 176 V70 M556 176 V70" stroke="#64748b" strokeWidth="5" />
        <rect
          x="26"
          y="52"
          width="36"
          height="22"
          rx="3"
          fill="#e2e8f0"
          stroke="#64748b"
          strokeWidth="2"
        />
        <rect
          x="538"
          y="52"
          width="36"
          height="22"
          rx="3"
          fill="#e2e8f0"
          stroke="#64748b"
          strokeWidth="2"
        />
        <g fill="#fde68a">
          <rect x="31" y="57" width="8" height="12" />
          <rect x="43" y="57" width="8" height="12" />
          <rect x="543" y="57" width="8" height="12" />
          <rect x="555" y="57" width="8" height="12" />
        </g>
      </g>
      {/* Field with mowing stripes in perspective */}
      <rect y="170" width="600" height="170" fill="url(#sc-field)" />
      <g fill="#ffffff" opacity="0.1">
        <path d="M0 184 H600 V198 H0Z" />
        <path d="M0 214 H600 V234 H0Z" />
        <path d="M0 252 H600 V278 H0Z" />
        <path d="M0 300 H600 V340 H0Z" />
      </g>
      <g fill="none" stroke="#fff" strokeWidth="3" opacity="0.85">
        <path d="M0 176 H600" />
        <path d="M170 176 L120 258 H480 L430 176" />
        <path d="M230 176 L206 214 H394 L370 176" />
      </g>
      {/* Goal with net */}
      <g>
        <path
          d="M222 176 V118 H378 V176"
          fill="rgb(255 255 255 / 0.12)"
          stroke="#fff"
          strokeWidth="6"
        />
        <g stroke="#e5e7eb" strokeWidth="1.1" opacity="0.85">
          {Array.from({ length: 7 }, (_, i) => (
            <path key={`v${i}`} d={`M${236 + i * 22} 120 V176`} />
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <path key={`h${i}`} d={`M224 ${132 + i * 13} H376`} />
          ))}
        </g>
      </g>
      {/* Training cones: triangles, not round, so they read as scenery */}
      <g stroke="#9a3412" strokeWidth="2" strokeLinejoin="round">
        {[
          [90, 232],
          [150, 300],
          [510, 238],
          [452, 306],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <ellipse
              cx={x}
              cy={y + 2}
              rx="14"
              ry="3"
              fill="#000"
              opacity="0.2"
              stroke="none"
            />
            <path
              d={`M${x - 11} ${y} L${x} ${y - 26} L${x + 11} ${y}Z`}
              fill="#fb923c"
            />
            <path
              d={`M${x - 6} ${y - 11} H${x + 6}`}
              stroke="#fff"
              strokeWidth="3"
            />
          </g>
        ))}
      </g>
      {/* Corner flag */}
      <path d="M572 232 V190" stroke="#fff" strokeWidth="3" />
      <path
        className="flag"
        d="M572 190 H590 L584 196 L590 202 H572Z"
        fill="#f43f5e"
      />
      <GoalPad
        progress={progress}
        shape="circle"
        padFill="#ecfff1"
        edge="#14532d"
        render={(x, y, s) => (
          <>
            <ellipse
              cx={x}
              cy={y + s / 2 - 2}
              rx={s / 2.2}
              ry="3"
              fill="#000"
              opacity="0.25"
            />
            <circle
              cx={x}
              cy={y}
              r={s / 2 - 1}
              fill="#fff"
              stroke="#1f2937"
              strokeWidth="2"
            />
            <path
              d={`M${x} ${y - 8} L${x + 8} ${y - 2} L${x + 5} ${y + 7} H${x - 5} L${x - 8} ${y - 2}Z`}
              fill="#1f2937"
            />
            <path
              d={`M${x} ${y - 8} V${y - 16} M${x + 8} ${y - 2} L${x + 16} ${y - 5} M${x + 5} ${y + 7} L${x + 10} ${y + 14} M${x - 5} ${y + 7} L${x - 10} ${y + 14} M${x - 8} ${y - 2} L${x - 16} ${y - 5}`}
              stroke="#1f2937"
              strokeWidth="1.4"
            />
          </>
        )}
      />
      <g fill="#2a7f36" opacity="0.9">
        {[18, 60, 540, 582].map((x) => (
          <path
            key={x}
            d={`M${x} 340 l3 -16 l4 16 l4 -20 l4 20 l4 -14 l3 14Z`}
          />
        ))}
      </g>
      <Celebrate />
    </SceneFrame>
  );
}
