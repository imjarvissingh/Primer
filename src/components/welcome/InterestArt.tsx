import type { InterestId } from "@/interests";

/**
 * Original, decorative artwork for the welcome flow. Every scene is hidden from
 * assistive tech: the title, story and question text carry the meaning. Each
 * scene shows 13 of the interest's objects; none of the art states an answer.
 */

/** 13 positions in two rows (7 + 6), for the objects in each scene. */
function thirteen(x: number, y: number, dx: number, dy: number) {
  return Array.from({ length: 13 }, (_, i) => {
    const row = i < 7 ? 0 : 1;
    const col = row === 0 ? i : i - 7;
    return { x: x + col * dx + (row === 1 ? dx / 2 : 0), y: y + row * dy };
  });
}

function Face({
  x,
  y,
  skin = "#f2c9a0",
}: {
  x: number;
  y: number;
  skin?: string;
}) {
  return (
    <g>
      <circle cx={x} cy={y} r="22" fill={skin} />
      <circle cx={x - 8} cy={y - 2} r="2.6" fill="#1f2937" />
      <circle cx={x + 8} cy={y - 2} r="2.6" fill="#1f2937" />
      <path
        d={`M${x - 9} ${y + 8} Q${x} ${y + 16} ${x + 9} ${y + 8}`}
        fill="none"
        stroke="#1f2937"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </g>
  );
}

function CricketScene() {
  const balls = thirteen(52, 196, 17, 15);
  return (
    <>
      <rect width="600" height="300" fill="#bfe6f5" />
      <circle cx="520" cy="46" r="28" fill="#fde68a" />
      <ellipse cx="150" cy="52" rx="44" ry="12" fill="#fff" />
      <ellipse cx="180" cy="42" rx="26" ry="11" fill="#fff" />
      <rect y="120" width="600" height="180" fill="#5fae4d" />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={i * 150}
          y="120"
          width="75"
          height="180"
          fill="#6bb957"
        />
      ))}
      <path d="M250 300 L290 150 H370 L410 300Z" fill="#e2c490" />
      <g fill="#fff7e0" stroke="#8a6a3a" strokeWidth="2">
        <rect x="318" y="118" width="6" height="40" />
        <rect x="330" y="118" width="6" height="40" />
        <rect x="342" y="118" width="6" height="40" />
      </g>
      <g stroke="#e8f1f5" strokeWidth="2" fill="rgb(255 255 255 / 0.18)">
        <path d="M440 90 H590 V210 H440Z" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M${440 + i * 30} 90 V210`} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M440 ${90 + i * 30} H590`} />
        ))}
      </g>
      <path
        d="M36 182 H232 L214 270 H54Z"
        fill="#c68a4a"
        stroke="#7a4f22"
        strokeWidth="3"
      />
      <path d="M44 214 H224 M50 242 H218" stroke="#7a4f22" strokeWidth="2" />
      {balls.map((b, i) => (
        <g key={i}>
          <circle
            cx={b.x}
            cy={b.y}
            r="8"
            fill="#c0262d"
            stroke="#7f1d1d"
            strokeWidth="1.5"
          />
          <path
            d={`M${b.x - 6} ${b.y} Q${b.x} ${b.y - 4} ${b.x + 6} ${b.y}`}
            fill="none"
            stroke="#fff"
            strokeWidth="1.2"
          />
        </g>
      ))}
      <path
        d="M36 182 H232"
        stroke="#7a4f22"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <g transform="translate(262 150)">
        <rect
          x="-18"
          y="22"
          width="36"
          height="52"
          rx="12"
          fill="#f8fafc"
          stroke="#94a3b8"
          strokeWidth="2"
        />
        <rect
          x="-26"
          y="40"
          width="22"
          height="30"
          rx="3"
          fill="#c68a4a"
          stroke="#7a4f22"
          strokeWidth="2"
        />
        <Face x={0} y={0} />
        <path d="M-24 -6 Q0 -34 24 -6 Z" fill="#1d4ed8" />
        <rect x="-26" y="-8" width="52" height="6" rx="3" fill="#1e40af" />
      </g>
    </>
  );
}

