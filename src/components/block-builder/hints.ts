import type { MakeTenHintSteps } from "@/lib/practice-protocol";

/**
 * DRAFT instructional presentations for the controlled hint ids the tutoring
 * policy hands out. The ids are decided by the server; this file only decides
 * how a given id looks and reads. The wording is unreviewed by an educator.
 */
export interface HintPresentation {
  text: string;
  /** Blocks numbered above this value are visually outlined, as a cue. */
  highlightAbove: number | null;
}

export function presentHint(
  hintId: string,
  steps: MakeTenHintSteps | null,
  start: number,
): HintPresentation {
  if (steps !== null) {
    const extrasFrom = start - steps.takeToTen;
    if (hintId === "hint.make-ten.fill-to-ten") {
      return {
        text: `Try this: take ${steps.takeToTen} blocks first. Then the pile is a full ten. The outlined blocks are those ${steps.takeToTen}.`,
        highlightAbove: extrasFrom,
      };
    }
    if (hintId === "hint.make-ten.take-rest-from-ten") {
      return {
        text: `You took ${steps.takeToTen} to make a full ten. You still need to take ${steps.takeFromTen} more from the ten. How many are left?`,
        highlightAbove: extrasFrom,
      };
    }
  }
  return {
    text: "Take another look at the blocks. Count the ones still in the pile.",
    highlightAbove: null,
  };
}
