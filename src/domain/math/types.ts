import type {
  InstructionalSkillId,
  LearningPhase,
  ReviewStatus,
} from "../curriculum";

/** Largest quantity any approved objective uses. */
export const MAX_QUANTITY = 20;

/**
 * The only problem shapes the engine understands. Each shape has fixed fields,
 * so there is no place to hide custom evaluator behaviour.
 */
export type ProblemSpec =
  /** "How many are shown?" The answer is the quantity. */
  | { readonly type: "count"; readonly quantity: number }
  /** "partA and partB make how many?" */
  | { readonly type: "compose"; readonly partA: number; readonly partB: number }
  /** "total is knownPart and how many more?" */
  | {
      readonly type: "decompose";
      readonly total: number;
      readonly knownPart: number;
    }
  /** "start, take away takeAway. How many are left?" */
  | {
      readonly type: "subtract-take-away";
      readonly start: number;
      readonly takeAway: number;
    }
  /** Like take-away, but start is 11–18 and the result is under ten. */
  | {
      readonly type: "subtract-cross-ten";
      readonly start: number;
      readonly takeAway: number;
    };

export type ProblemType = ProblemSpec["type"];

/** Meaning-only presentation hint. Themes decide how to draw it. */
export interface Presentation {
  readonly representation: "concrete" | "numeric";
}

/** A problem as authored, before validation. `answer` is the claimed answer key. */
export interface MathProblem {
  readonly id: string;
  readonly curriculumVersion: string;
  readonly contentVersion: string;
  readonly skillId: InstructionalSkillId;
  readonly eligibleBank: LearningPhase;
  readonly reviewStatus: ReviewStatus;
  readonly spec: ProblemSpec;
  readonly answer: number;
  readonly presentation: Presentation;
}

declare const validatedBrand: unique symbol;

/** A problem that passed validateProblem. Only that function can create one. */
export type ValidatedProblem = Readonly<MathProblem> & {
  readonly [validatedBrand]: true;
};

/** Which taught skill each problem type exercises. */
export const SKILL_FOR_TYPE: Readonly<
  Record<ProblemType, InstructionalSkillId>
> = {
  count: "S01",
  compose: "S02",
  decompose: "S02",
  "subtract-take-away": "S03",
  "subtract-cross-ten": "S04",
};
