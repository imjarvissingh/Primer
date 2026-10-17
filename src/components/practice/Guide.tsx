import type { GuideLook, ThemeGuide } from "@/themes";

/** The four moments a guide reacts to. Each one is tied to a real game event. */
export type GuideMood = "welcome" | "working" | "again" | "done";

/**
 * Picks the line for a moment from the theme's fixed, authored text. Nothing
 * is generated and nothing depends on how well the learner is doing.
 */
export function guideLine(guide: ThemeGuide, mood: GuideMood): string {
  return guide[mood];
}

interface FaceProps {
  mood: GuideMood;
  cx: number;
  cy: number;
  eye: string;
}

/** Eyes and mouth. Eyes glance toward the scene while working; brows lift when encouraging. */
function Face({ mood, cx, cy, eye }: FaceProps) {
  const look = mood === "working" ? 2 : 0;
  const mouth =
    mood === "done"
      ? `M${cx - 9} ${cy + 8} Q${cx} ${cy + 20} ${cx + 9} ${cy + 8} Z`
      : mood === "again"
        ? `M${cx - 6} ${cy + 11} Q${cx} ${cy + 15} ${cx + 6} ${cy + 11}`
        : mood === "working"
          ? `M${cx - 6} ${cy + 11} H${cx + 6}`
          : `M${cx - 8} ${cy + 9} Q${cx} ${cy + 18} ${cx + 8} ${cy + 9}`;
  return (
    <g>
      <circle
        cx={cx - 8 + look}
        cy={cy}
        r={mood === "done" ? 3.6 : 3.2}
        fill={eye}
      />
      <circle
        cx={cx + 8 + look}
        cy={cy}
        r={mood === "done" ? 3.6 : 3.2}
        fill={eye}
      />
      {mood === "again" && (
        <>
          <path
            d={`M${cx - 12} ${cy - 8} L${cx - 4} ${cy - 10}`}
            stroke={eye}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d={`M${cx + 4} ${cy - 10} L${cx + 12} ${cy - 8}`}
            stroke={eye}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
      <path
        d={mouth}
        fill={mood === "done" ? "#7f1d1d" : "none"}
        stroke={eye}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

/** Two arms. Raised for welcome and done, out and open for again, relaxed while working. */
function Arms({
  mood,
  y,
  spread,
  color,
}: {
  mood: GuideMood;
  y: number;
  spread: number;
  color: string;
}) {
  const s = {
    stroke: color,
    strokeWidth: 9,
    strokeLinecap: "round" as const,
    fill: "none",
  };
  if (mood === "done") {
    return (
      <>
        <path
          d={`M${60 - spread} ${y} L${60 - spread - 16} ${y - 34}`}
          {...s}
        />
        <path
          d={`M${60 + spread} ${y} L${60 + spread + 16} ${y - 34}`}
          {...s}
        />
      </>
    );
  }
  if (mood === "welcome") {
    return (
      <>
        <path
          d={`M${60 - spread} ${y} L${60 - spread - 12} ${y + 24}`}
          {...s}
        />
        <path
          d={`M${60 + spread} ${y} L${60 + spread + 18} ${y - 26}`}
          {...s}
          className="guide-wave"
        />
      </>
    );
  }
  if (mood === "again") {
    return (
      <>
        <path
          d={`M${60 - spread} ${y} L${60 - spread - 20} ${y + 14}`}
          {...s}
        />
        <path
          d={`M${60 + spread} ${y} L${60 + spread + 20} ${y + 14}`}
          {...s}
        />
      </>
    );
  }
  return (
    <>
      <path d={`M${60 - spread} ${y} L${60 - spread - 10} ${y + 26}`} {...s} />
      <path d={`M${60 + spread} ${y} L${60 + spread + 14} ${y + 16}`} {...s} />
    </>
  );
}

function Tinker({ mood }: { mood: GuideMood }) {
  return (
    <g>
      <ellipse cx="60" cy="132" rx="34" ry="5" fill="#000" opacity="0.2" />
      <Arms mood={mood} y={84} spread={24} color="#d5dde8" />
      <rect x="28" y="112" width="64" height="18" rx="9" fill="#34445e" />
      <circle cx="44" cy="121" r="6" fill="#8fa0b8" />
      <circle cx="76" cy="121" r="6" fill="#8fa0b8" />
      <rect
        x="32"
        y="62"
        width="56"
        height="54"
        rx="14"
        fill="var(--guide-main)"
      />
      <rect
        x="32"
        y="62"
        width="56"
        height="10"
        rx="5"
        fill="#fff"
        opacity="0.25"
      />
      <rect
        x="46"
        y="94"
        width="28"
        height="10"
        rx="3"
        fill="#fff"
        opacity="0.7"
      />
      <path
        d="M52 99 H68"
        stroke="var(--guide-accent)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect
        x="34"
        y="22"
        width="52"
        height="42"
        rx="14"
        fill="#e8eef7"
        stroke="#8fa0b8"
        strokeWidth="2"
      />
      <rect x="40" y="30" width="40" height="26" rx="10" fill="#1b2540" />
      <Face mood={mood} cx={60} cy={41} eye="#5eead4" />
      <path d="M60 22 V10" stroke="#8fa0b8" strokeWidth="3" />
      <circle cx="60" cy="8" r="5" fill="var(--guide-accent)" />
      <path d="M36 24 Q60 10 84 24 L84 28 H36Z" fill="var(--guide-accent)" />
    </g>
  );
}

function Orbi({ mood }: { mood: GuideMood }) {
  return (
    <g>
      <ellipse cx="60" cy="132" rx="32" ry="5" fill="#000" opacity="0.2" />
      <Arms mood={mood} y={90} spread={30} color="#cbd5ff" />
      <ellipse
        cx="60"
        cy="96"
        rx="48"
        ry="9"
        fill="none"
        stroke="var(--guide-accent)"
        strokeWidth="3"
        opacity="0.8"
      />
      <ellipse cx="60" cy="96" rx="34" ry="32" fill="var(--guide-main)" />
      <ellipse cx="60" cy="84" rx="26" ry="12" fill="#fff" opacity="0.2" />
      <circle cx="60" cy="108" r="8" fill="#1e1b4b" />
      <circle cx="60" cy="108" r="3.4" fill="var(--guide-accent)" />
      <circle
        cx="60"
        cy="52"
        r="26"
        fill="#e8ecff"
        stroke="#a5b4fc"
        strokeWidth="2"
      />
      <ellipse cx="60" cy="52" rx="20" ry="16" fill="#1b2142" />
      <Face mood={mood} cx={60} cy={48} eye="#fde047" />
      <path d="M60 26 V14" stroke="#a5b4fc" strokeWidth="3" />
      <circle cx="60" cy="12" r="5" fill="var(--guide-accent)" />
    </g>
  );
}

function Coach({ mood, look }: { mood: GuideMood; look: GuideLook }) {
  return (
    <g>
      <ellipse cx="60" cy="132" rx="30" ry="5" fill="#000" opacity="0.2" />
      <Arms mood={mood} y={84} spread={24} color="#f1c9a0" />
      <rect x="44" y="108" width="12" height="22" rx="5" fill="#1e3a8a" />
      <rect x="64" y="108" width="12" height="22" rx="5" fill="#1e3a8a" />
      <rect x="40" y="126" width="16" height="6" rx="3" fill="#0f172a" />
      <rect x="64" y="126" width="16" height="6" rx="3" fill="#0f172a" />
      <rect
        x="34"
        y="62"
        width="52"
        height="52"
        rx="16"
        fill="var(--guide-main)"
      />
      <path d="M60 62 V114" stroke="#fff" strokeWidth="2" opacity="0.35" />
      {look === "coach-cap" && (
        <>
          {/* Sweater vest and a clipboard */}
          <path
            d="M44 66 L60 92 L76 66"
            fill="none"
            stroke="var(--guide-accent)"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <rect
            x="86"
            y="82"
            width="18"
            height="24"
            rx="3"
            fill="#fef3c7"
            stroke="#92400e"
            strokeWidth="2"
          />
          <path
            d="M90 90 H100 M90 96 H100 M90 102 H97"
            stroke="#92400e"
            strokeWidth="1.4"
          />
        </>
      )}
      {look === "coach-headband" && (
        <>
          {/* Jersey stripes, wristbands and a whistle on a lanyard */}
          <path
            d="M34 84 H86 M34 96 H86"
            stroke="var(--guide-accent)"
            strokeWidth="4"
            opacity="0.9"
          />
          <path
            d="M52 62 Q60 84 68 62"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
          />
          <rect
            x="56"
            y="82"
            width="12"
            height="7"
            rx="3"
            fill="#facc15"
            stroke="#854d0e"
            strokeWidth="1.5"
          />
        </>
      )}
      {look === "coach-beanie" && (
        <>
          {/* Scarf and a training cone */}
          <path
            d="M40 66 Q60 78 80 66 V74 Q60 86 40 74Z"
            fill="var(--guide-accent)"
          />
          <path d="M76 74 V94 H84 V78Z" fill="var(--guide-accent)" />
          <path
            d="M90 108 L98 84 L106 108Z"
            fill="#fb923c"
            stroke="#9a3412"
            strokeWidth="1.5"
          />
          <path d="M94 98 H102" stroke="#fff" strokeWidth="2.5" />
        </>
      )}
      <circle cx="60" cy="42" r="22" fill="#f5c9a0" />
      {look === "coach-cap" && (
        <>
          <path d="M36 38 a24 20 0 0 1 48 0 Z" fill="var(--guide-accent)" />
          <rect
            x="30"
            y="34"
            width="60"
            height="6"
            rx="3"
            fill="var(--guide-accent)"
          />
          <rect
            x="62"
            y="34"
            width="34"
            height="5"
            rx="2.5"
            fill="var(--guide-accent)"
            opacity="0.85"
          />
          <circle cx="60" cy="22" r="3" fill="#fff" opacity="0.8" />
        </>
      )}
      {look === "coach-headband" && (
        <>
          <path d="M38 36 a22 22 0 0 1 44 0 Z" fill="#3b1d0a" />
          <rect
            x="37"
            y="30"
            width="46"
            height="8"
            rx="4"
            fill="var(--guide-accent)"
          />
          <path d="M82 32 l8 -4 l-2 10Z" fill="var(--guide-accent)" />
        </>
      )}
      {look === "coach-beanie" && (
        <>
          <path d="M37 38 a23 24 0 0 1 46 0 Z" fill="var(--guide-accent)" />
          <rect
            x="35"
            y="33"
            width="50"
            height="8"
            rx="4"
            fill="#fff"
            opacity="0.8"
          />
          <circle cx="60" cy="14" r="5" fill="#fff" />
        </>
      )}
      <Face mood={mood} cx={60} cy={46} eye="#1f2937" />
    </g>
  );
}

/**
 * A themed guide that reacts to real game events. Decorative drawing (the line
 * beside it is the text a person reads). The colors come from the theme's CSS
 * variables, so one drawing serves every world.
 */
export function GuideFigure({
  look,
  mood,
}: {
  look: GuideLook;
  mood: GuideMood;
}) {
  return (
    <svg
      viewBox="0 0 120 140"
      aria-hidden="true"
      focusable="false"
      className="guide-figure"
      data-mood={mood}
    >
      {look === "tinker" ? (
        <Tinker mood={mood} />
      ) : look === "orbi" ? (
        <Orbi mood={mood} />
      ) : (
        <Coach mood={mood} look={look} />
      )}
      {mood === "done" && (
        <g fill="#facc15" className="guide-spark">
          <path d="M16 30 l3 7 l7 1 l-5 5 l1 7 l-6 -4 l-6 4 l1 -7 l-5 -5 l7 -1z" />
          <path d="M104 22 l2 5 l5 1 l-4 4 l1 5 l-4 -3 l-4 3 l1 -5 l-4 -4 l5 -1z" />
        </g>
      )}
    </svg>
  );
}

/** The guide and its one line, as a strip under the scene. */
export function GuideStrip({
  guide,
  mood,
  reaction = 0,
}: {
  guide: ThemeGuide;
  mood: GuideMood;
  /** A counter of real events (e.g. objects moved): each change replays the guide's hop. */
  reaction?: number;
}) {
  return (
    <div className="guide-strip" data-guide-mood={mood}>
      <GuideFigure key={`${mood}:${reaction}`} look={guide.look} mood={mood} />
      <div className="guide-bubble">
        <p className="guide-name">{guide.name}</p>
        <p data-testid="guide-line">{guideLine(guide, mood)}</p>
      </div>
    </div>
  );
}
