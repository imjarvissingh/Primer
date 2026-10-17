import { makeTenView, type CellState, type MakeTenView } from "@/lib/ten-frame";
import type { MakeTenHintSteps } from "@/lib/practice-protocol";
import { countOf, type ThemeVocabulary } from "@/themes";

const CELL = 30;
const COLS = 5;
const FRAME_W = CELL * COLS;
const FRAME_H = CELL * 2;
const GAP = 24;
const LABEL_H = 18;

interface TenFramesProps {
  vocabulary: ThemeVocabulary;
  /** The mission's public numbers. */
  start: number;
  takeAway: number;
  /** What the server disclosed with the hint on screen. Nothing more is drawn. */
  steps: MakeTenHintSteps;
}

/**
 * One shared, read-only ten-frame picture for every theme. It owns no
 * quantity: it only draws the numbers it is handed, and it draws nothing if
 * they do not describe a valid cross-ten walkthrough. The stage it shows
 * ("split" or "from-ten") is decided by what the server disclosed, so the
 * picture cannot be pushed further than the hint allows.
 */
export function TenFrames({
  vocabulary,
  start,
  takeAway,
  steps,
}: TenFramesProps) {
  const view = makeTenView({
    start,
    takeAway,
    takeToTen: steps.takeToTen,
    takeFromTen: steps.takeFromTen,
  });
  if (view === null) return null;
  const description = describe(view, vocabulary);
  return (
    <figure className="ten-frames mt-3">
      <svg
        role="img"
        aria-label={description}
        viewBox={`0 0 ${FRAME_W * 2 + GAP} ${FRAME_H + LABEL_H}`}
        className="ten-frames-svg"
        focusable="false"
      >
        {view.frames.map((frame, f) => (
          <g key={f} transform={`translate(${f * (FRAME_W + GAP)} 0)`}>
            <text
              x={FRAME_W / 2}
              y={13}
              textAnchor="middle"
              className="ten-frames-label"
            >
              {f === 0 ? "Ten" : "Extra"}
            </text>
            {frame.cells.map((cell, i) => (
              <Cell
                key={i}
                state={cell}
                x={(i % COLS) * CELL}
                y={LABEL_H + Math.floor(i / COLS) * CELL}
              />
            ))}
          </g>
        ))}
      </svg>
      <figcaption className="mt-1 text-sm">{caption(view)}</figcaption>
    </figure>
  );
}

function Cell({ state, x, y }: { state: CellState; x: number; y: number }) {
  const c = CELL / 2;
  const r = CELL / 2 - 5;
  return (
    <g data-cell={state} transform={`translate(${x} ${y})`}>
      <rect
        width={CELL}
        height={CELL}
        className="ten-frames-cell"
        fill="none"
        strokeWidth={1.5}
      />
      {state === "counter" && (
        <circle cx={c} cy={c} r={r} className="ten-frames-counter" />
      )}
      {state === "take-now" && (
        <>
          <circle cx={c} cy={c} r={r} className="ten-frames-take" />
          <path
            d={`M${c - 5} ${c - 5} L${c + 5} ${c + 5} M${c + 5} ${c - 5} L${c - 5} ${c + 5}`}
            className="ten-frames-x"
          />
        </>
      )}
      {state === "taken" && (
        <circle cx={c} cy={c} r={r} className="ten-frames-taken" />
      )}
    </g>
  );
}

function caption(view: MakeTenView): string {
  return view.stage === "split"
    ? "In this picture, ✕ means take these first."
    : "In this picture, ✕ means take these next. A dashed circle is already taken in the picture.";
}

/** Short spoken equivalent. It never states how many are left. */
function describe(view: MakeTenView, v: ThemeVocabulary): string {
  if (view.stage === "split") {
    return `A picture of ${countOf(view.start, v)} as one full ten and ${view.takeToTen} extra. In the picture, the ${view.takeToTen} extra are marked to take first.`;
  }
  return `In the picture, the ${view.takeToTen} extra ${v.plural} are already taken. The full ten has ${view.takeFromTen} marked to take next.`;
}
