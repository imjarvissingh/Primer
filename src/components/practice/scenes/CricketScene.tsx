import { NOT_STARTED, type ConstructionProgress } from "./progress";
import { Celebrate, Glow, GoalPad, SceneFrame, Shadow } from "./parts";

/** Cricket Academy: a sunny training ground with practice nets and a pavilion. */
export function CricketScene({
  progress = NOT_STARTED,
}: {
  progress?: ConstructionProgress;
}) {
  return (
    <SceneFrame name="cricket">
      <defs>
        <linearGradient id="cr-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6cc4ee" />
          <stop offset="1" stopColor="#dff4fb" />
        </linearGradient>
        <linearGradient id="cr-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cc65a" />
          <stop offset="1" stopColor="#3f9a3c" />
        </linearGradient>
        <linearGradient id="cr-pitch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2c98e" />
          <stop offset="1" stopColor="#c9a864" />
        </linearGradient>
      </defs>
      <rect width="600" height="340" fill="url(#cr-sky)" />
      <Glow id="cr-sun" cx={500} cy={52} r={90} color="#fff3b0" />
      <circle cx="500" cy="52" r="22" fill="#fde68a" />
      <g className="drift" fill="#fff" opacity="0.95">
        <ellipse cx="120" cy="58" rx="40" ry="12" />
        <ellipse cx="146" cy="48" rx="26" ry="11" />
        <ellipse cx="380" cy="86" rx="34" ry="10" />
        <ellipse cx="402" cy="78" rx="20" ry="9" />
      </g>
      {/* Far hills and tree line */}
      <path
        d="M0 150 Q80 104 180 140 Q290 98 400 138 Q500 104 600 142 V180 H0Z"
        fill="#9ad47c"
      />
      <path
        d="M0 162 Q120 130 240 156 Q380 126 520 154 Q570 146 600 152 V190 H0Z"
        fill="#7ec062"
      />
      <g>
        {[28, 70, 520, 566].map((x, i) => (
          <g key={x}>
            <rect
              x={x - 3}
              y={132 + (i % 2) * 6}
              width="6"
              height="30"
              fill="#6b4423"
            />
            <circle cx={x} cy={124 + (i % 2) * 6} r="20" fill="#3f8f3a" />
            <circle cx={x - 8} cy={132 + (i % 2) * 6} r="14" fill="#4aa043" />
          </g>
        ))}
      </g>
      {/* Pavilion */}
      <g>
        <rect
          x="30"
          y="118"
          width="120"
          height="56"
          fill="#f5ecd8"
          stroke="#c7b894"
          strokeWidth="2"
        />
        <path d="M22 120 L90 92 L158 120Z" fill="#b91c1c" />
        <rect
          x="46"
          y="136"
          width="22"
          height="22"
          fill="#7dd3fc"
          stroke="#475569"
          strokeWidth="2"
        />
        <rect
          x="104"
          y="136"
          width="22"
          height="22"
          fill="#7dd3fc"
          stroke="#475569"
          strokeWidth="2"
        />
        <rect x="76" y="140" width="28" height="34" fill="#92400e" />
        <path d="M90 92 V74" stroke="#475569" strokeWidth="2" />
        <path
          className="flag"
          d="M90 74 H110 L104 80 L110 86 H90Z"
          fill="#1d4ed8"
        />
      </g>
      {/* Boundary rope and sight screen */}
      <rect
        x="250"
        y="136"
        width="100"
        height="40"
        rx="3"
        fill="#ffffff"
        stroke="#cbd5e1"
        strokeWidth="2"
      />
      <path
        d="M0 178 H600"
        stroke="#ffffff"
        strokeWidth="3"
        strokeDasharray="10 8"
        opacity="0.8"
      />
      {/* Field with mowing stripes */}
      <rect y="178" width="600" height="162" fill="url(#cr-grass)" />
      <g fill="#ffffff" opacity="0.1">
        <rect y="196" width="600" height="14" />
        <rect y="226" width="600" height="18" />
        <rect y="266" width="600" height="22" />
        <rect y="312" width="600" height="28" />
      </g>
      {/* Pitch with creases and stumps */}
      <path d="M262 180 H338 L398 340 H202Z" fill="url(#cr-pitch)" />
      <path
        d="M272 204 H328 M246 262 H354"
        stroke="#fff"
        strokeWidth="2.5"
        opacity="0.8"
      />
      <Shadow cx={300} cy={184} rx={26} />
      <g fill="#fff7e0" stroke="#7a5a28" strokeWidth="1.5">
        <rect x="288" y="160" width="5" height="26" />
        <rect x="297.5" y="160" width="5" height="26" />
        <rect x="307" y="160" width="5" height="26" />
      </g>
      <rect x="287" y="158" width="26" height="3.5" rx="1.5" fill="#d1b27a" />
      {/* Practice net behind the goal pad */}
      <g>
        <path
          d="M168 168 V292 M432 168 V292 M168 168 H432"
          stroke="#334155"
          strokeWidth="4"
          fill="none"
        />
        <path
          d="M168 168 L148 188 M432 168 L452 188"
          stroke="#334155"
          strokeWidth="3"
        />
        <g stroke="#cbd5e1" strokeWidth="1.1" opacity="0.75">
          {Array.from({ length: 13 }, (_, i) => (
            <path key={`v${i}`} d={`M${180 + i * 20} 168 V292`} />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <path key={`h${i}`} d={`M168 ${190 + i * 20} H432`} />
          ))}
        </g>
      </g>
      <GoalPad
        progress={progress}
        shape="circle"
        padFill="#e8f7d4"
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
              fill="#c0262d"
              stroke="#7f1d1d"
              strokeWidth="2"
            />
            <path
              d={`M${x - s / 2 + 5} ${y} Q${x} ${y - 7} ${x + s / 2 - 5} ${y}`}
              fill="none"
              stroke="#fff"
              strokeWidth="1.6"
            />
            <ellipse
              cx={x - 5}
              cy={y - 6}
              rx="4.5"
              ry="2.6"
              fill="#fff"
              opacity="0.35"
            />
          </>
        )}
      />
      {/* Foreground grass */}
      <g fill="#2f7d32" opacity="0.9">
        {[18, 52, 140, 468, 540, 576].map((x) => (
          <path
            key={x}
            d={`M${x} 340 l3 -16 l4 16 l4 -20 l4 20 l4 -14 l3 14Z`}
          />
        ))}
      </g>
      <Celebrate />
      {/* Bunting strung over the nets: shown only once the server confirms a right answer. */}
      <g className="cricket-win">
        <path
          d="M110 40 Q300 92 490 40"
          fill="none"
          stroke="#475569"
          strokeWidth="2"
        />
        {Array.from({ length: 11 }, (_, i) => {
          const t = (i + 0.5) / 11;
          const x = 110 + t * 380;
          const y = 40 + 4 * 26 * t * (1 - t) * 2;
          return (
            <path
              key={i}
              className="bunting-flag"
              style={{ animationDelay: `${i * 70}ms` }}
              d={`M${x - 11} ${y} H${x + 11} L${x} ${y + 24}Z`}
              fill={["#c0262d", "#1d4ed8", "#facc15", "#16a34a"][i % 4]}
            />
          );
        })}
      </g>
    </SceneFrame>
  );
}
