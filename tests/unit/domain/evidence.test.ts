import { describe, expect, it } from "vitest";
import {
  CONTENT_VERSION,
  CURRICULUM_VERSION,
  type LearningPhase,
} from "@/domain/curriculum";
import {
  DRAFT_EVIDENCE_POLICY,
  InvalidEvidenceError,
  interpretSkillEvidence,
  isIndependentEvidence,
  validateEvidenceRecord,
  type EvidencePolicy,
  type EvidenceRecord,
} from "@/domain/evidence";

const DAY = 24 * 60 * 60 * 1000;
let seq = 0;

function rec(
  patch: Partial<EvidenceRecord> & { phase: LearningPhase },
): EvidenceRecord {
  seq += 1;
  return {
    curriculumVersion: CURRICULUM_VERSION,
    contentVersion: CONTENT_VERSION,
    skillId: "S03",
    problemId: `P-${seq}`,
    correct: true,
    hintsUsed: 0,
    sequence: seq,
    occurredAtMs: 1_000_000 + seq,
    ...patch,
  };
}

/**
 * TEST-ONLY policy. These numbers are made up to exercise the logic; they are not
 * educator-approved thresholds and must never be copied into product code.
 */
const TEST_POLICY: EvidencePolicy = {
  approval: "educator-approved",
  approvedBy: "test-fixture",
  provisional: { minIndependentCorrect: 3, maxIndependentIncorrect: 0 },
  confirmed: { minDelayedCorrect: 2, maxDelayedIncorrect: 0, minDelayDays: 7 },
};

const independentRight = (n: number) =>
  Array.from({ length: n }, () => rec({ phase: "independent" }));

describe("the draft policy cannot award mastery", () => {
  it("returns not-assessed for no evidence", () => {
    expect(interpretSkillEvidence("S03", []).state).toBe("not-assessed");
  });

  it("returns emerging for assessment-only evidence, however good", () => {
    const records = [rec({ phase: "baseline" }), ...independentRight(10)];
    const summary = interpretSkillEvidence("S03", records);
    expect(summary.state).toBe("emerging");
    expect(summary.policyApproval).toBe("draft-unapproved");
    expect(summary.counts.independentCorrect).toBe(10);
  });

  it("returns practicing once guided practice has happened", () => {
    expect(
      interpretSkillEvidence("S03", [rec({ phase: "guided-practice" })]).state,
    ).toBe("practicing");
  });

  it("never reaches provisional or confirmed, even with perfect independent and delayed work", () => {
    const records = [
      ...independentRight(20),
      rec({ phase: "delayed", occurredAtMs: 1_000_000 + 400 * DAY }),
      rec({ phase: "delayed", occurredAtMs: 1_000_000 + 401 * DAY }),
    ];
    const state = interpretSkillEvidence(
      "S03",
      records,
      DRAFT_EVIDENCE_POLICY,
    ).state;
    expect(["provisional-mastery", "confirmed-after-delay"]).not.toContain(
      state,
    );
  });
});

