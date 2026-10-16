import { MAX_QUANTITY, type ProblemType, type ValidatedProblem } from "./types";
import { computeAnswer } from "./problem";
import type { InstructionalSkillId } from "../curriculum";

/**
 * LEARNER RESPONSE FORMAT: a bare JavaScript number that is a whole number from
 * 0 to 20. Anything else (strings such as "5", decimals, negatives, null,
 * undefined, NaN) is "invalid". We never convert one type into another.
 */
export type InvalidReason =
  "missing" | "wrong-type" | "not-finite" | "not-whole-number" | "out-of-range";

/** Extra facts for later tutoring logic. Contains no theme information. */
export interface MakeTenSteps {
  readonly kind: "make-ten";
  /** How many to take away to reach ten. */
  readonly takeToTen: number;
  /** How many still to take away from ten. */
  readonly takeFromTen: number;
}

interface Scored {
  readonly problemId: string;
  readonly skillId: InstructionalSkillId;
  readonly problemType: ProblemType;
  /** SERVER-SIDE ONLY. Never send an EvaluationResult to a client during an assessment. */
  readonly expectedAnswer: number;
  readonly strategy?: MakeTenSteps;
}

export type EvaluationResult =
  | ({ readonly status: "correct" } & Scored)
  | ({ readonly status: "incorrect" } & Scored)
  | {
      readonly status: "invalid";
      readonly problemId: string;
      readonly reason: InvalidReason;
    };

/** The only part of a result the tutoring policy sees: it carries no answer. */
export type AttemptOutcome = EvaluationResult["status"];

export function classifyResponse(response: unknown): InvalidReason | null {
  if (response === undefined || response === null) return "missing";
  if (typeof response !== "number") return "wrong-type";
  if (!Number.isFinite(response)) return "not-finite";
  if (!Number.isInteger(response)) return "not-whole-number";
  if (response < 0 || response > MAX_QUANTITY) return "out-of-range";
  return null;
}

export function evaluateResponse(
  problem: ValidatedProblem,
  response: unknown,
): EvaluationResult {
  const reason = classifyResponse(response);
  if (reason !== null)
    return { status: "invalid", problemId: problem.id, reason };

  // Recompute from the parameters; the stored key was already checked at validation.
  const expectedAnswer = computeAnswer(problem.spec);
  const scored: Scored = {
    problemId: problem.id,
    skillId: problem.skillId,
    problemType: problem.spec.type,
    expectedAnswer,
    ...(problem.spec.type === "subtract-cross-ten" && {
      strategy: makeTenSteps(problem.spec.start, problem.spec.takeAway),
    }),
  };
  return {
    status: response === expectedAnswer ? "correct" : "incorrect",
    ...scored,
  };
}

function makeTenSteps(start: number, takeAway: number): MakeTenSteps {
  const takeToTen = start - 10;
  return { kind: "make-ten", takeToTen, takeFromTen: takeAway - takeToTen };
}
