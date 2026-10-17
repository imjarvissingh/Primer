import { useEffect, useRef } from "react";
import { capitalize, type ItemArtId, type ThemeVocabulary } from "@/themes";
import { ItemArt } from "./ItemArt";

const PER_ROW = 5;

interface ConstructionFieldProps {
  vocabulary: ThemeVocabulary;
  /** Which drawing the resources use (a theme choice, presentation only). */
  art: ItemArtId;
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
  art,
  total,
  used,
  onToggle,
  highlightAbove,
  disabled,
}: ConstructionFieldProps) {
  const items = Array.from({ length: total }, (_, i) => i + 1);
  const root = useRef<HTMLDivElement>(null);
  // Where keyboard focus should land after the pressed object moves. The pressed
  // button is replaced by an empty place, so without this focus would drop to
  // the page and Tab would restart from the top.
  const refocus = useRef<{ item: number; place: "supply" | "built" } | null>(
    null,
  );
  useEffect(() => {
    const want = refocus.current;
    if (want === null) return;
    refocus.current = null;
    const find = (item: number, place: string) =>
      root.current?.querySelector<HTMLElement>(
        `button[data-item="${item}"][data-place="${place}"]`,
      ) ?? null;
    (want.place === "supply"
      ? find(want.item, "supply")
      : (root.current?.querySelector<HTMLElement>(
          'button[data-place="supply"]',
        ) ?? find(want.item, "built"))
    )?.focus();
  }, [used]);
  const press = (item: number) => {
    // Pressing a supply object moves on to the next one still in the supply;
    // pressing a moved object follows it back into the supply.
    refocus.current = { item, place: used.has(item) ? "supply" : "built" };
    onToggle(item);
  };
  const built = items.filter((b) => used.has(b));
  const rows: number[][] = [];
  for (let i = 0; i < items.length; i += PER_ROW) {
    rows.push(items.slice(i, i + PER_ROW));
  }
  const name = capitalize(v.singular);

  // Two columns only when each column fits a row of five items (about 736px up).
  // 200% zoom on a 1280px screen is a 640px page, which must stay stacked.
  return (
    <div ref={root} className="grid grid-cols-1 gap-4 min-[47rem]:grid-cols-2">
      <section
        aria-labelledby="supply-heading"
        className="field-panel field-supply"
      >
        <h3 id="supply-heading" className="tray-label">
          {v.supplyHeading}
        </h3>
        {/* Counting is the task, so say how to do it without saying the number. */}
        <p id="supply-help" className="sr-only">
          Count the {v.plural} {v.supplyPlace} yourself: move through them one
          at a time with Tab. Each one is a button you can press to put it{" "}
          {v.builtPlace}.
        </p>
        <div
          className="tray grid grid-cols-1 gap-2"
          role="group"
          aria-labelledby="supply-heading"
          aria-describedby="supply-help"
        >
          {rows.map((row) => (
            <div
              key={row[0]}
              className="tray-row flex flex-wrap gap-1 sm:gap-2"
            >
              {row.map((b) => {
                const cued = highlightAbove !== null && b > highlightAbove;
                return used.has(b) ? (
                  <span key={b} aria-hidden="true" className="item item-slot" />
                ) : (
                  <button
                    key={b}
                    type="button"
                    data-item={b}
                    data-place="supply"
                    disabled={disabled}
                    onClick={() => press(b)}
                    aria-label={`${name} ${b}, ${v.supplyPlace}${cued ? ", outlined by the hint" : ""}. Press to put it ${v.builtPlace}.`}
                    className={`item item-supply ${cued ? "item-cue" : ""}`}
                  >
                    <ItemArt art={art} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="built-heading"
        className="field-panel field-built"
      >
        <h3 id="built-heading" className="tray-label">
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
              data-item={b}
              data-place="built"
              disabled={disabled}
              onClick={() => press(b)}
              aria-label={`${name} ${b}, ${v.builtPlace}. Press to put it back ${v.supplyPlace}.`}
              className="item item-built"
            >
              <ItemArt art={art} />
              <span aria-hidden="true" className="item-check">
                &#10003;
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
