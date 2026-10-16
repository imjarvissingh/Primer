/** Largest quantity the curriculum uses. A test checks this matches the domain's MAX_QUANTITY. */
export const MAX_FRAME_QUANTITY = 20;
const MAX_QUANTITY = MAX_FRAME_QUANTITY;

/**
 * INSTRUCTIONAL REPRESENTATIONS (not scoring). Lives in src/lib, with no
 * imports, so the browser can use it without ever touching the domain (which
 * holds answer keys). Pure helpers that turn trusted
 * numbers into a picture-ready description. Nothing here decides whether an
 * answer is correct (evaluateResponse does that), and no field here carries the
 * final result of a subtraction: a picture can be drawn without telling it.
 */

const isWhole = (n: unknown): n is number =>
  typeof n === "number" && Number.isSafeInteger(n);

/** A whole number split into full tens and extra ones. */
export interface PartWhole {
  readonly tens: number;
  readonly ones: number;
}

/** 13 -> one ten and three ones. Returns null for anything outside 0–20. */
export function partWhole(n: unknown): PartWhole | null {
  if (!isWhole(n) || n < 0 || n > MAX_QUANTITY) return null;
  return { tens: Math.floor(n / 10), ones: n % 10 };
}

/**
 * Which step of a make-ten subtraction is being shown.
 *  - "split":    start = ten + extras; the extras are taken first.
 *  - "from-ten": the extras are already gone; take the rest from the full ten.
 */
export type MakeTenStage = "split" | "from-ten";

/** What a make-ten picture may be told. `takeFromTen` is null until it is authorized. */
export interface MakeTenInput {
  readonly start: number;
  readonly takeAway: number;
  readonly takeToTen: number;
  readonly takeFromTen: number | null;
}

/** Cell appearance. Each state also has a non-color cue in the drawing. */
export type CellState = "counter" | "take-now" | "taken" | "empty";

export interface TenFrame {
  /** Always 10 cells, in reading order: row 1 left to right, then row 2. */
  readonly cells: readonly CellState[];
}

export interface MakeTenView {
  readonly stage: MakeTenStage;
  readonly start: number;
  /** The full ten, and the frame holding the extra ones (null if there are none). */
  readonly frames: readonly [TenFrame, TenFrame];
  readonly takeToTen: number;
  /** null while stage is "split". */
  readonly takeFromTen: number | null;
}

/**
 * Is this a subtraction that really crosses ten? start 11–19, the amount taken
 * is bigger than the extras above ten, and the taken amount stays within start.
 */
export function crossesTen(start: unknown, takeAway: unknown): boolean {
  if (!isWhole(start) || !isWhole(takeAway)) return false;
  return (
    start >= 11 &&
    start <= MAX_QUANTITY - 1 &&
    takeAway > start - 10 &&
    takeAway <= start
  );
}

const frame = (cells: CellState[]): TenFrame => ({ cells });
const fill = (count: number, state: CellState): CellState[] =>
  Array.from({ length: count }, () => state);

/**
 * Builds the ten-frame picture for one authorized stage, or null when the
 * numbers do not describe a valid cross-ten walkthrough (so the caller shows no
 * make-ten picture rather than a wrong one).
 *
 * The stage comes from what the server disclosed: with no `takeFromTen` only
 * "split" can be built, so the picture cannot show more than was authorized.
 */
export function makeTenView(input: MakeTenInput): MakeTenView | null {
  const { start, takeAway, takeToTen, takeFromTen } = input;
  if (!crossesTen(start, takeAway)) return null;
  if (takeToTen !== start - 10) return null;
  if (takeFromTen === null) {
    return {
      stage: "split",
      start,
      takeToTen,
      takeFromTen: null,
      frames: [
        frame(fill(10, "counter")),
        frame([
          ...fill(takeToTen, "take-now"),
          ...fill(10 - takeToTen, "empty"),
        ]),
      ],
    };
  }
  if (!isWhole(takeFromTen) || takeFromTen < 1 || takeFromTen > 10) return null;
  if (takeToTen + takeFromTen !== takeAway) return null;
  return {
    stage: "from-ten",
    start,
    takeToTen,
    takeFromTen,
    frames: [
      frame([
        ...fill(10 - takeFromTen, "counter"),
        ...fill(takeFromTen, "take-now"),
      ]),
      frame([...fill(takeToTen, "taken"), ...fill(10 - takeToTen, "empty")]),
    ],
  };
}
