"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/**
 * Cricket Academy: the animated introduction. A short, original, four-beat
 * story told by a camera that pans across one training ground:
 *   1. Coach Bails walks on.   2. The equipment station and its basket.
 *   3. The empty practice nets.   4. The job to do.
 *
 * It is a story prop, not the mission. It owns no quantity, is never sent to
 * the server and gates nothing: "Start practice" is always available beside it.
 * It deliberately draws NO moved or remaining balls (the basket is a heap whose
 * count cannot be read) so it can never show a remainder.
 *
 * Motion rules: autoplay only when the person has not asked for reduced motion;
 * otherwise the same four frames are stepped through with buttons. Every beat is
 * a fully drawn final state, so nothing depends on an animation finishing. There
 * is no audio.
 */

export const INTRO_BEATS = [
  {
    id: "arrive",
    cam: 0,
    coachX: 250,
    caption:
      "Welcome to Cricket Academy! Coach Bails is getting ready for practice.",
  },
  {
    id: "station",
    cam: 400,
    coachX: 560,
    caption: "At the equipment station, a basket is full of cricket balls.",
  },
  {
    id: "nets",
    cam: 800,
    coachX: 960,
    caption:
      "The practice nets are empty. Coach Bails needs some balls over there.",
  },
  {
    id: "job",
    cam: 700,
    coachX: 880,
    caption:
      "Your job: bring balls from the basket to the nets, then work out how many are still in the basket.",
  },
] as const;

const BEAT_MS = 3800;
const WALK_MS = 1700;
const LAST = INTRO_BEATS.length - 1;

type Mode = "playing" | "paused" | "finished" | "skipped";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/** Live "reduce motion" preference. Server and first client render say no. */
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window.matchMedia !== "function") return () => undefined;
      const query = window.matchMedia(REDUCED_QUERY);
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () =>
      typeof window.matchMedia === "function" &&
      window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

export function CricketIntro({ children }: { children?: ReactNode }) {
  const reduced = useReducedMotion();
  const [beat, setBeat] = useState(0);
  // What the person chose. Autoplay is the default only when motion is allowed.
  const [choice, setChoice] = useState<"auto" | "paused" | "skipped">("auto");
  const [finished, setFinished] = useState(false);
  const [settled, setSettled] = useState(-1);

  const mode: Mode = reduced
    ? choice === "skipped"
      ? "skipped"
      : "paused"
    : choice === "skipped"
      ? "skipped"
      : finished
        ? "finished"
        : choice === "paused"
          ? "paused"
          : "playing";

  // The timeline: advance one beat at a time while playing.
  useEffect(() => {
    if (mode !== "playing") return;
    const timer = window.setTimeout(
      () => (beat >= LAST ? setFinished(true) : setBeat((b) => b + 1)),
      BEAT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [mode, beat]);

  // Legs only swing while the coach is crossing the ground after a beat change.
  useEffect(() => {
    if (mode !== "playing") return;
    const stop = window.setTimeout(() => setSettled(beat), WALK_MS);
    return () => window.clearTimeout(stop);
  }, [beat, mode]);
  const walking = mode === "playing" && settled !== beat;

  const frame = INTRO_BEATS[beat];
  const playing = mode === "playing";
  const over = mode === "finished" || mode === "skipped";

  function go(to: number) {
    setBeat(Math.max(0, Math.min(LAST, to)));
  }
  function skip() {
    setBeat(LAST);
    setChoice("skipped");
  }
  function replay() {
    setBeat(0);
    setSettled(-1);
    setFinished(false);
    setChoice("auto");
  }

  return (
    <section
      aria-label="Story: Coach Bails and the empty nets"
      className="cricket-intro"
      data-intro-mode={mode}
      data-intro-beat={frame.id}
      data-reduced={reduced ? "true" : "false"}
    >
      <div className="cricket-intro-stage stage-scene">
        <IntroArt
          beat={beat}
          walking={walking}
          tossing={beat === LAST}
          tossAnimated={mode === "playing"}
          animate={!reduced}
        />
        <p
          className="cricket-intro-caption cricket-intro-subtitle"
          data-testid="intro-caption"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="cricket-intro-step">
            Story {beat + 1} of {INTRO_BEATS.length}
          </span>{" "}
          {frame.caption}
        </p>
      </div>
      {children}
      <div className="cricket-intro-controls flex flex-wrap gap-2">
        {!over && !reduced && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setChoice(playing ? "paused" : "auto")}
          >
            {playing ? "Pause story" : "Play story"}
          </button>
        )}
        {(reduced || mode === "paused") && !over && (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              aria-disabled={beat === 0}
              onClick={() => (beat === 0 ? undefined : go(beat - 1))}
            >
              Back
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              aria-disabled={beat === LAST}
              onClick={() => (beat === LAST ? undefined : go(beat + 1))}
            >
              Next
            </button>
          </>
        )}
        {!over && (
          <button type="button" className="btn btn-secondary" onClick={skip}>
            Skip story
          </button>
        )}
        {(over || (reduced && beat === LAST)) && (
          <button type="button" className="btn btn-secondary" onClick={replay}>
            Replay story
          </button>
        )}
      </div>
    </section>
  );
}

