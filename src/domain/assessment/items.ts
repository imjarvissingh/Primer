import { CONTENT_VERSION, CURRICULUM_VERSION } from "../curriculum";
import type { InstructionalSkillId, LearningPhase } from "../curriculum";
import {
  assertValidProblem,
  type ProblemSpec,
  type ValidatedProblem,
} from "../math";
import { deepFreeze } from "../shared/validation";
import type { QuestionBank } from "./types";

/**
 * DRAFT CONTENT: every item below is an unreviewed placeholder written for the
 * engineering phase. No qualified educator has approved any of it. The answers
 * are written out by hand on purpose: validation re-computes each one.
 */
function item(
  id: string,
  phase: LearningPhase,
  skillId: InstructionalSkillId,
  spec: ProblemSpec,
  answer: number,
): ValidatedProblem {
  return assertValidProblem({
    id,
    curriculumVersion: CURRICULUM_VERSION,
    contentVersion: CONTENT_VERSION,
    skillId,
    eligibleBank: phase,
    reviewStatus: "draft",
    spec,
    answer,
    presentation: {
      representation: spec.type === "count" ? "concrete" : "numeric",
    },
  });
}

function bank(phase: LearningPhase, items: ValidatedProblem[]): QuestionBank {
  return deepFreeze({
    phase,
    curriculumVersion: CURRICULUM_VERSION,
    contentVersion: CONTENT_VERSION,
    reviewStatus: "draft",
    items,
  });
}

/** Eight items, two per taught skill. */
export const BASELINE_BANK = bank("baseline", [
  item("BL-01", "baseline", "S01", { type: "count", quantity: 6 }, 6),
  item("BL-02", "baseline", "S01", { type: "count", quantity: 14 }, 14),
  item("BL-03", "baseline", "S02", { type: "compose", partA: 3, partB: 5 }, 8),
  item(
    "BL-04",
    "baseline",
    "S02",
    { type: "decompose", total: 9, knownPart: 4 },
    5,
  ),
  item(
    "BL-05",
    "baseline",
    "S03",
    { type: "subtract-take-away", start: 8, takeAway: 3 },
    5,
  ),
  item(
    "BL-06",
    "baseline",
    "S03",
    { type: "subtract-take-away", start: 15, takeAway: 4 },
    11,
  ),
  item(
    "BL-07",
    "baseline",
    "S04",
    { type: "subtract-cross-ten", start: 12, takeAway: 7 },
    5,
  ),
  item(
    "BL-08",
    "baseline",
    "S04",
    { type: "subtract-cross-ten", start: 15, takeAway: 8 },
    7,
  ),
]);

/** Eight items. Includes the "Broken Bridge" example from docs/CURRICULUM.md (13 − 5). */
export const GUIDED_PRACTICE_BANK = bank("guided-practice", [
  item("GP-01", "guided-practice", "S01", { type: "count", quantity: 9 }, 9),
  item("GP-02", "guided-practice", "S01", { type: "count", quantity: 17 }, 17),
  item(
    "GP-03",
    "guided-practice",
    "S02",
    { type: "compose", partA: 6, partB: 7 },
    13,
  ),
  item(
    "GP-04",
    "guided-practice",
    "S02",
    { type: "decompose", total: 15, knownPart: 8 },
    7,
  ),
  item(
    "GP-05",
    "guided-practice",
    "S03",
    { type: "subtract-take-away", start: 10, takeAway: 6 },
    4,
  ),
  item(
    "GP-06",
    "guided-practice",
    "S03",
    { type: "subtract-take-away", start: 17, takeAway: 3 },
    14,
  ),
  item(
    "GP-07",
    "guided-practice",
    "S04",
    { type: "subtract-cross-ten", start: 13, takeAway: 5 },
    8,
  ),
  item(
    "GP-08",
    "guided-practice",
    "S04",
    { type: "subtract-cross-ten", start: 16, takeAway: 7 },
    9,
  ),
]);

/** Four unseen items for the immediate independent check (assessment objective S05). */
export const INDEPENDENT_BANK = bank("independent", [
  item(
    "IN-01",
    "independent",
    "S03",
    { type: "subtract-take-away", start: 16, takeAway: 5 },
    11,
  ),
  item(
    "IN-02",
    "independent",
    "S03",
    { type: "subtract-take-away", start: 19, takeAway: 7 },
    12,
  ),
  item(
    "IN-03",
    "independent",
    "S04",
    { type: "subtract-cross-ten", start: 14, takeAway: 6 },
    8,
  ),
  item(
    "IN-04",
    "independent",
    "S04",
    { type: "subtract-cross-ten", start: 17, takeAway: 9 },
    8,
  ),
]);

/** Four items reserved for the delayed check. Never reuse them earlier. */
export const DELAYED_BANK = bank("delayed", [
  item(
    "DL-01",
    "delayed",
    "S03",
    { type: "subtract-take-away", start: 18, takeAway: 6 },
    12,
  ),
  item(
    "DL-02",
    "delayed",
    "S03",
    { type: "subtract-take-away", start: 14, takeAway: 3 },
    11,
  ),
  item(
    "DL-03",
    "delayed",
    "S04",
    { type: "subtract-cross-ten", start: 12, takeAway: 4 },
    8,
  ),
  item(
    "DL-04",
    "delayed",
    "S04",
    { type: "subtract-cross-ten", start: 18, takeAway: 9 },
    9,
  ),
]);

export const ALL_BANKS: readonly QuestionBank[] = [
  BASELINE_BANK,
  GUIDED_PRACTICE_BANK,
  INDEPENDENT_BANK,
  DELAYED_BANK,
];
