import { capitalize, type ThemeVocabulary } from "@/themes";

const PER_ROW = 5;

interface ConstructionFieldProps {
  vocabulary: ThemeVocabulary;
  /** Total items the mission starts with. */
  total: number;
  /** 1-based numbers of items currently in the construction area. */
  used: ReadonlySet<number>;
  onToggle: (item: number) => void;
  /** Outline supply items numbered above this value (a hint cue). */
  highlightAbove: number | null;
  disabled: boolean;
}

/**
 * The manipulatives, shared by every theme. Each item is a real button, so
 * touch, mouse and keyboard all work the same way. Each item lives in exactly
 * one place: its slot in the supply, or the construction area. The slot of a
 * used item stays visible and empty, so the supply can be counted at a glance.
 * The theme supplies only nouns (labels) and colors (CSS classes).
 */
export function ConstructionField({
  vocabulary: v,
  total,
  used,
  onToggle,
  highlightAbove,
  disabled,
}: ConstructionFieldProps) {
  const items = Array.from({ length: total }, (_, i) => i + 1);
  const built = items.filter((b) => used.has(b));
  const rows: number[][] = [];
  for (let i = 0; i < items.length; i += PER_ROW) {
    rows.push(items.slice(i, i + PER_ROW));
  }
  const name = capitalize(v.singular);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <section
        aria-labelledby="supply-heading"
        className="rounded-lg border-2 border-border p-3"
      >
        <h3 id="supply-heading" className="mb-2 text-base font-semibold">
          {v.supplyHeading}
        </h3>
        <div
          className="grid gap-2"
          role="group"
          aria-labelledby="supply-heading"
        >
          {rows.map((row) => (
            <div key={row[0]} className="flex gap-2">
              {row.map((b) =>
                used.has(b) ? (
                  <span key={b} aria-hidden="true" className="item item-slot" />
                ) : (
                  <button
                    key={b}
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle(b)}
                    aria-label={`${name} ${b}, ${v.supplyPlace}. Press to put it ${v.builtPlace}.`}
                    className={`item item-supply ${
                      highlightAbove !== null && b > highlightAbove
                        ? "item-cue"
                        : ""
                    }`}
                  >
                    <span aria-hidden="true">{b}</span>
                  </button>
                ),
              )}
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="built-heading"
        className="rounded-lg border-2 border-border p-3"
      >
        <h3 id="built-heading" className="mb-2 text-base font-semibold">
          {v.builtHeading}
        </h3>
        <div
          role="group"
          aria-labelledby="built-heading"
          className="flex min-h-14 flex-wrap gap-2"
        >
          {built.length === 0 && (
            <p className="text-sm text-muted">
              None yet. Tap a {v.singular} {v.supplyPlace}.
            </p>
          )}
          {built.map((b) => (
            <button
              key={b}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(b)}
              aria-label={`${name} ${b}, ${v.builtPlace}. Press to put it back ${v.supplyPlace}.`}
              className="item item-built"
            >
              <span aria-hidden="true">{b}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
