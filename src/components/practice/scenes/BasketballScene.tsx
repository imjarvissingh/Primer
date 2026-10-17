import { NOT_STARTED, type ConstructionProgress } from "./progress";
import { Celebrate, GoalPad, SceneFrame } from "./parts";

/** Basketball Challenge: an indoor training court with a hoop and a scoreboard (no numbers). */
export function BasketballScene({
  progress = NOT_STARTED,
}: {
  progress?: ConstructionProgress;
}) {
  return (
    <SceneFrame name="basketball">
      <defs>
        <linearGradient id="bk-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e2a5a" />
          <stop offset="1" stopColor="#3b4a8c" />
        </linearGradient>
        <linearGradient id="bk-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2a866" />
          <stop offset="1" stopColor="#b9773a" />
        </linearGradient>
        <linearGradient id="bk-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff7c2" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff7c2" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="600" height="340" fill="url(#bk-wall)" />
      {/* Bleachers as bands (not circles, so nothing reads as a ball) */}
      <g>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect
              x="0"
              y={78 + i * 20}
              width="600"
              height="16"
              fill={["#27356f", "#2f3f82", "#384a94"][i]}
            />
            {Array.from({ length: 15 }, (_, j) => (
              <rect
                key={j}
                x={14 + j * 40 + (i % 2) * 10}
                y={82 + i * 20}
                width="22"
                height="8"
                rx="3"
                fill={["#f59e0b", "#38bdf8", "#f472b6", "#a3e635"][(i + j) % 4]}
                opacity="0.55"
              />
            ))}
          </g>
        ))}
      </g>
      {/* Spotlights */}
      <g>
        <path
          d="M120 0 L80 168 H190Z M300 0 L250 168 H350Z M480 0 L440 168 H550Z"
          fill="url(#bk-beam)"
        />
        <g fill="#fde68a">
          <rect x="100" y="0" width="40" height="8" rx="3" />
          <rect x="280" y="0" width="40" height="8" rx="3" />
          <rect x="460" y="0" width="40" height="8" rx="3" />
        </g>
      </g>
      {/* Scoreboard: lit bars only, no numerals */}
      <g>
        <rect
          x="236"
          y="20"
          width="128"
          height="52"
          rx="8"
          fill="#0f172a"
          stroke="#64748b"
          strokeWidth="3"
        />
        <rect
          x="248"
          y="34"
          width="44"
          height="12"
          rx="3"
          fill="#22c55e"
          opacity="0.85"
        />
        <rect
          x="308"
          y="34"
          width="44"
          height="12"
          rx="3"
          fill="#f97316"
          opacity="0.85"
        />
        <rect x="248" y="52" width="104" height="6" rx="3" fill="#475569" />
      </g>
      {/* Hoop and backboard */}
      <g>
        <rect
          x="498"
          y="98"
          width="72"
          height="54"
          rx="4"
          fill="#fff"
          stroke="#475569"
          strokeWidth="3"
        />
        <rect
          x="518"
          y="120"
          width="32"
          height="22"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2.5"
        />
        <path
          d="M514 158 H554"
          stroke="#ea580c"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M518 160 L526 184 M550 160 L542 184 M528 160 L532 184 M540 160 L536 184"
          stroke="#fff"
          strokeWidth="1.5"
        />
        <path d="M534 152 V176" stroke="#64748b" strokeWidth="4" />
      </g>
      {/* Hardwood floor in perspective */}
      <path d="M0 176 H600 V340 H0Z" fill="url(#bk-floor)" />
      <g stroke="#a56a2f" strokeWidth="2" opacity="0.6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M0 ${190 + i * 26} H600`} />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <path
            key={i}
            d={`M${300 + (i - 5) * 24} 176 L${300 + (i - 5) * 70} 340`}
          />
        ))}
      </g>
      <g fill="none" stroke="#fff" strokeWidth="4" opacity="0.9">
        <path d="M300 176 V340" />
        <ellipse cx="300" cy="262" rx="150" ry="34" />
        <path d="M150 340 L186 176 M450 340 L414 176" strokeWidth="3" />
      </g>
      <GoalPad
        progress={progress}
        shape="circle"
        padFill="#fff7e0"
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
              fill="#ea7a1c"
              stroke="#7c2d12"
              strokeWidth="2"
            />
            <path
              d={`M${x - s / 2 + 1} ${y} H${x + s / 2 - 1} M${x} ${y - s / 2 + 1} V${y + s / 2 - 1}`}
              stroke="#3b1d0a"
              strokeWidth="1.5"
            />
            <path
              d={`M${x - 11} ${y - 11} Q${x - 4} ${y} ${x - 11} ${y + 11} M${x + 11} ${y - 11} Q${x + 4} ${y} ${x + 11} ${y + 11}`}
              fill="none"
              stroke="#3b1d0a"
              strokeWidth="1.5"
            />
            <ellipse
              cx={x - 5}
              cy={y - 7}
              rx="4.5"
              ry="2.6"
              fill="#fff"
              opacity="0.3"
            />
          </>
        )}
      />
      <Celebrate />
    </SceneFrame>
  );
}