/* ---- Art ----------------------------------------------------------------- */

const VIEW_W = 600;
const VIEW_H = 340;
const GROUND = 178;

function IntroArt({
  beat,
  walking,
  tossing,
  tossAnimated,
  animate,
}: {
  beat: number;
  walking: boolean;
  tossing: boolean;
  tossAnimated: boolean;
  animate: boolean;
}) {
  const { cam, coachX } = INTRO_BEATS[beat];
  // Depth: far scenery pans slowly, the ground and props pan with the camera.
  const slide = (x: number) => ({
    transform: `translateX(${-x}px)`,
    transition: animate
      ? "transform 1600ms cubic-bezier(0.45, 0, 0.25, 1)"
      : "none",
  });
  return (
    <svg
      data-scene="cricket"
      data-cricket-intro="true"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className="scene-svg"
    >
      <defs>
        <linearGradient id="ci-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5db8ea" />
          <stop offset="1" stopColor="#e3f6fc" />
        </linearGradient>
        <linearGradient id="ci-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cc65a" />
          <stop offset="1" stopColor="#378f38" />
        </linearGradient>
        <radialGradient id="ci-sun">
          <stop offset="0" stopColor="#fff3b0" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff3b0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={VIEW_W} height={VIEW_H} fill="url(#ci-sky)" />
      <circle cx="500" cy="56" r="90" fill="url(#ci-sun)" />
      <circle cx="500" cy="56" r="22" fill="#fde68a" />

      {/* Far layer: clouds, hills and the tree line (pans slowly) */}
      <g style={slide(cam * 0.25)}>
        <g fill="#fff" opacity="0.95" className="drift">
          <ellipse cx="140" cy="60" rx="44" ry="13" />
          <ellipse cx="168" cy="49" rx="28" ry="12" />
          <ellipse cx="560" cy="88" rx="38" ry="11" />
          <ellipse cx="830" cy="58" rx="46" ry="13" />
        </g>
        <path
          d="M-80 156 Q40 104 180 142 Q320 96 460 140 Q600 100 760 144 Q880 112 1040 150 V190 H-80Z"
          fill="#9ad47c"
        />
        <path
          d="M-80 168 Q100 132 260 160 Q420 128 600 158 Q780 132 1040 164 V196 H-80Z"
          fill="#7ec062"
        />
        {[40, 150, 340, 520, 700, 880].map((x, i) => (
          <g key={x}>
            <rect
              x={x - 3}
              y={140 + (i % 2) * 6}
              width="6"
              height="30"
              fill="#6b4423"
            />
            <circle cx={x} cy={132 + (i % 2) * 6} r="21" fill="#3f8f3a" />
            <circle cx={x - 8} cy={140 + (i % 2) * 6} r="14" fill="#4aa043" />
          </g>
        ))}
      </g>

      {/* Near layer: ground, pavilion, station, nets (pans with the camera) */}
      <g style={slide(cam)}>
        <rect
          x="-200"
          y={GROUND}
          width="2000"
          height={VIEW_H - GROUND}
          fill="url(#ci-grass)"
        />
        <g fill="#fff" opacity="0.1">
          <rect x="-200" y="196" width="2000" height="14" />
          <rect x="-200" y="226" width="2000" height="18" />
          <rect x="-200" y="266" width="2000" height="22" />
          <rect x="-200" y="312" width="2000" height="28" />
        </g>
        <path
          d="M-200 178 H1800"
          stroke="#fff"
          strokeWidth="3"
          strokeDasharray="10 8"
          opacity="0.75"
        />
        <Pavilion />
        <Station />
        <Nets />
        <Coach
          x={coachX}
          walking={walking && animate}
          tossing={tossing}
          tossAnimated={tossAnimated && animate}
        />
      </g>
    </svg>
  );
}

