import type { MakeTenHintSteps } from "@/lib/practice-protocol";
import { countOf, type ThemeVocabulary } from "@/themes";

/**
 * DRAFT instructional presentations for the controlled hint ids the tutoring
 * policy hands out. The ids and step numbers come from the server; one shared
 * template per id lives here, and a theme only supplies nouns. The wording is
 * unreviewed by an educator.
 */
export interface HintPresentation {
  text: string;
  /** Items numbered above this value are visually outlined, as a cue. */
  highlightAbove: number | null;
}

export function presentHint(
  hintId: string,
  steps: MakeTenHintSteps | null,
  start: number,
  vocab: ThemeVocabulary,
): HintPresentation {
  if (steps !== null) {
    const extrasFrom = start - steps.takeToTen;
    if (hintId === "hint.make-ten.fill-to-ten") {
      return {
        text: `Try this: take ${countOf(steps.takeToTen, vocab)} first. Then the ${vocab.supplyNoun} is a full ten. The outlined ${vocab.plural} are those ${steps.takeToTen}.`,
        highlightAbove: extrasFrom,
      };
    }
    if (hintId === "hint.make-ten.take-rest-from-ten") {
      return {
        text: `You took ${countOf(steps.takeToTen, vocab)} to make a full ten. You still need to take ${steps.takeFromTen} more from the ten. How many are left?`,
        highlightAbove: extrasFrom,
      };
    }
  }
  return {
    text: `Take another look at the ${vocab.plural}. Count the ones still ${vocab.supplyPlace}.`,
    highlightAbove: null,
  };
}
