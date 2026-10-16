/** Learning phases. Each phase has exactly one question bank. */
export const LEARNING_PHASES = [
  "baseline",
  "guided-practice",
  "independent",
  "delayed",
] as const;
export type LearningPhase = (typeof LEARNING_PHASES)[number];

/** Phases where the learner works unaided and no hints exist. */
export const ASSESSMENT_PHASES = [
  "baseline",
  "independent",
  "delayed",
] as const;
export type AssessmentPhase = (typeof ASSESSMENT_PHASES)[number];

export function isAssessmentPhase(
  phase: LearningPhase,
): phase is AssessmentPhase {
  return (ASSESSMENT_PHASES as readonly string[]).includes(phase);
}

export const SKILL_IDS = ["S01", "S02", "S03", "S04", "S05"] as const;
export type SkillId = (typeof SKILL_IDS)[number];

/** Skills a child is taught. S05 is deliberately excluded: it is an assessment objective. */
export type InstructionalSkillId = Exclude<SkillId, "S05">;

/** "draft" content has not been reviewed by a qualified educator. */
export type ReviewStatus = "draft" | "educator-approved";

interface SkillBase {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly reviewStatus: ReviewStatus;
}

/** A skill that is taught. Prerequisites are tried in the order listed. */
export interface InstructionalSkill extends SkillBase {
  readonly kind: "instructional";
  readonly prerequisites: readonly string[];
}

/** Evidence goal. It is measured, not taught, and is never a prerequisite. */
export interface AssessmentObjective extends SkillBase {
  readonly kind: "assessment-objective";
  readonly assesses: readonly string[];
  readonly evidencePhases: readonly LearningPhase[];
}

export type SkillDefinition = InstructionalSkill | AssessmentObjective;

/** Raw, unvalidated curriculum data. Ids are plain strings so invalid data can be tested. */
export interface CurriculumDefinition {
  readonly curriculumVersion: string;
  readonly contentVersion: string;
  readonly skills: readonly SkillDefinition[];
}