function Pavilion() {
  return (
    <g>
      <rect
        x="30"
        y="112"
        width="132"
        height="64"
        fill="#f5ecd8"
        stroke="#c7b894"
        strokeWidth="2"
      />
      <path d="M20 114 L96 82 L172 114Z" fill="#b91c1c" />
      <rect
        x="48"
        y="132"
        width="24"
        height="24"
        fill="#7dd3fc"
        stroke="#475569"
        strokeWidth="2"
      />
      <rect
        x="118"
        y="132"
        width="24"
        height="24"
        fill="#7dd3fc"
        stroke="#475569"
        strokeWidth="2"
      />
      <rect x="82" y="138" width="28" height="38" fill="#92400e" />
      <path d="M96 82 V60" stroke="#475569" strokeWidth="2" />
      <path
        className="flag"
        d="M96 60 H118 L111 67 L118 74 H96Z"
        fill="#1d4ed8"
      />
    </g>
  );
}

/** The equipment station: a bench of kit and one wicker basket heaped with balls. */
function Station() {
  // A dense mound whose rim hides its lower half: a count cannot be read from it (and it is deliberately not the answer).
  const heap: [number, number][] = [
    [682, 212],
    [698, 214],
    [714, 212],
    [730, 213],
    [690, 202],
    [706, 203],
    [722, 202],
    [698, 192],
    [714, 192],
    [706, 183],
  ];
  return (
    <g>
      <ellipse cx="700" cy="262" rx="120" ry="14" fill="#000" opacity="0.2" />
      {/* Kit bench with bats, stumps and cones */}
      <rect x="590" y="214" width="150" height="10" rx="2" fill="#8a5a2b" />
      <rect x="598" y="224" width="8" height="38" fill="#6b4423" />
      <rect x="724" y="224" width="8" height="38" fill="#6b4423" />
      <g stroke="#7a5a28" strokeWidth="1.5">
        <rect
          x="604"
          y="150"
          width="12"
          height="62"
          rx="4"
          fill="#e9c98a"
          transform="rotate(-8 610 212)"
        />
        <rect
          x="624"
          y="156"
          width="12"
          height="56"
          rx="4"
          fill="#dcb273"
          transform="rotate(-3 630 212)"
        />
      </g>
      <g fill="#fff7e0" stroke="#7a5a28" strokeWidth="1.5">
        <rect x="738" y="168" width="5" height="46" />
        <rect x="747" y="168" width="5" height="46" />
        <rect x="756" y="168" width="5" height="46" />
      </g>
      {/* The basket */}
      <g className="intro-basket">
        <path
          d="M660 206 H744 L736 258 Q702 266 668 258Z"
          fill="#d9a85c"
          stroke="#7a4f22"
          strokeWidth="3"
        />
        <path
          d="M664 222 H740 M667 238 H737"
          stroke="#7a4f22"
          strokeWidth="2"
          opacity="0.7"
        />
        <path
          d="M672 208 V258 M690 208 V262 M708 208 V262 M726 208 V260"
          stroke="#b9853f"
          strokeWidth="2"
          opacity="0.75"
        />
        <clipPath id="ci-heap-clip">
          <rect x="640" y="170" width="120" height="44" />
        </clipPath>
        <g clipPath="url(#ci-heap-clip)">
          {heap.map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <circle
                cx={x}
                cy={y}
                r="11"
                fill="#c0262d"
                stroke="#7f1d1d"
                strokeWidth="1.6"
              />
              <path
                d={`M${x - 8} ${y - 3} Q${x} ${y + 3} ${x + 8} ${y - 3}`}
                fill="none"
                stroke="#fff"
                strokeWidth="1.2"
              />
            </g>
          ))}
        </g>
        <path
          d="M656 206 H748"
          stroke="#7a4f22"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}

/** Practice nets with five glowing spots: the places the balls are needed. */
function Nets() {
  return (
    <g>
      <path d="M1000 226 H1210 L1250 340 H960Z" fill="#d9be84" opacity="0.95" />
      <path
        d="M960 150 V300 M1250 150 V300 M960 150 H1250"
        stroke="#334155"
        strokeWidth="5"
        fill="none"
      />
      <path
        d="M960 150 L938 172 M1250 150 L1272 172"
        stroke="#334155"
        strokeWidth="3"
      />
      <g stroke="#cbd5e1" strokeWidth="1.1" opacity="0.75">
        {Array.from({ length: 14 }, (_, i) => (
          <path key={`v${i}`} d={`M${972 + i * 20} 150 V300`} />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <path key={`h${i}`} d={`M960 ${172 + i * 21} H1250`} />
        ))}
      </g>
      <ellipse
        cx="1105"
        cy="284"
        rx="150"
        ry="26"
        fill="#fff"
        opacity="0.3"
        className="goal-pad"
      />
      {Array.from({ length: 5 }, (_, i) => (
        <circle
          key={i}
          className="intro-spot"
          style={{ animationDelay: `${i * 160}ms` }}
          cx={1025 + i * 40}
          cy={284}
          r="14"
          fill="rgb(255 255 255 / 0.4)"
          stroke="#b45309"
          strokeWidth="2.5"
          strokeDasharray="5 4"
        />
      ))}
    </g>
  );
}

