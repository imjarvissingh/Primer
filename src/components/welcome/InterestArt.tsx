import { Scene } from "@/components/practice/scenes";
import { NOT_STARTED } from "@/components/practice/scenes/progress";
import { getInterest, type InterestId } from "@/interests";

/**
 * Art for an interest on the welcome screens: the very same scene the mission
 * uses (nothing placed yet), so the preview and the game cannot drift apart.
 * Decorative and aria-hidden.
 */
export function InterestScene({ id }: { id: InterestId }) {
  return (
    <Scene themeId={getInterest(id).mission.themeId} progress={NOT_STARTED} />
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
