import type { ValidatedProblem } from "../math";

/**
 * What a child-facing screen may be told about an item. It carries the numbers
 * to DISPLAY, and nothing else: no answer, no skill, no bank, no review status,
 * no hints. A "count" item must show the quantity as objects, so the displayed
 * count is unavoidably visible; that is the stimulus, not a leaked key.
 */
export type Stimulus =
  | { readonly kind: "count-objects"; readonly objectCount: number }
  | { readonly kind: "combine"; readonly partA: number; readonly partB: number }
  | {
      readonly kind: "find-missing-part";
      readonly total: number;
      readonly knownPart: number;
    }
  | {
      readonly kind: "take-away";
      readonly start: number;
      readonly takeAway: number;
    };

export interface LearnerItemView {
  readonly itemId: string;
  readonly contentVersion: string;
  readonly representation: "concrete" | "numeric";
  readonly stimulus: Stimulus;
}

/** Builds a fresh, frozen view. Safe to use for every phase, including assessments. */
export function toLearnerView(problem: ValidatedProblem): LearnerItemView {
  const s = problem.spec;
  let stimulus: Stimulus;
  switch (s.type) {
    case "count":
      stimulus = { kind: "count-objects", objectCount: s.quantity };
      break;
    case "compose":
      stimulus = { kind: "combine", partA: s.partA, partB: s.partB };
      break;
    case "decompose":
      stimulus = {
        kind: "find-missing-part",
        total: s.total,
        knownPart: s.knownPart,
      };
      break;
    case "subtract-take-away":
    case "subtract-cross-ten":
      stimulus = { kind: "take-away", start: s.start, takeAway: s.takeAway };
      break;
  }
  return Object.freeze({
    itemId: problem.id,
    contentVersion: problem.contentVersion,
    representation: problem.presentation.representation,
    stimulus: Object.freeze(stimulus),
  });
}