/**
 * Coach Bails: an original character (blue cap, white sweater, clipboard).
 * Limbs are separate groups so legs can swing while crossing the ground and the
 * free hand can wave or toss a ball. The pose of every beat is fully drawn
 * without any animation running.
 */
function Coach({
  x,
  walking,
  tossing,
  tossAnimated,
}: {
  x: number;
  walking: boolean;
  tossing: boolean;
  tossAnimated: boolean;
}) {
  return (
    <g
      className="intro-coach"
      style={{ transform: `translate(${x}px, 266px)` }}
      data-walking={walking ? "true" : "false"}
    >
      <ellipse cx="0" cy="2" rx="28" ry="5" fill="#000" opacity="0.22" />
      <g className="intro-coach-body">
        {/* legs */}
        <g className="intro-leg intro-leg-a">
          <rect x="-15" y="-34" width="12" height="32" rx="5" fill="#1e3a8a" />
          <rect x="-18" y="-6" width="18" height="7" rx="3" fill="#0f172a" />
        </g>
        <g className="intro-leg intro-leg-b">
          <rect x="3" y="-34" width="12" height="32" rx="5" fill="#1e3a8a" />
          <rect x="0" y="-6" width="18" height="7" rx="3" fill="#0f172a" />
        </g>
        {/* torso */}
        <rect x="-22" y="-80" width="44" height="50" rx="14" fill="#f8fafc" />
        <path
          d="M-11 -78 L0 -56 L11 -78"
          fill="none"
          stroke="#1d4ed8"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        {/* clipboard arm */}
        <path
          d="M-20 -68 L-30 -48"
          stroke="#f1c9a0"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <rect
          x="-44"
          y="-58"
          width="18"
          height="24"
          rx="3"
          fill="#fef3c7"
          stroke="#92400e"
          strokeWidth="2"
        />
        <path
          d="M-40 -50 H-30 M-40 -44 H-30 M-40 -38 H-33"
          stroke="#92400e"
          strokeWidth="1.4"
        />
        {/* free arm: waves in beat one, tosses a ball in the last */}
        <g className={tossing ? "intro-arm-toss" : "intro-arm-wave"}>
          <path
            d="M20 -68 L34 -88"
            stroke="#f1c9a0"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {tossing && (
            <g className={tossAnimated ? "intro-toss-ball" : undefined}>
              <circle
                cx="36"
                cy="-96"
                r="7"
                fill="#c0262d"
                stroke="#7f1d1d"
                strokeWidth="1.4"
              />
              <path
                d="M30 -96 Q36 -92 42 -96"
                fill="none"
                stroke="#fff"
                strokeWidth="1"
              />
            </g>
          )}
        </g>
        {/* head, cap and face */}
        <circle cx="0" cy="-98" r="20" fill="#f5c9a0" />
        <path d="M-22 -102 a22 18 0 0 1 44 0 Z" fill="#1d4ed8" />
        <rect x="-4" y="-108" width="30" height="6" rx="3" fill="#1e3a8a" />
        <circle cx="-7" cy="-95" r="3" fill="#1f2937" />
        <circle cx="8" cy="-95" r="3" fill="#1f2937" />
        <path
          d="M-6 -86 Q1 -80 8 -86"
          fill="none"
          stroke="#1f2937"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {tossing && (
          <g className="intro-think">
            <ellipse
              cx="-4"
              cy="-150"
              rx="22"
              ry="16"
              fill="#fff"
              stroke="#1d4ed8"
              strokeWidth="2"
            />
            <circle cx="-18" cy="-128" r="3.4" fill="#fff" stroke="#1d4ed8" />
            <circle cx="-12" cy="-120" r="2" fill="#fff" stroke="#1d4ed8" />
            <text
              x="-4"
              y="-143"
              textAnchor="middle"
              fontSize="22"
              fontWeight="800"
              fill="#1d4ed8"
            >
              ?
            </text>
          </g>
        )}
      </g>
    </g>
  );
}
