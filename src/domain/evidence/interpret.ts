import {
  CURRICULUM,
  LEARNING_PHASES,
  getAssessmentObjectives,
  isAssessmentPhase,
  type InstructionalSkillId,
} from "../curriculum";
import {
  formatIssues,
  type ValidationIssue,
  type ValidationResult,
} from "../shared/validation";
import type {
  EvidencePolicy,
  EvidenceRecord,
  MasteryState,
  SkillEvidenceSummary,
} from "./types";

export const DRAFT_EVIDENCE_POLICY: EvidencePolicy = Object.freeze({
  approval: "draft-unapproved",
});

const DAY_MS = 24 * 60 * 60 * 1000;

export class InvalidEvidenceError extends Error {
  readonly issues: readonly ValidationIssue[];
  constructor(issues: readonly ValidationIssue[]) {
    super(`Invalid evidence: ${formatIssues(issues)}`);
    this.name = "InvalidEvidenceError";
    this.issues = issues;
  }
}

/** Unaided work: an assessment phase, with no hint. Practice is never independent. */
export function isIndependentEvidence(record: EvidenceRecord): boolean {
  return isAssessmentPhase(record.phase) && record.hintsUsed === 0;
}

export function validateEvidenceRecord(
  input: unknown,
): ValidationResult<EvidenceRecord> {
  const issues: ValidationIssue[] = [];
  const add = (code: string, message: string) => issues.push({ code, message });
  if (typeof input !== "object" || input === null) {
    return {
      ok: false,
      issues: [{ code: "malformed", message: "Record must be an object" }],
    };
  }
  const r = input as Record<string, unknown>;
  const count = (v: unknown): v is number =>
    Number.isSafeInteger(v) && (v as number) >= 0;

  const skill = CURRICULUM.skills.find((s) => s.id === r.skillId);
  if (!skill || skill.kind !== "instructional")
    add("bad-skill", "skillId must be a taught skill");
  if (!(LEARNING_PHASES as readonly unknown[]).includes(r.phase))
    add("bad-phase", "Unknown phase");
  if (typeof r.problemId !== "string" || !r.problemId.trim())
    add("bad-problem-id", "problemId is required");
  if (typeof r.curriculumVersion !== "string" || !r.curriculumVersion.trim()) {
    add("missing-version", "curriculumVersion is required");
  }
  if (typeof r.contentVersion !== "string" || !r.contentVersion.trim()) {
    add("missing-version", "contentVersion is required");
  }
  if (typeof r.correct !== "boolean")
    add("bad-correct", "correct must be a boolean");
  if (!count(r.hintsUsed))
    add("bad-hints", "hintsUsed must be a whole number, 0 or more");
  if (!count(r.sequence))
    add("bad-sequence", "sequence must be a whole number, 0 or more");
  if (!count(r.occurredAtMs))
    add("bad-time", "occurredAtMs must be a whole number of milliseconds");
  if (
    typeof r.phase === "string" &&
    isAssessmentPhase(r.phase as never) &&
    r.hintsUsed !== 0
  ) {
    add("hint-in-assessment", "Assessment attempts cannot have hints");
  }
  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, value: input as EvidenceRecord };
}

/** Rejects policies that could award mastery too easily. */
export function assertPolicyIsSafe(policy: EvidencePolicy): void {
  if (policy.approval === "draft-unapproved") return;
  const { provisional: p, confirmed: c } = policy;
  const problems: string[] = [];
  if (!policy.approvedBy.trim()) problems.push("approvedBy is required");
  if (
    !Number.isSafeInteger(p.minIndependentCorrect) ||
    p.minIndependentCorrect < 2
  ) {
    problems.push(
      "provisional mastery needs at least 2 correct independent items",
    );
  }
  if (!Number.isSafeInteger(c.minDelayedCorrect) || c.minDelayedCorrect < 1) {
    problems.push("confirmation needs at least 1 correct delayed item");
  }
  if (!Number.isSafeInteger(c.minDelayDays) || c.minDelayDays < 1) {
    problems.push("confirmation needs a delay of at least 1 day");
  }
  for (const n of [p.maxIndependentIncorrect, c.maxDelayedIncorrect]) {
    if (!Number.isSafeInteger(n) || n < 0)
      problems.push("incorrect limits must be whole numbers, 0 or more");
  }
  if (problems.length > 0)
    throw new Error(`Unsafe evidence policy: ${problems.join("; ")}`);
}

