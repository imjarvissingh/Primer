const PER_ROW = 5;

interface BlockFieldProps {
  /** Total blocks the mission starts with. */
  total: number;
  /** 1-based numbers of blocks currently on the bridge. */
  used: ReadonlySet<number>;
  onToggle: (block: number) => void;
  /** Outline pile blocks numbered above this value (a hint cue). */
  highlightAbove: number | null;
  disabled: boolean;
}

/**
 * The manipulatives. Every block is a real button, so touch, mouse and
 * keyboard all work the same way. Each block lives in exactly one place:
 * its slot in the pile, or the bridge tray. The slot of a used block stays
 * visible and empty, so the pile can be counted at a glance.
 */
export function BlockField({
  total,
  used,
  onToggle,
  highlightAbove,
  disabled,
}: BlockFieldProps) {
  const blocks = Array.from({ length: total }, (_, i) => i + 1);
  const onBridge = blocks.filter((b) => used.has(b));
  const rows: number[][] = [];
  for (let i = 0; i < blocks.length; i += PER_ROW) {
    rows.push(blocks.slice(i, i + PER_ROW));
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <section
        aria-labelledby="pile-heading"
        className="rounded-lg border-2 border-border p-3"
      >
        <h3 id="pile-heading" className="mb-2 text-base font-semibold">
          Block pile
        </h3>
        <div className="grid gap-2" role="group" aria-labelledby="pile-heading">
          {rows.map((row) => (
            <div key={row[0]} className="flex gap-2">
              {row.map((b) =>
                used.has(b) ? (
                  <span
                    key={b}
                    aria-hidden="true"
                    className="block-slot size-12 shrink-0 rounded-md border-2 border-dashed border-border sm:size-14"
                  />
                ) : (
                  <button
                    key={b}
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle(b)}
                    aria-label={`Block ${b}, in the pile. Press to put it on the bridge.`}
                    className={`block-btn block-pile size-12 shrink-0 rounded-md border-2 border-amber-900 bg-amber-300 text-sm font-bold text-gray-900 sm:size-14 ${
                      highlightAbove !== null && b > highlightAbove
                        ? "outline-4 outline-offset-2 outline-fuchsia-700 outline-dashed"
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
        aria-labelledby="bridge-heading"
        className="rounded-lg border-2 border-border p-3"
      >
        <h3 id="bridge-heading" className="mb-2 text-base font-semibold">
          On the bridge
        </h3>
        <div
          role="group"
          aria-labelledby="bridge-heading"
          className="flex min-h-14 flex-wrap gap-2"
        >
          {onBridge.length === 0 && (
            <p className="text-sm text-muted">
              No blocks yet. Tap a block in the pile.
            </p>
          )}
          {onBridge.map((b) => (
            <button
              key={b}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(b)}
              aria-label={`Block ${b}, on the bridge. Press to put it back in the pile.`}
              className="block-btn size-12 shrink-0 rounded-md border-2 border-sky-950 bg-sky-300 text-sm font-bold text-gray-900 sm:size-14"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, transparent 0 8px, rgb(12 74 110 / 0.35) 8px 10px)",
              }}
            >
              <span aria-hidden="true">{b}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
