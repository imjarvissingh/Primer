import {
  isComplete,
  slotLayout,
  slotStates,
  NOT_STARTED,
  type ConstructionProgress,
} from "./progress";

/**
 * Decorative, original artwork. Hidden from assistive tech: the blocks, the
 * story and the progress text carry the meaning. The dashed span in the middle
 * is the goal; each placed block turns one dashed slot into a plank.
 */
export function BridgeScene({
  progress = NOT_STARTED,
}: {
  progress?: ConstructionProgress;
}) {
  const states = slotStates(progress);
  const slots = slotLayout(states.length, 224, 152, 3);
  const complete = isComplete(progress);
  return (
    <svg
      data-scene="bridge"
      viewBox="0 0 600 220"
      aria-hidden="true"
      focusable="false"
      className="block h-auto w-full"
    >
      <rect width="600" height="220" fill="#cfeaf7" />
      <circle cx="528" cy="42" r="24" fill="#fde68a" />
      {/* Clouds */}
      <g fill="#ffffff">
        <ellipse cx="120" cy="38" rx="34" ry="11" />
        <ellipse cx="144" cy="30" rx="22" ry="10" />
        <ellipse cx="350" cy="58" rx="30" ry="9" />
        <ellipse cx="370" cy="51" rx="18" ry="8" />
      </g>
      {/* Far hills */}
      <path
        d="M0 120 Q90 62 190 112 Q290 70 400 114 Q500 66 600 116 V150 H0Z"
        fill="#a7d68f"
      />
      {/* River */}
      <rect y="156" width="600" height="64" fill="#3b9ed6" />
      <path
        d="M0 182 q25 -9 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 M0 204 q25 -9 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0"
        fill="none"
        stroke="#e0f4fb"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Banks with the gap in the middle */}
      <path d="M0 116 H208 V170 H0Z" fill="#8a5f3a" />
      <path d="M0 116 H208 V130 H0Z" fill="#5fa84a" />
      <path d="M392 116 H600 V170 H392Z" fill="#8a5f3a" />
      <path d="M392 116 H600 V130 H392Z" fill="#5fa84a" />
      {/* Trees */}
      <g>
        <rect x="150" y="84" width="8" height="34" fill="#6b4423" />
        <circle cx="154" cy="78" r="20" fill="#3f8f3a" />
        <rect x="548" y="82" width="8" height="36" fill="#6b4423" />
        <circle cx="552" cy="76" r="22" fill="#3f8f3a" />
      </g>
      {/* Broken planks and posts at each edge of the gap */}
      <rect x="194" y="130" width="26" height="12" rx="2" fill="#c4863f" />
      <rect x="382" y="130" width="26" height="12" rx="2" fill="#c4863f" />
      <rect x="198" y="100" width="6" height="30" fill="#6b4423" />
      <rect x="396" y="100" width="6" height="30" fill="#6b4423" />
      {/* The missing span. Before a mission starts: one outline. After: one slot per block to place. */}
      {states.length === 0 ? (
        <rect
          x="224"
          y="126"
          width="152"
          height="14"
          rx="3"
          fill="rgb(255 255 255 / 0.35)"
          stroke="#b45309"
          strokeWidth="3"
          strokeDasharray="8 6"
        />
      ) : (
        <>
          {complete && (
            <rect
              x="220"
              y="122"
              width="160"
              height="22"
              rx="5"
              fill="none"
              stroke="#15803d"
              strokeWidth="3"
            />
          )}
          {slots.map((slot, i) =>
            states[i] ? (
              <g key={`${i}-built`} data-slot="built" className="slot-built">
                <rect
                  x={slot.x}
                  y="126"
                  width={slot.w}
                  height="14"
                  rx="2"
                  fill="#c4863f"
                  stroke="#6b4423"
                  strokeWidth="2"
                />
                <path
                  d={`M${slot.x + slot.w / 2} 129 V137`}
                  stroke="#6b4423"
                  strokeWidth="1.5"
                />
              </g>
            ) : (
              <rect
                key={`${i}-empty`}
                data-slot="empty"
                x={slot.x}
                y="126"
                width={slot.w}
                height="14"
                rx="2"
                fill="rgb(255 255 255 / 0.35)"
                stroke="#b45309"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
            ),
          )}
        </>
      )}
      {/* Flag on the far bank: where the bridge leads */}
      <rect x="440" y="76" width="4" height="42" fill="#6b4423" />
      <path d="M444 78 H478 L468 88 L478 98 H444Z" fill="#ef4444" />
    </svg>
  );
}
