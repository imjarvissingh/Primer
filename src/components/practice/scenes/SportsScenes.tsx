import {
  NOT_STARTED,
  slotLayout,
  slotStates,
  type ConstructionProgress,
} from "./progress";

/**
 * Decorative, original artwork for the three ball worlds. Hidden from assistive
 * tech: the buttons, the story and the progress text carry the meaning.
 *
 * Two rules keep the pictures honest. (1) The scene draws only the places to
 * fill, one per ball the story asks to place. The balls still to be counted are
 * the real, separate, individually visible objects in the tray below the scene
 * (never a drawing that could disagree with the session). (2) Filling every
 * slot is not a correct answer; only the server decides that.
 */
type Sport = "cricket" | "basketball" | "soccer";

interface SceneProps {
  progress?: ConstructionProgress;
}

const SLOT_Y = 176;

function Ball({
  sport,
  cx,
  cy,
  r,
}: {
  sport: Sport;
  cx: number;
  cy: number;
  r: number;
}) {
  if (sport === "cricket") {
    return (
      <g data-slot="built" className="slot-built">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="#c0262d"
          stroke="#7f1d1d"
          strokeWidth="2"
        />
        <path
          d={`M${cx - r + 3} ${cy} Q${cx} ${cy - 6} ${cx + r - 3} ${cy}`}
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
        />
      </g>
    );
  }
  if (sport === "basketball") {
    return (
      <g data-slot="built" className="slot-built">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="#ea7a1c"
          stroke="#7c2d12"
          strokeWidth="2"
        />
        <path
          d={`M${cx - r} ${cy} H${cx + r} M${cx} ${cy - r} V${cy + r}`}
          stroke="#3b1d0a"
          strokeWidth="1.5"
        />
        <path
          d={`M${cx - r * 0.7} ${cy - r * 0.7} Q${cx - r * 0.2} ${cy} ${cx - r * 0.7} ${cy + r * 0.7} M${cx + r * 0.7} ${cy - r * 0.7} Q${cx + r * 0.2} ${cy} ${cx + r * 0.7} ${cy + r * 0.7}`}
          fill="none"
          stroke="#3b1d0a"
          strokeWidth="1.5"
        />
      </g>
    );
  }
  return (
    <g data-slot="built" className="slot-built">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="#ffffff"
        stroke="#1f2937"
        strokeWidth="2"
      />
      <path
        d={`M${cx} ${cy - r * 0.45} L${cx + r * 0.43} ${cy - r * 0.14} L${cx + r * 0.27} ${cy + r * 0.36} L${cx - r * 0.27} ${cy + r * 0.36} L${cx - r * 0.43} ${cy - r * 0.14}Z`}
        fill="#1f2937"
      />
    </g>
  );
}

/** One ring per ball to place; each placed ball turns one ring into a ball. */
function Slots({
  sport,
  progress,
  x,
  width,
}: {
  sport: Sport;
  progress: ConstructionProgress;
  x: number;
  width: number;
}) {
  const states = slotStates(progress);
  // Before a mission starts there are no slots yet, only one outline of the area.
  const slots =
    states.length === 0 ? [] : slotLayout(states.length, x, width, 8);
  const complete = states.length > 0 && states.every(Boolean);
  return (
    <>
      {states.length === 0 && (
        <rect
          x={x - 8}
          y={SLOT_Y - 24}
          width={width + 16}
          height="48"
          rx="24"
          fill="rgb(255 255 255 / 0.3)"
          stroke="#b45309"
          strokeWidth="2.5"
          strokeDasharray="6 5"
        />
      )}
      {complete && (
        <rect
          x={x - 8}
          y={SLOT_Y - 24}
          width={width + 16}
          height="48"
          rx="24"
          fill="none"
          stroke="#15803d"
          strokeWidth="3"
        />
      )}
      {slots.map((slot, i) => {
        const cx = slot.x + slot.w / 2;
        const r = Math.min(slot.w / 2, 17);
        return states[i] ? (
          <Ball key={`${i}-b`} sport={sport} cx={cx} cy={SLOT_Y} r={r} />
        ) : (
          <circle
            key={`${i}-e`}
            data-slot="empty"
            cx={cx}
            cy={SLOT_Y}
            r={r}
            fill="rgb(255 255 255 / 0.4)"
            stroke="#b45309"
            strokeWidth="2.5"
            strokeDasharray="5 4"
          />
        );
      })}
    </>
  );
}

