import "server-only";
import { GUIDED_PRACTICE_BANK, toLearnerView } from "@/domain/assessment";
import { MAX_QUANTITY, type ValidatedProblem } from "@/domain/math";
import {
  PRACTICE_MISSION_ID,
  type PublicChallenge,
} from "@/lib/practice-protocol";

/**
 * The ONLY missions the demo API will run. Each maps to one fixed item in the
 * guided-practice bank. Callers pass a mission name, never an item id, so
 * assessment items (baseline / independent / delayed) cannot be reached.
 */
const MISSION_ITEM_IDS: Readonly<Record<string, string>> = Object.freeze({
  [PRACTICE_MISSION_ID]: "GP-07",
});

export interface Mission {
  /** SERVER-SIDE ONLY: contains the answer key. Never send it to a client. */
  readonly problem: ValidatedProblem;
  readonly challenge: PublicChallenge;
}

export function getMission(missionId: unknown): Mission | null {
  if (typeof missionId !== "string") return null;
  if (!Object.hasOwn(MISSION_ITEM_IDS, missionId)) return null;
  const itemId = MISSION_ITEM_IDS[missionId];

  const problem = GUIDED_PRACTICE_BANK.items.find((p) => p.id === itemId);
  if (problem === undefined || problem.spec.type !== "subtract-cross-ten") {
    throw new Error(`Mission ${missionId} is misconfigured`);
  }
  // toLearnerView is the domain's answer-free projection of the item.
  const { stimulus } = toLearnerView(problem);
  if (stimulus.kind !== "take-away") {
    throw new Error(`Mission ${missionId} is misconfigured`);
  }
  return {
    problem,
    challenge: {
      missionId: PRACTICE_MISSION_ID,
      start: stimulus.start,
      takeAway: stimulus.takeAway,
      maxAnswer: MAX_QUANTITY,
    },
  };
}
