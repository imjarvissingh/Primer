import type { InstructionalSkillId, LearningPhase } from "../curriculum";

/**
 * One scored attempt, recorded for later persistence and reporting.
 * Skipped items are not recorded: a skip is not evidence of any kind.
 *
 * Whether the work was INDEPENDENT is derived, never stored, so it cannot be
 * set wrongly: see isIndependentEvidence().
 */
export interface EvidenceRecord {
  readonly curriculumVersion: string;
  readonly contentVersion: string;
  readonly skillId: InstructionalSkillId;
  readonly problemId: string;
  readonly phase: LearningPhase;
  readonly correct: boolean;
  /** Hints shown before this attempt. Must be 0 in any assessment phase. */
  readonly hintsUsed: number;
  /** Position in the learner's attempt history; larger means later. Unique per history. */
  readonly sequence: number;
  /** When the attempt happened, in milliseconds since the Unix epoch. */
  readonly occurredAtMs: number;
}

export type MasteryState =
  | "not-assessed"
  | "emerging"
  | "practicing"
  | "provisional-mastery"
  | "confirmed-after-delay";

/**
 * The rule for awarding mastery. No educator has approved any thresholds yet,
 * so the only policy that exists is the draft one, which has no numbers in it
 * and therefore cannot award mastery. An approved policy must carry its numbers.
 */
export type EvidencePolicy =
  | { readonly approval: "draft-unapproved" }
  | {
      readonly approval: "educator-approved";
      readonly approvedBy: string;
      readonly provisional: {
        /** Distinct unaided items answered correctly in the immediate independent check. Must be at least 2. */
        readonly minIndependentCorrect: number;
        readonly maxIndependentIncorrect: number;
      };
      readonly confirmed: {
        readonly minDelayedCorrect: number;
        readonly maxDelayedIncorrect: number;
        /** Whole days that must pass between the independent check and the delayed check. */
        readonly minDelayDays: number;
      };
    };

export interface SkillEvidenceSummary {
  readonly skillId: InstructionalSkillId;
  readonly state: MasteryState;
  readonly policyApproval: EvidencePolicy["approval"];
  readonly counts: {
    readonly practiceAttempts: number;
    readonly baselineCorrect: number;
    readonly independentCorrect: number;
    readonly independentIncorrect: number;
    readonly delayedCorrect: number;
    readonly delayedIncorrect: number;
  };
}