describe("with an approved policy (test numbers)", () => {
  it("awards provisional mastery for enough distinct, unaided, correct independent items", () => {
    const summary = interpretSkillEvidence(
      "S03",
      independentRight(3),
      TEST_POLICY,
    );
    expect(summary.state).toBe("provisional-mastery");
  });

  it("does not award it for too few items, including a single correct answer", () => {
    expect(
      interpretSkillEvidence("S03", independentRight(1), TEST_POLICY).state,
    ).toBe("emerging");
    expect(
      interpretSkillEvidence("S03", independentRight(2), TEST_POLICY).state,
    ).toBe("emerging");
  });

  it("does not award it when too many independent answers are wrong", () => {
    const records = [
      ...independentRight(3),
      rec({ phase: "independent", correct: false }),
    ];
    expect(interpretSkillEvidence("S03", records, TEST_POLICY).state).toBe(
      "emerging",
    );
  });

  it("ignores repeated attempts at the same item, so retakes cannot inflate evidence", () => {
    const same = Array.from({ length: 6 }, () =>
      rec({ phase: "independent", problemId: "IN-01" }),
    );
    expect(interpretSkillEvidence("S03", same, TEST_POLICY).state).toBe(
      "emerging",
    );
  });

  it("does not count guided practice, hint-assisted or not, toward independent evidence", () => {
    const records = [
      ...Array.from({ length: 30 }, () => rec({ phase: "guided-practice" })),
      ...Array.from({ length: 30 }, () =>
        rec({ phase: "guided-practice", hintsUsed: 2 }),
      ),
    ];
    const summary = interpretSkillEvidence("S03", records, TEST_POLICY);
    expect(summary.state).toBe("practicing");
    expect(summary.counts.independentCorrect).toBe(0);
  });

  it("does not count baseline or delayed items as the immediate independent check", () => {
    const records = [
      ...Array.from({ length: 5 }, () => rec({ phase: "baseline" })),
      ...Array.from({ length: 5 }, () => rec({ phase: "delayed" })),
    ];
    expect(interpretSkillEvidence("S03", records, TEST_POLICY).state).toBe(
      "emerging",
    );
  });

  it("confirms only after enough unaided delayed items, later in order and after the delay", () => {
    const base = independentRight(3);
    const last = base[base.length - 1];
    const delayedAfter = (days: number, n: number) =>
      Array.from({ length: n }, () =>
        rec({ phase: "delayed", occurredAtMs: last.occurredAtMs + days * DAY }),
      );
    expect(
      interpretSkillEvidence(
        "S03",
        [...base, ...delayedAfter(7, 2)],
        TEST_POLICY,
      ).state,
    ).toBe("confirmed-after-delay");
    // Too early.
    expect(
      interpretSkillEvidence(
        "S03",
        [...base, ...delayedAfter(6, 2)],
        TEST_POLICY,
      ).state,
    ).toBe("provisional-mastery");
    // Too few.
    expect(
      interpretSkillEvidence(
        "S03",
        [...base, ...delayedAfter(10, 1)],
        TEST_POLICY,
      ).state,
    ).toBe("provisional-mastery");
  });

  it("does not count delayed work that comes earlier in the attempt order", () => {
    // Late timestamps but earlier sequence numbers: only the ordering rule can reject them.
    const early = Array.from({ length: 2 }, () =>
      rec({ phase: "delayed", occurredAtMs: 1_000_000 + 30 * DAY }),
    );
    const state = interpretSkillEvidence(
      "S03",
      [...early, ...independentRight(3)],
      TEST_POLICY,
    ).state;
    expect(state).toBe("provisional-mastery");
  });

  it("does not confirm when a delayed item is wrong", () => {
    const base = independentRight(3);
    const t = base[2].occurredAtMs + 8 * DAY;
    const records = [
      ...base,
      rec({ phase: "delayed", occurredAtMs: t }),
      rec({ phase: "delayed", occurredAtMs: t }),
      rec({ phase: "delayed", occurredAtMs: t, correct: false }),
    ];
    expect(interpretSkillEvidence("S03", records, TEST_POLICY).state).toBe(
      "provisional-mastery",
    );
  });

  it("never awards mastery for skills that S05 does not assess", () => {
    const records = independentRight(5).map((r) => ({
      ...r,
      skillId: "S01" as const,
    }));
    expect(interpretSkillEvidence("S01", records, TEST_POLICY).state).toBe(
      "emerging",
    );
  });

  it("only looks at the requested skill and curriculum version", () => {
    const other = independentRight(5).map((r) => ({
      ...r,
      skillId: "S04" as const,
    }));
    const old = independentRight(5).map((r) => ({
      ...r,
      curriculumVersion: "curriculum-old",
    }));
    expect(
      interpretSkillEvidence("S03", [...other, ...old], TEST_POLICY).state,
    ).toBe("not-assessed");
  });
});

