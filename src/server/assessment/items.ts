import "server-only";
import { INDEPENDENT_BANK, toLearnerView } from "@/domain/assessment";
import { MAX_QUANTITY, type ValidatedProblem } from "@/domain/math";
import type { AssessmentQuestion } from "@/lib/assessment-protocol";

/**
 * The independent check uses the whole independent bank, in bank order (a
 * fixed, documented order: S03, S03, S04, S04). No client input chooses,
 * skips ahead to, or reorders items. Guided-practice, baseline and delayed
 * items are never touched.
 */
export function selectAssessmentItems(): readonly ValidatedProblem[] {
  const items = INDEPENDENT_BANK.items;
  if (
    INDEPENDENT_BANK.phase !== "independent" ||
    items.length === 0 ||
    items.some(
      (p) =>
        p.eligibleBank !== "independent" ||
        p.spec.type === "count" ||
        p.spec.type === "compose" ||
        p.spec.type === "decompose",
    )
  ) {
    throw new Error("Independent bank is misconfigured");
  }
  return items;
}

/** The answer-free view of one item. No item id, skill, bank or version. */
export function toQuestion(
  problem: ValidatedProblem,
  index: number,
  total: number,
): AssessmentQuestion {
  const { stimulus } = toLearnerView(problem);
  if (stimulus.kind !== "take-away") {
    throw new Error("Independent bank is misconfigured");
  }
  return {
    position: index + 1,
    total,
    start: stimulus.start,
    takeAway: stimulus.takeAway,
    maxAnswer: MAX_QUANTITY,
  };
}
