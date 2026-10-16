interface AnswerPickerProps {
  max: number;
  value: number | null;
  onChange: (n: number) => void;
  disabled: boolean;
}

/** Whole numbers 0..max as large radio buttons: no free typing, so no malformed input. */
export function AnswerPicker({
  max,
  value,
  onChange,
  disabled,
}: AnswerPickerProps) {
  const numbers = Array.from({ length: max + 1 }, (_, i) => i);
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-lg font-semibold">
        How many blocks are left in the pile?
      </legend>
      <div className="flex flex-wrap gap-2">
        {numbers.map((n) => (
          <label key={n} className="relative">
            <input
              type="radio"
              name="answer"
              value={n}
              checked={value === n}
              disabled={disabled}
              onChange={() => onChange(n)}
              className="peer sr-only"
            />
            <span className="flex size-12 cursor-pointer items-center justify-center rounded-md border-2 border-border text-lg font-bold peer-checked:border-sky-900 peer-checked:bg-sky-800 peer-checked:text-white peer-focus-visible:outline-4 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-fuchsia-700">
              {n}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
