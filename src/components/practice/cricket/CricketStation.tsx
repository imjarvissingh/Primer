import { ItemArt } from "../ItemArt";

/**
 * Cricket-only play furniture. Everything here is presentation derived from the
 * session's own numbers and the learner's own selection. None of it is sent to
 * the server, scored, or allowed to decide what is correct.
 */

export type Grouping = "loose" | "ten";

interface ScoreboardProps {
  /** The mission's public starting amount. */
  start: number;
  /** The mission's public amount to use. */
  takeAway: number;
  /** Balls the learner has moved to the nets right now (the selection size). */
  used: number;
}

/**
 * The three quantities, kept apart: what we start with, what has been used, and
 * what is left. "Left" is never calculated for the learner: it shows a question
 * mark until they answer, and the answer itself is only judged by the server.
 */
export function CricketScoreboard({ start, takeAway, used }: ScoreboardProps) {
  return (
    <dl className="scoreboard" aria-label="Scoreboard">
      <div className="scoreboard-cell">
        <dt>At the start</dt>
        <dd data-board="start">{start}</dd>
      </div>
      <div className="scoreboard-cell">
        <dt>Sent to the nets</dt>
        <dd data-board="used">
          {used} <span className="scoreboard-of">of {takeAway}</span>
        </dd>
      </div>
      <div className="scoreboard-cell scoreboard-left">
        <dt>Left in the basket</dt>
        <dd data-board="left">
          <span aria-hidden="true">?</span>
          <span className="sr-only">
            Not known yet. Count them, then answer.
          </span>
        </dd>
      </div>
    </dl>
  );
}

interface GroupingChooserProps {
  value: Grouping;
  onChange: (next: Grouping) => void;
  disabled: boolean;
}

/**
 * Stage 2: look at the basket your own way. Choosing "Make a ten" moves the
 * first ten balls into a rack so ten and some extras can be seen at a glance.
 * Both views show the same balls and the same selection.
 */
export function GroupingChooser({
  value,
  onChange,
  disabled,
}: GroupingChooserProps) {
  return (
    <fieldset className="grouping-chooser card p-3">
      <legend className="px-1 text-base font-bold">
        Look at the basket your way
      </legend>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["loose", "Just the balls"],
            ["ten", "Make a ten"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={value === id}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={`grouping-chip ${value === id ? "grouping-chip-on" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm" role="status" aria-live="polite">
        {value === "ten"
          ? "The first balls are in a rack that holds ten. The rest are extras outside it."
          : "The balls are loose in the basket, in rows of five."}
      </p>
    </fieldset>
  );
}

interface AftermathProps {
  total: number;
  /** 1-based numbers of the balls the learner moved. */
  used: ReadonlySet<number>;
}

/**
 * Shown only after the server confirms a right answer. It draws the balls that
 * really are still in the basket (every ball the learner did not move) and the
 * balls they did move, from the very selection they made, so the final picture
 * is the consequence of their own actions.
 */
export function CricketAftermath({ total, used }: AftermathProps) {
  const all = Array.from({ length: total }, (_, i) => i + 1);
  const left = all.filter((b) => !used.has(b));
  return (
    <figure
      className="aftermath card p-3"
      aria-label="The practice area is ready"
    >
      <figcaption className="font-bold">
        Your practice area: {used.size} balls at the nets, {left.length} balls
        left in the basket.
      </figcaption>
      <div className="aftermath-rows">
        <div className="aftermath-group" data-aftermath="nets">
          <p className="aftermath-label">At the nets</p>
          {all
            .filter((b) => used.has(b))
            .map((b, i) => (
              <span
                key={b}
                className="item item-built aftermath-ball"
                style={{ animationDelay: `${i * 140}ms` }}
              >
                <ItemArt art="cricket-ball" />
              </span>
            ))}
        </div>
        <div className="aftermath-group" data-aftermath="basket">
          <p className="aftermath-label">Still in the basket</p>
          {left.map((b, i) => (
            <span
              key={b}
              className="item aftermath-ball"
              style={{ animationDelay: `${(i + used.size) * 90}ms` }}
            >
              <ItemArt art="cricket-ball" />
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