function BuildingScene() {
  const blocks = thirteen(54, 210, 20, 20);
  return (
    <>
      <rect width="600" height="300" fill="#cfeaf7" />
      <circle cx="520" cy="46" r="26" fill="#fde68a" />
      <ellipse cx="170" cy="50" rx="40" ry="11" fill="#fff" />
      <ellipse cx="340" cy="78" rx="30" ry="9" fill="#fff" />
      <path
        d="M0 150 Q100 90 210 140 Q310 96 420 144 Q520 92 600 140 V200 H0Z"
        fill="#a7d68f"
      />
      <rect y="232" width="600" height="68" fill="#3b9ed6" />
      <path
        d="M0 256 q25 -9 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0"
        fill="none"
        stroke="#e0f4fb"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M0 160 H250 V240 H0Z" fill="#8a5f3a" />
      <path d="M0 160 H250 V176 H0Z" fill="#5fa84a" />
      <path d="M390 160 H600 V240 H390Z" fill="#8a5f3a" />
      <path d="M390 160 H600 V176 H390Z" fill="#5fa84a" />
      <rect
        x="226"
        y="148"
        width="30"
        height="12"
        rx="2"
        fill="#b7791f"
        stroke="#78350f"
        strokeWidth="2"
      />
      <rect
        x="384"
        y="148"
        width="30"
        height="12"
        rx="2"
        fill="#b7791f"
        stroke="#78350f"
        strokeWidth="2"
      />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={260 + i * 32}
          y="148"
          width="26"
          height="12"
          rx="2"
          fill="none"
          stroke="#78350f"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      ))}
      <rect
        x="40"
        y="184"
        width="170"
        height="64"
        rx="6"
        fill="#d9a066"
        stroke="#78350f"
        strokeWidth="3"
      />
      {blocks.map((b, i) => (
        <rect
          key={i}
          x={b.x - 8}
          y={b.y - 14}
          width="16"
          height="16"
          rx="2"
          fill="#fcd34d"
          stroke="#78350f"
          strokeWidth="1.5"
        />
      ))}
      <path
        d="M40 184 H210"
        stroke="#78350f"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <g transform="translate(310 100)">
        <rect x="-18" y="22" width="36" height="36" rx="10" fill="#0b5d73" />
        <Face x={0} y={0} />
        <path
          d="M-24 -6 Q0 -36 24 -6 Z"
          fill="#facc15"
          stroke="#a16207"
          strokeWidth="2"
        />
        <rect
          x="-27"
          y="-8"
          width="54"
          height="7"
          rx="3"
          fill="#eab308"
          stroke="#a16207"
          strokeWidth="2"
        />
      </g>
    </>
  );
}

const STARS: readonly (readonly [number, number])[] = [
  [40, 40],
  [110, 90],
  [200, 30],
  [280, 70],
  [360, 24],
  [450, 96],
  [560, 40],
  [520, 150],
  [70, 150],
  [330, 170],
];

function SpaceScene() {
  const mods = thirteen(46, 204, 21, 22);
  return (
    <>
      <rect width="600" height="300" fill="#0b1437" />
      {STARS.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i % 3 === 0 ? 2.4 : 1.6}
          fill="#e0e7ff"
        />
      ))}
      <circle cx="500" cy="84" r="46" fill="#fb923c" />
      <path
        d="M462 70 Q500 90 540 66 M458 98 Q500 118 544 92"
        stroke="#c2410c"
        strokeWidth="5"
        fill="none"
      />
      <circle cx="90" cy="70" r="26" fill="#5eead4" />
      <ellipse
        cx="90"
        cy="70"
        rx="44"
        ry="9"
        fill="none"
        stroke="#ccfbf1"
        strokeWidth="4"
      />
      <g>
        <rect
          x="250"
          y="104"
          width="130"
          height="38"
          rx="18"
          fill="#c7d2fe"
          stroke="#e0e7ff"
          strokeWidth="3"
        />
        <circle
          cx="315"
          cy="123"
          r="16"
          fill="#1e1b4b"
          stroke="#e0e7ff"
          strokeWidth="3"
        />
        <rect
          x="180"
          y="110"
          width="56"
          height="26"
          fill="#3b82f6"
          stroke="#e0e7ff"
          strokeWidth="2"
        />
        <rect
          x="394"
          y="110"
          width="56"
          height="26"
          fill="#3b82f6"
          stroke="#e0e7ff"
          strokeWidth="2"
        />
        <path
          d="M236 123 H250 M380 123 H394"
          stroke="#e0e7ff"
          strokeWidth="3"
        />
        <rect
          x="260"
          y="146"
          width="22"
          height="14"
          fill="none"
          stroke="#fde047"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
      </g>
      <rect
        x="30"
        y="170"
        width="190"
        height="92"
        rx="12"
        fill="#16215c"
        stroke="#818cf8"
        strokeWidth="3"
      />
      {mods.map((m, i) => (
        <rect
          key={i}
          x={m.x - 9}
          y={m.y - 8}
          width="18"
          height="14"
          rx="5"
          fill="#a5b4fc"
          stroke="#e0e7ff"
          strokeWidth="1.5"
        />
      ))}
      <g transform="translate(340 220)">
        <circle
          cx="0"
          cy="0"
          r="30"
          fill="#e2e8f0"
          stroke="#94a3b8"
          strokeWidth="3"
        />
        <rect x="-20" y="-10" width="40" height="18" rx="9" fill="#0f172a" />
        <circle cx="-8" cy="-1" r="3.5" fill="#5eead4" />
        <circle cx="8" cy="-1" r="3.5" fill="#5eead4" />
        <path d="M0 -30 V-42" stroke="#94a3b8" strokeWidth="3" />
        <circle cx="0" cy="-45" r="4" fill="#fde047" />
      </g>
    </>
  );
}