/** True only if an assessment objective (S05) measures this skill. */
function isMasteryEligible(skillId: InstructionalSkillId): boolean {
  return getAssessmentObjectives(CURRICULUM).some((o) =>
    o.assesses.includes(skillId),
  );
}

/**
 * Turns one skill's attempt history into a conservative state.
 *
 * Under the draft policy the result is never above "practicing"/"emerging".
 * Mastery needs: an approved policy, a skill that S05 assesses, enough DISTINCT
 * unaided items in the immediate independent check, and, for confirmation, a
 * later unaided delayed check after the required delay. Hints, repeated
 * practice, a single answer and time spent can never produce it.
 */
export function interpretSkillEvidence(
  skillId: InstructionalSkillId,
  records: readonly EvidenceRecord[],
  policy: EvidencePolicy = DRAFT_EVIDENCE_POLICY,
): SkillEvidenceSummary {
  assertPolicyIsSafe(policy);

  const issues: ValidationIssue[] = [];
  const sequences = new Set<number>();
  for (const record of records) {
    const result = validateEvidenceRecord(record);
    if (!result.ok) issues.push(...result.issues);
    if (sequences.has(record.sequence)) {
      issues.push({
        code: "duplicate-sequence",
        message: `Sequence ${record.sequence} appears twice`,
      });
    }
    sequences.add(record.sequence);
  }
  if (issues.length > 0) throw new InvalidEvidenceError(issues);

  // Only this skill, this curriculum version, in order; the first attempt per item counts.
  const seenItems = new Set<string>();
  const relevant = [...records]
    .filter(
      (r) =>
        r.skillId === skillId &&
        r.curriculumVersion === CURRICULUM.curriculumVersion,
    )
    .sort((a, b) => a.sequence - b.sequence)
    .filter((r) => {
      if (r.phase === "guided-practice") return true; // practice repeats are fine; they prove nothing
      const key = `${r.phase}:${r.problemId}`;
      if (seenItems.has(key)) return false;
      seenItems.add(key);
      return true;
    });

  const independent = relevant.filter(
    (r) => r.phase === "independent" && isIndependentEvidence(r),
  );
  const delayed = relevant.filter(
    (r) => r.phase === "delayed" && isIndependentEvidence(r),
  );
  const tally = (list: readonly EvidenceRecord[]) => ({
    right: list.filter((r) => r.correct).length,
    wrong: list.filter((r) => !r.correct).length,
  });
  const ind = tally(independent);
  const del = tally(delayed);
  const practiceAttempts = relevant.filter(
    (r) => r.phase === "guided-practice",
  ).length;
  const baselineCorrect = relevant.filter(
    (r) => r.phase === "baseline" && r.correct,
  ).length;

  let state: MasteryState;
  if (relevant.length === 0) state = "not-assessed";
  else if (practiceAttempts > 0) state = "practicing";
  else state = "emerging";

  if (policy.approval === "educator-approved" && isMasteryEligible(skillId)) {
    const { provisional, confirmed } = policy;
    const provisionalMet =
      ind.right >= provisional.minIndependentCorrect &&
      ind.wrong <= provisional.maxIndependentIncorrect;
    if (provisionalMet) {
      state = "provisional-mastery";
      const lastIndependent = independent[independent.length - 1];
      const followUp = delayed.filter(
        (r) =>
          r.sequence > lastIndependent.sequence &&
          r.occurredAtMs - lastIndependent.occurredAtMs >=
            confirmed.minDelayDays * DAY_MS,
      );
      const f = tally(followUp);
      if (
        f.right >= confirmed.minDelayedCorrect &&
        f.wrong <= confirmed.maxDelayedIncorrect
      ) {
        state = "confirmed-after-delay";
      }
    }
  }

  return {
    skillId,
    state,
    policyApproval: policy.approval,
    counts: {
      practiceAttempts,
      baselineCorrect,
      independentCorrect: ind.right,
      independentIncorrect: ind.wrong,
      delayedCorrect: del.right,
      delayedIncorrect: del.wrong,
    },
  };
}
