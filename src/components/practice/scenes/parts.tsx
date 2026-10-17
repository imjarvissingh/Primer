import type { ReactNode } from "react";
import {
  isComplete,
  slotLayout,
  slotStates,
  type ConstructionProgress,
} from "./progress";

/**
 * Shared building blocks for the five layered scenes. All art here is
 * decorative and aria-hidden: the real, countable objects are the buttons in
 * the tray below the scene. A scene draws only the PLACES to fill (one per
 * object the story asks to place) and never the objects still to be counted, so
 * it cannot show or contradict the session's own count.
 *
 * Composition rules (so the scene reads at any size):
 * - viewBox 600 x 340. On phones the frame is taller than wide and the SVG
 *   slices the sides, so everything essential lives in the centre band
 *   x 110..490. The goal pad is centred on x = 300.
 * - Decoration that could be mistaken for a countable resource is never drawn.
 */
export const VIEW_W = 600;
export const VIEW_H = 340;
export const PAD_Y = 262;
export const PAD_W = 260;

export function SceneFrame({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  return (
    <svg
      data-scene={name}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className="scene-svg"
    >
      {children}
    </svg>
  );
}

/** Soft sun or moon glow, as a radial gradient disc. */
export function Glow({
  id,
  cx,
  cy,
  r,
  color,
}: {
  id: string;
  cx: number;
  cy: number;
  r: number;
  color: string;
}) {
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity="0.95" />
          <stop offset="0.45" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
    </>
  );
}

/** Ground contact shadow under things that stand in the scene. */
export function Shadow({ cx, cy, rx }: { cx: number; cy: number; rx: number }) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={rx * 0.16}
      fill="#000"
      opacity="0.22"
    />
  );
}

/**
 * The goal: a lit pad with one place per object to move. `render` draws a
 * filled place; empty places are an outline whose shape comes from `shape`.
 * Filling every place is not a correct answer (only the server decides that),
 * and the finished ring needs exactly the goal number placed.
 */
export function GoalPad({
  progress,
  shape,
  render,
  padFill = "#ffffff",
  edge = "#b45309",
  y = PAD_Y,
  width = PAD_W,
}: {
  progress: ConstructionProgress;
  shape: "circle" | "plank" | "pod";
  render: (cx: number, cy: number, size: number) => ReactNode;
  padFill?: string;
  edge?: string;
  /** Vertical position of the row of places (scene units). */
  y?: number;
  /** Width of the row of places; keep it inside the centre band. */
  width?: number;
}) {
  const states = slotStates(progress);
  const complete = isComplete(progress);
  const n = states.length;
  const slots = n === 0 ? [] : slotLayout(n, 300 - width / 2, width, 10);
  return (
    <g data-goal-pad>
      <ellipse
        className="goal-pad"
        cx="300"
        cy={y + 6}
        rx={width / 2 + 26}
        ry="34"
        fill={padFill}
        opacity="0.38"
      />
      <ellipse
        cx="300"
        cy={y + 10}
        rx={width / 2 + 14}
        ry="26"
        fill="none"
        stroke={complete ? "#15803d" : edge}
        strokeWidth={complete ? 4 : 2.5}
        strokeDasharray={complete ? undefined : "7 6"}
      />
      {n === 0 && (
        <rect
          x={300 - width / 2}
          y={y - 18}
          width={width}
          height="36"
          rx="18"
          fill="rgb(255 255 255 / 0.2)"
          stroke={edge}
          strokeWidth="2"
          strokeDasharray="6 5"
        />
      )}
      {slots.map((slot, i) => {
        const cx = slot.x + slot.w / 2;
        const size = Math.min(slot.w, 40);
        return states[i] ? (
          <g
            key={`${i}-b`}
            data-slot="built"
            className="slot-built"
            transform={`translate(${cx} ${y})`}
          >
            {render(0, 0, size)}
          </g>
        ) : (
          <g key={`${i}-e`} data-slot="empty" className="slot-empty">
            {shape === "circle" ? (
              <circle
                cx={cx}
                cy={y}
                r={size / 2}
                fill="rgb(255 255 255 / 0.4)"
                stroke={edge}
                strokeWidth="2.5"
                strokeDasharray="5 4"
              />
            ) : (
              <rect
                x={cx - size / 2}
                y={y - (shape === "plank" ? 9 : 13)}
                width={size}
                height={shape === "plank" ? 18 : 26}
                rx={shape === "plank" ? 3 : 12}
                fill="rgb(255 255 255 / 0.4)"
                stroke={edge}
                strokeWidth="2.5"
                strokeDasharray="5 4"
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

/** A little rising sparkle burst, shown only when the picture is finished. */
export function Celebrate({ color = "#facc15" }: { color?: string }) {
  const spark = (x: number, y: number, s: number, d: number) => (
    <path
      key={`${x}-${y}`}
      className="spark"
      style={{ animationDelay: `${d}ms` }}
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 -9 L2.6 -2.6 L9 0 L2.6 2.6 L0 9 L-2.6 2.6 L-9 0 L-2.6 -2.6Z"
      fill={color}
    />
  );
  return (
    <g className="celebrate">
      {spark(150, 170, 1.3, 0)}
      {spark(205, 120, 0.9, 200)}
      {spark(300, 105, 1.5, 100)}
      {spark(395, 120, 0.9, 300)}
      {spark(450, 170, 1.3, 150)}
      {spark(250, 215, 0.7, 350)}
      {spark(350, 215, 0.7, 250)}
    </g>
  );
}