function BasketballScene() {
  const balls = thirteen(60, 202, 20, 26);
  return (
    <>
      <rect width="600" height="300" fill="#fbd9b0" />
      <rect y="170" width="600" height="130" fill="#d99a52" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <path
          key={i}
          d={`M${i * 80} 170 V300`}
          stroke="#c78535"
          strokeWidth="2"
        />
      ))}
      <path d="M0 170 H600" stroke="#fff7ed" strokeWidth="4" />
      <circle
        cx="400"
        cy="260"
        r="46"
        fill="none"
        stroke="#fff7ed"
        strokeWidth="4"
      />
      <path d="M400 170 V300" stroke="#fff7ed" strokeWidth="4" />
      <rect x="520" y="30" width="10" height="150" fill="#64748b" />
      <rect
        x="470"
        y="36"
        width="80"
        height="54"
        rx="4"
        fill="#f8fafc"
        stroke="#475569"
        strokeWidth="3"
      />
      <rect
        x="496"
        y="58"
        width="28"
        height="22"
        fill="none"
        stroke="#c2410c"
        strokeWidth="3"
      />
      <ellipse
        cx="510"
        cy="98"
        rx="28"
        ry="6"
        fill="none"
        stroke="#c2410c"
        strokeWidth="4"
      />
      <path
        d="M484 98 L496 132 H524 L536 98"
        fill="none"
        stroke="#fff7ed"
        strokeWidth="2"
      />
      <rect x="36" y="178" width="196" height="92" rx="8" fill="#334155" />
      <path d="M36 226 H232" stroke="#94a3b8" strokeWidth="3" />
      {balls.map((b, i) => (
        <g key={i}>
          <circle
            cx={b.x}
            cy={b.y - 6}
            r="10"
            fill="#ea7a1f"
            stroke="#7c2d12"
            strokeWidth="1.5"
          />
          <path
            d={`M${b.x - 10} ${b.y - 6} H${b.x + 10}`}
            stroke="#7c2d12"
            strokeWidth="1.3"
          />
        </g>
      ))}
      <g transform="translate(340 120)">
        <rect x="-20" y="22" width="40" height="62" rx="12" fill="#c2410c" />
        <Face x={0} y={0} skin="#c68c5a" />
        <path
          d="M-22 -10 H22"
          stroke="#facc15"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <circle
          cx="30"
          cy="48"
          r="5"
          fill="#e5e7eb"
          stroke="#475569"
          strokeWidth="1.5"
        />
      </g>
    </>
  );
}

