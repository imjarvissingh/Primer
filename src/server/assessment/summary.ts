import "server-only";
import { CURRICULUM } from "@/domain/curriculum";
import {
  DRAFT_EVIDENCE_POLICY,
  interpretSkillEvidence,
  type EvidenceRecord,
  type MasteryState,
} from "@/domain/evidence";
import type { AssessmentSummary } from "@/lib/assessment-protocol";
import type { AssessmentSession } from "./sessions";

const ORDER: readonly MasteryState[] = [
  "not-assessed",
  "emerging",
  "practicing",
  "provisional-mastery",
  "confirmed-after-delay",
];

/**
 * Builds the adult-facing summary from the SERVER's own record of what was
 * evaluated. Nothing here comes from the browser. Evidence records are made
 * from answered items only (skips are not evidence), always in the
 * "independent" phase with zero hints, and interpreted by the Phase 2
 * interpreter under the draft policy, which cannot award mastery.
 */
export function buildSummary(session: AssessmentSession): AssessmentSummary {
  if (session.status === "in-progress") {
    throw new Error("Summary requested before the check ended");
  }
  const { items, records } = session;

  const evidence: EvidenceRecord[] = [];
  records.forEach((rec, sequence) => {
    if (rec.outcome !== "answered" || rec.correct === null) return;
    const problem = items.find((p) => p.id === rec.problemId);
    if (
      problem === undefined ||
      problem.skillId === "S01" ||
      problem.skillId === "S02"
    ) {
      return;
    }
    evidence.push({
      curriculumVersion: problem.curriculumVersion,
      contentVersion: problem.contentVersion,
      skillId: problem.skillId,
      problemId: problem.id,
      phase: "independent",
      correct: rec.correct,
      hintsUsed: 0,
      sequence,
      occurredAtMs: rec.occurredAtMs,
    });
  });

  const titleOf = (id: string) =>
    CURRICULUM.skills.find((s) => s.id === id)?.title ?? id;
  const sampled = [...new Set(items.map((p) => p.skillId))];

  const skills = sampled.map((id) => {
    const interpreted = interpretSkillEvidence(
      id,
      evidence.filter((e) => e.skillId === id),
      DRAFT_EVIDENCE_POLICY,
    );
    const answered =
      interpreted.counts.independentCorrect +
      interpreted.counts.independentIncorrect;
    return {
      id,
      title: titleOf(id),
      answered,
      correct: interpreted.counts.independentCorrect,
      observation: answered === 0 ? "Not yet assessed" : "Needs more evidence",
      state: interpreted.state,
    };
  });
  const strongest = skills
    .map((s) => s.state)
    .reduce<MasteryState>(
      (a, b) => (ORDER.indexOf(b) > ORDER.indexOf(a) ? b : a),
      "not-assessed",
    );

  const outcomes = items.map((problem, i) => {
    const rec = records.find((r) => r.problemId === problem.id);
    const outcome =
      rec === undefined
        ? ("not-reached" as const)
        : rec.outcome === "skipped"
          ? ("skipped" as const)
          : rec.correct
            ? ("correct" as const)
            : ("incorrect" as const);
    const spec = problem.spec;
    const expression =
      spec.type === "subtract-take-away" || spec.type === "subtract-cross-ten"
        ? `${spec.start} − ${spec.takeAway}`
        : "";
    return {
      position: i + 1,
      expression,
      skill: titleOf(problem.skillId),
      outcome,
    };
  });
  const count = (o: string) => outcomes.filter((x) => x.outcome === o).length;

  return {
    ok: true,
    synthetic: true,
    status: session.status,
    counts: {
      total: items.length,
      answered: count("correct") + count("incorrect"),
      correct: count("correct"),
      skipped: count("skipped"),
      notReached: count("not-reached"),
    },
    items: outcomes,
    skills: skills.map((s) => ({
      id: s.id,
      title: s.title,
      answered: s.answered,
      correct: s.correct,
      observation: s.observation,
    })),
    mastery: {
      awarded: false,
      state: strongest,
      policy: DRAFT_EVIDENCE_POLICY.approval,
    },
    provenance: {
      phase: "independent",
      hintsUsed: 0,
      contentReview: "draft",
      curriculumVersion: CURRICULUM.curriculumVersion,
      contentVersion: CURRICULUM.contentVersion,
    },
  };
}