export function CricketScene({ progress = NOT_STARTED }: SceneProps) {
  return (
    <svg
      data-scene="cricket"
      viewBox="0 0 600 220"
      aria-hidden="true"
      focusable="false"
      className="block h-auto w-full"
    >
      <rect width="600" height="220" fill="#bfe3f5" />
      <circle cx="540" cy="40" r="22" fill="#fde68a" />
      <g fill="#ffffff">
        <ellipse cx="150" cy="36" rx="32" ry="10" />
        <ellipse cx="172" cy="29" rx="20" ry="9" />
      </g>
      <rect y="110" width="600" height="110" fill="#5fae4a" />
      <g fill="#52a042">
        <rect y="130" width="600" height="18" />
        <rect y="168" width="600" height="18" />
        <rect y="204" width="600" height="16" />
      </g>
      {/* Pitch with stumps */}
      <path d="M200 112 H330 L350 220 H180Z" fill="#dcc08a" />
      <g fill="#fff7e0" stroke="#7a5a28" strokeWidth="1.5">
        <rect x="258" y="96" width="5" height="26" />
        <rect x="267" y="96" width="5" height="26" />
        <rect x="276" y="96" width="5" height="26" />
      </g>
      {/* Practice net */}
      <g stroke="#475569" strokeWidth="2" fill="none">
        <path d="M380 98 V210 M590 98 V210 M380 98 H590" />
        <path d="M380 98 L360 118 M590 98 L578 118" />
      </g>
      <g stroke="#94a3b8" strokeWidth="1">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path key={`v${i}`} d={`M${400 + i * 28} 98 V210`} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <path key={`h${i}`} d={`M380 ${120 + i * 26} H590`} />
        ))}
      </g>
      <Slots sport="cricket" progress={progress} x={390} width={190} />
    </svg>
  );
}

export function BasketballScene({ progress = NOT_STARTED }: SceneProps) {
  return (
    <svg
      data-scene="basketball"
      viewBox="0 0 600 220"
      aria-hidden="true"
      focusable="false"
      className="block h-auto w-full"
    >
      <rect width="600" height="220" fill="#f3e6d3" />
      <rect y="0" width="600" height="96" fill="#e8d4b8" />
      <g stroke="#d1b99a" strokeWidth="2">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <path key={i} d={`M${40 + i * 70} 0 V96`} />
        ))}
      </g>
      <rect y="96" width="600" height="124" fill="#d9a066" />
      <g stroke="#c28a52" strokeWidth="2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M0 ${110 + i * 22} H600`} />
        ))}
      </g>
      <path d="M300 96 V220" stroke="#ffffff" strokeWidth="4" />
      <ellipse
        cx="300"
        cy="158"
        rx="46"
        ry="16"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4"
      />
      {/* Hoop and backboard */}
      <rect
        x="500"
        y="22"
        width="70"
        height="52"
        rx="3"
        fill="#ffffff"
        stroke="#475569"
        strokeWidth="3"
      />
      <rect
        x="520"
        y="42"
        width="30"
        height="20"
        fill="none"
        stroke="#ef4444"
        strokeWidth="2"
      />
      <path
        d="M512 78 H558"
        stroke="#ea580c"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M516 78 L524 100 M554 78 L546 100 M524 78 L530 100 M546 78 L540 100"
        stroke="#ffffff"
        strokeWidth="1.5"
      />
      <rect x="531" y="74" width="8" height="44" fill="#64748b" />
      <Slots sport="basketball" progress={progress} x={230} width={190} />
    </svg>
  );
}

export function SoccerScene({ progress = NOT_STARTED }: SceneProps) {
  return (
    <svg
      data-scene="soccer"
      viewBox="0 0 600 220"
      aria-hidden="true"
      focusable="false"
      className="block h-auto w-full"
    >
      <rect width="600" height="220" fill="#c5e8f7" />
      <circle cx="70" cy="40" r="22" fill="#fde68a" />
      <g fill="#ffffff">
        <ellipse cx="300" cy="34" rx="34" ry="10" />
        <ellipse cx="324" cy="27" rx="20" ry="9" />
      </g>
      <rect y="100" width="600" height="120" fill="#4caf50" />
      <g fill="#43a047">
        <rect y="118" width="600" height="20" />
        <rect y="160" width="600" height="20" />
        <rect y="200" width="600" height="20" />
      </g>
      <path d="M0 150 H600" stroke="#ffffff" strokeWidth="3" opacity="0.8" />
      {/* Goal */}
      <g stroke="#ffffff" strokeWidth="5" fill="none">
        <path d="M470 100 V50 H580 V100" />
      </g>
      <g stroke="#e5e7eb" strokeWidth="1">
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={`v${i}`} d={`M${492 + i * 22} 52 V100`} />
        ))}
        {[0, 1, 2].map((i) => (
          <path key={`h${i}`} d={`M472 ${64 + i * 14} H578`} />
        ))}
      </g>
      <Slots sport="soccer" progress={progress} x={230} width={190} />
      <path d="M440 176 L452 148 L464 176Z" fill="#f97316" />
    </svg>
  );
}
