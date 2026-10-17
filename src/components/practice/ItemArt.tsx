import type { ItemArtId } from "@/themes";

/**
 * The drawn object for one resource (a ball, a block, a module). One component
 * for every world: the theme only picks which drawing. It is decorative (the
 * button around it carries the accessible name) and has no numeral, so a child
 * counts the objects instead of reading labels off them.
 */
export function ItemArt({ art }: { art: ItemArtId }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
      className="item-art"
    >
      <ellipse cx="20" cy="36" rx="12" ry="2.6" fill="#000" opacity="0.18" />
      {art === "cricket-ball" && (
        <>
          <circle
            cx="20"
            cy="19"
            r="15"
            fill="#c0262d"
            stroke="#7f1d1d"
            strokeWidth="2"
          />
          <path
            d="M8 13 Q20 22 32 13 M8 25 Q20 16 32 25"
            fill="none"
            stroke="#fff"
            strokeWidth="1.6"
            strokeDasharray="2.4 2"
          />
          <ellipse
            cx="14"
            cy="11"
            rx="4.5"
            ry="2.6"
            fill="#fff"
            opacity="0.35"
          />
        </>
      )}
      {art === "basketball" && (
        <>
          <circle
            cx="20"
            cy="19"
            r="15"
            fill="#ea7a1c"
            stroke="#7c2d12"
            strokeWidth="2"
          />
          <path d="M5 19 H35 M20 4 V34" stroke="#3b1d0a" strokeWidth="1.6" />
          <path
            d="M9 8 Q16 19 9 30 M31 8 Q24 19 31 30"
            fill="none"
            stroke="#3b1d0a"
            strokeWidth="1.6"
          />
          <ellipse
            cx="14"
            cy="10"
            rx="4.5"
            ry="2.6"
            fill="#fff"
            opacity="0.3"
          />
        </>
      )}
      {art === "soccer-ball" && (
        <>
          <circle
            cx="20"
            cy="19"
            r="15"
            fill="#ffffff"
            stroke="#1f2937"
            strokeWidth="2"
          />
          <path d="M20 11 L27 16 L24.5 24 H15.5 L13 16Z" fill="#1f2937" />
          <path
            d="M20 11 V5 M27 16 L33 14 M24.5 24 L29 30 M15.5 24 L11 30 M13 16 L7 14"
            stroke="#1f2937"
            strokeWidth="1.6"
          />
        </>
      )}
      {art === "block" && (
        <>
          <path
            d="M5 12 L12 5 H35 V27 L28 34 H5Z"
            fill="#c4863f"
            stroke="#6b4423"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M5 12 H28 L35 5 M28 12 V34"
            fill="none"
            stroke="#6b4423"
            strokeWidth="2"
          />
          <path
            d="M8 18 H25 M8 24 H25 M8 29 H22"
            stroke="#a86f2f"
            strokeWidth="1.4"
          />
          <circle cx="9" cy="16" r="1.4" fill="#6b4423" />
          <circle cx="24" cy="30" r="1.4" fill="#6b4423" />
        </>
      )}
      {art === "module" && (
        <>
          <rect
            x="4"
            y="9"
            width="32"
            height="22"
            rx="9"
            fill="#a5b4fc"
            stroke="#312e81"
            strokeWidth="2"
          />
          <rect
            x="4"
            y="9"
            width="32"
            height="8"
            rx="4"
            fill="#c7d2fe"
            opacity="0.7"
          />
          <circle
            cx="20"
            cy="20"
            r="6"
            fill="#1e1b4b"
            stroke="#e0e7ff"
            strokeWidth="1.6"
          />
          <circle cx="20" cy="20" r="2.6" fill="#5eead4" />
          <rect x="9" y="26" width="4" height="2" rx="1" fill="#312e81" />
          <rect x="27" y="26" width="4" height="2" rx="1" fill="#312e81" />
        </>
      )}
    </svg>
  );
}
