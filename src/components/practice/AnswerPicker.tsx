interface AnswerPickerProps {
  legend: string;
  max: number;
  value: number | null;
  onChange: (n: number) => void;
  disabled: boolean;
}

/**
 * Whole numbers 0..max as radio buttons: no free typing, so no malformed input.
 * Presentation only: every number from 0 to max stays selectable, in order, with
 * nothing highlighted or left out, so the set of possible answers is unchanged
 * (docs/DECISIONS.md, RC1). A fixed-width grid keeps the rows even instead of
 * leaving a ragged, wrapping strip of 21 large targets.
 */
export function AnswerPicker({
  legend,
  max,
  value,
  onChange,
  disabled,
}: AnswerPickerProps) {
  const numbers = Array.from({ length: max + 1 }, (_, i) => i);
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-lg font-semibold">{legend}</legend>
      <div className="answer-grid">
        {numbers.map((n) => (
          <label key={n} className="relative min-w-0">
            <input
              type="radio"
              name="answer"
              value={n}
              checked={value === n}
              disabled={disabled}
              onChange={() => onChange(n)}
              className="peer sr-only"
            />
            <span className="answer-chip flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-border text-xl font-bold peer-checked:border-(--accent) peer-checked:bg-(--accent) peer-checked:text-(--accent-fg) peer-disabled:cursor-not-allowed peer-disabled:opacity-60 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--focus)">
              {n}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
