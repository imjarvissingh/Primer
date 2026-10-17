/**
 * DRAFT make-ten lab: pure state rules for an adult-operated, educator-review-
 * gated instructional hypothesis (docs/EDUCATOR-REVIEW-PACKET.md, section 7).
 *
 * This is NOT the tutoring policy and is not connected to scoring, sessions,
 * hints or evidence. It runs entirely in the browser, keeps nothing, and its
 * numbers are fixed demonstration numbers (13 balls, a rack of 10, take 5), not
 * the server's challenge. It must never feed an answer to the practice flow.
 */

export const LAB_TOTAL = 13;
export const LAB_RACK = 10;
export const LAB_TAKE = 5;
/** The extras beyond the ten, and what is still needed after taking them. */
export const LAB_EXTRAS = LAB_TOTAL - LAB_RACK;
export const LAB_REST = LAB_TAKE - LAB_EXTRAS;

export type Place = "pile" | "rack" | "nets";
export type LabStep = 1 | 2 | 3 | 4;

export interface LabState {
  readonly step: LabStep;
  /** Where each ball is; index 0 is ball 1. */
  readonly places: readonly Place[];
  /** Balls moved from the rack to the nets during step 3. */
  readonly fromRack: readonly number[];
  /** The learner's local answer in step 2, or null. */
  readonly guess: number | null;
  /** Balls the learner tapped to count in step 4. */
  readonly counted: readonly number[];
}

export function initialLab(): LabState {
  return {
    step: 1,
    places: Array.from({ length: LAB_TOTAL }, () => "pile" as Place),
    fromRack: [],
    guess: null,
    counted: [],
  };
}

export const countAt = (s: LabState, place: Place) =>
  s.places.filter((p) => p === place).length;

const withPlace = (s: LabState, i: number, place: Place): LabState => ({
  ...s,
  places: s.places.map((p, j) => (j === i ? place : p)),
});

/** What pressing ball `i` (0-based) does in the current step. Anything else is a no-op. */
export function pressBall(s: LabState, i: number): LabState {
  const here = s.places[i];
  switch (s.step) {
    case 1:
      if (here === "pile" && countAt(s, "rack") < LAB_RACK)
        return withPlace(s, i, "rack");
      if (here === "rack") return withPlace(s, i, "pile");
      return s;
    case 2:
      if (s.guess !== null) return s;
      if (here === "pile") return withPlace(s, i, "nets");
      if (here === "nets") return withPlace(s, i, "pile");
      return s;
    case 3:
      if (here === "rack" && s.fromRack.length < LAB_REST)
        return { ...withPlace(s, i, "nets"), fromRack: [...s.fromRack, i] };
      if (here === "nets" && s.fromRack.includes(i))
        return {
          ...withPlace(s, i, "rack"),
          fromRack: s.fromRack.filter((b) => b !== i),
        };
      return s;
    case 4:
      if (here !== "rack") return s;
      return {
        ...s,
        counted: s.counted.includes(i)
          ? s.counted.filter((b) => b !== i)
          : [...s.counted, i],
      };
  }
}

/** Step 2 asks "how many more?". A local check only; nothing is scored. */
export function chooseGuess(s: LabState, guess: number): LabState {
  return s.step === 2 && countAt(s, "pile") === 0 ? { ...s, guess } : s;
}

export function canAdvance(s: LabState): boolean {
  switch (s.step) {
    case 1:
      return countAt(s, "rack") === LAB_RACK;
    case 2:
      return s.guess === LAB_REST && countAt(s, "pile") === 0;
    case 3:
      return countAt(s, "nets") === LAB_TAKE;
    case 4:
      return false;
  }
}

export function advance(s: LabState): LabState {
  if (!canAdvance(s)) return s;
  return { ...s, step: (s.step + 1) as LabStep };
}

/** Step 4 is finished when every ball left in the rack has been counted. */
export function allCounted(s: LabState): boolean {
  return (
    s.step === 4 &&
    countAt(s, "rack") > 0 &&
    s.counted.length === countAt(s, "rack")
  );
}

/** True when pressing ball `i` would do something now (so the control can be enabled). */
export function canPress(s: LabState, i: number): boolean {
  return pressBall(s, i) !== s;
}