describe("unsafe policies are rejected", () => {
  const withProvisional = (min: number): EvidencePolicy => ({
    ...(TEST_POLICY as Extract<
      EvidencePolicy,
      { approval: "educator-approved" }
    >),
    provisional: { minIndependentCorrect: min, maxIndependentIncorrect: 0 },
  });

  it("refuses a policy that would let one correct answer count as mastery", () => {
    expect(() => interpretSkillEvidence("S03", [], withProvisional(1))).toThrow(
      /at least 2/,
    );
  });

  it("refuses a policy with no delay or no approver", () => {
    const base = TEST_POLICY as Extract<
      EvidencePolicy,
      { approval: "educator-approved" }
    >;
    expect(() =>
      interpretSkillEvidence("S03", [], {
        ...base,
        confirmed: { ...base.confirmed, minDelayDays: 0 },
      }),
    ).toThrow(/delay/);
    expect(() =>
      interpretSkillEvidence("S03", [], { ...base, approvedBy: " " }),
    ).toThrow(/approvedBy/);
  });
});

describe("evidence records", () => {
  it("treats only unaided assessment work as independent", () => {
    expect(isIndependentEvidence(rec({ phase: "independent" }))).toBe(true);
    expect(isIndependentEvidence(rec({ phase: "baseline" }))).toBe(true);
    expect(isIndependentEvidence(rec({ phase: "delayed" }))).toBe(true);
    expect(isIndependentEvidence(rec({ phase: "guided-practice" }))).toBe(
      false,
    );
    expect(
      isIndependentEvidence(rec({ phase: "guided-practice", hintsUsed: 0 })),
    ).toBe(false);
  });

  it("keeps practice and assessment provenance separate in the summary", () => {
    const summary = interpretSkillEvidence("S03", [
      rec({ phase: "guided-practice" }),
      rec({ phase: "independent" }),
    ]);
    expect(summary.counts.practiceAttempts).toBe(1);
    expect(summary.counts.independentCorrect).toBe(1);
  });

  it("rejects an assessment record that claims a hint was used", () => {
    const result = validateEvidenceRecord(
      rec({ phase: "independent", hintsUsed: 1 }),
    );
    expect(result.ok).toBe(false);
    expect(() =>
      interpretSkillEvidence("S03", [rec({ phase: "delayed", hintsUsed: 1 })]),
    ).toThrow(InvalidEvidenceError);
  });

  it.each<[string, unknown]>([
    ["non-object", "record"],
    ["unknown skill", { ...rec({ phase: "independent" }), skillId: "S99" }],
    ["S05 as a skill", { ...rec({ phase: "independent" }), skillId: "S05" }],
    ["unknown phase", { ...rec({ phase: "independent" }), phase: "exam" }],
    [
      "fractional hints",
      { ...rec({ phase: "guided-practice" }), hintsUsed: 0.5 },
    ],
    ["negative sequence", { ...rec({ phase: "independent" }), sequence: -1 }],
    [
      "non-boolean correct",
      { ...rec({ phase: "independent" }), correct: "yes" },
    ],
    [
      "missing version",
      { ...rec({ phase: "independent" }), contentVersion: "" },
    ],
  ])("rejects %s", (_n, input) => {
    expect(validateEvidenceRecord(input).ok).toBe(false);
  });

  it("rejects duplicate sequence numbers", () => {
    const a = rec({ phase: "independent" });
    expect(() =>
      interpretSkillEvidence("S03", [a, { ...a, problemId: "other" }]),
    ).toThrow(/Sequence/);
  });

  it("does not modify its input and is repeatable", () => {
    const records = Object.freeze(
      independentRight(3).map((r) => Object.freeze(r)),
    );
    const first = interpretSkillEvidence("S03", records, TEST_POLICY);
    expect(interpretSkillEvidence("S03", records, TEST_POLICY)).toEqual(first);
  });
});
