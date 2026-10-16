import type { LearningPhase, ReviewStatus } from "../curriculum";
import type { ValidatedProblem } from "../math";

/**
 * One question bank per learning phase. A bank lists which items are ELIGIBLE
 * for a phase. Which items a learner has actually SEEN is a separate fact
 * (learner exposure) that belongs to evidence records, not to the bank.
 *
 * Banks hold no hint fields on purpose: hints are a tutoring concern and only
 * exist for guided practice (see src/domain/tutoring).
 */
export interface QuestionBank {
  readonly phase: LearningPhase;
  readonly curriculumVersion: string;
  readonly contentVersion: string;
  readonly reviewStatus: ReviewStatus;
  readonly items: readonly ValidatedProblem[];
}