function SoccerScene() {
  const balls = thirteen(52, 214, 17, 15);
  return (
    <>
      <rect width="600" height="300" fill="#bfe6f5" />
      <ellipse cx="140" cy="46" rx="42" ry="11" fill="#fff" />
      <circle cx="530" cy="46" r="26" fill="#fde68a" />
      <rect y="110" width="600" height="190" fill="#4ea85a" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect
          key={i}
          x={i * 100}
          y="110"
          width="50"
          height="190"
          fill="#59b565"
        />
      ))}
      <path
        d="M390 190 V100 H570 V190"
        stroke="#f8fafc"
        strokeWidth="5"
        fill="rgb(255 255 255 / 0.14)"
      />
      <g stroke="#f1f5f9" strokeWidth="1.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M${420 + i * 30} 100 V190`} />
        ))}
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M390 ${124 + i * 24} H570`} />
        ))}
      </g>
      <path d="M0 250 H600" stroke="#ecfdf5" strokeWidth="4" opacity="0.7" />
      <path d="M300 236 l12 -30 l12 30Z" fill="#fb923c" />
      <path d="M340 252 l12 -30 l12 30Z" fill="#fb923c" />
      <path
        d="M36 196 H232 L220 280 H48Z"
        fill="#475569"
        stroke="#1e293b"
        strokeWidth="3"
      />
      <path
        d="M56 196 Q134 160 212 196"
        fill="none"
        stroke="#1e293b"
        strokeWidth="4"
      />
      {balls.map((b, i) => (
        <g key={i}>
          <circle
            cx={b.x}
            cy={b.y}
            r="8.5"
            fill="#fff"
            stroke="#1f2937"
            strokeWidth="1.5"
          />
          <path
            d={`M${b.x} ${b.y - 3} l3 2 l-1 3.5 h-4 l-1 -3.5Z`}
            fill="#1f2937"
          />
        </g>
      ))}
      <g transform="translate(270 140)">
        <rect
          x="-18"
          y="22"
          width="36"
          height="52"
          rx="12"
          fill="#15803d"
          stroke="#14532d"
          strokeWidth="2"
        />
        <Face x={0} y={0} skin="#8d5a3b" />
        <path d="M-22 -8 Q0 -30 22 -8 Q0 -14 -22 -8Z" fill="#14532d" />
      </g>
    </>
  );
}

const SCENES: Record<InterestId, () => React.JSX.Element> = {
  cricket: CricketScene,
  building: BuildingScene,
  space: SpaceScene,
  basketball: BasketballScene,
  soccer: SoccerScene,
};

export function InterestScene({
  id,
  className = "",
}: {
  id: InterestId;
  className?: string;
}) {
  const Scene = SCENES[id];
  return (
    <svg
      data-scene={id}
      viewBox="0 0 600 300"
      aria-hidden="true"
      focusable="false"
      className={`block h-auto w-full ${className}`}
    >
      <Scene />
    </svg>
  );
}

const COLLAGE: readonly (readonly [number, number])[] = [
  [70, 80],
  [170, 200],
  [300, 100],
  [430, 210],
  [520, 90],
];

/** Art for the "Surprise me" card: a small collage of all five interests' objects. */
export function SurpriseArt() {
  return (
    <svg
      data-scene="surprise"
      viewBox="0 0 600 300"
      aria-hidden="true"
      focusable="false"
      className="block h-auto w-full"
    >
      <rect width="600" height="300" fill="#e3d2ff" />
      <path d="M0 220 Q150 150 300 210 T600 190 V300 H0Z" fill="#cdb4f5" />
      {COLLAGE.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="40" fill="#fff" opacity="0.5" />
      ))}
      <circle
        cx="70"
        cy="80"
        r="22"
        fill="#c0262d"
        stroke="#7f1d1d"
        strokeWidth="3"
      />
      <rect
        x="146"
        y="176"
        width="48"
        height="48"
        rx="6"
        fill="#fcd34d"
        stroke="#78350f"
        strokeWidth="3"
      />
      <circle
        cx="300"
        cy="100"
        r="24"
        fill="#5eead4"
        stroke="#0f766e"
        strokeWidth="3"
      />
      <ellipse
        cx="300"
        cy="100"
        rx="40"
        ry="9"
        fill="none"
        stroke="#0f766e"
        strokeWidth="4"
      />
      <circle
        cx="430"
        cy="210"
        r="26"
        fill="#ea7a1f"
        stroke="#7c2d12"
        strokeWidth="3"
      />
      <path d="M404 210 H456 M430 184 V236" stroke="#7c2d12" strokeWidth="2" />
      <circle
        cx="520"
        cy="90"
        r="24"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="3"
      />
      <path d="M520 78 l11 8 l-4 13 h-14 l-4 -13Z" fill="#1f2937" />
      <text
        x="300"
        y="272"
        textAnchor="middle"
        fontSize="64"
        fontWeight="800"
        fill="#5b21b6"
      >
        ?
      </text>
    </svg>
  );
}
