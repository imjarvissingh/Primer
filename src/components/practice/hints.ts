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
        text: `Let's look at the same subtraction another way. One way to start is to take ${countOf(steps.takeToTen, vocab)}, so the ${vocab.supplyNoun} makes a full ten. The outlined ${vocab.plural} show those ${steps.takeToTen}. This is a picture of the idea, not what you moved.`,
        highlightAbove: extrasFrom,
      };
    }
    if (
      hintId === "hint.make-ten.take-rest-from-ten" &&
      steps.takeFromTen !== null
    ) {
      return {
        text: `Another way to see the same subtraction: take ${countOf(steps.takeToTen, vocab)} to make a full ten, then ${steps.takeFromTen} more from the ten. That is the same ${steps.takeToTen + steps.takeFromTen} you are taking away. How many are left?`,
        highlightAbove: extrasFrom,
      };
    }
  }
  if (hintId === "hint.take-away.cover-the-taken") {
    return {
      text: `Cover the ${vocab.plural} you take away. Then look at the ones that are not covered.`,
      highlightAbove: null,
    };
  }
  if (hintId === "hint.take-away.count-what-is-left") {
    return {
      text: `Count the ${vocab.plural} that are not covered. That is how many are left.`,
      highlightAbove: null,
    };
  }
  return {
    text: `Take another look at the ${vocab.plural}. Count the ones still ${vocab.supplyPlace}.`,
    highlightAbove: null,
  };
}
