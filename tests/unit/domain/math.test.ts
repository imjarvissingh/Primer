import { describe, expect, it } from "vitest";
import { CONTENT_VERSION, CURRICULUM_VERSION } from "@/domain/curriculum";
import {
  assertValidProblem,
  evaluateResponse,
  ProblemValidationError,
  validateProblem,
  type ProblemSpec,
} from "@/domain/math";

function raw(
  spec: ProblemSpec,
  skillId: string,
  answer: number,
  extra: object = {},
) {
  return {
    id: "T-1",
    curriculumVersion: CURRICULUM_VERSION,
    contentVersion: CONTENT_VERSION,
    skillId,
    eligibleBank: "independent",
    reviewStatus: "draft",
    spec,
    answer,
    presentation: { representation: "concrete" },
    ...extra,
  };
}

const problem = (spec: ProblemSpec, skillId: string, answer: number) =>
  assertValidProblem(raw(spec, skillId, answer));

const issueCodes = (input: unknown) => {
  const result = validateProblem(input);
  return result.ok ? [] : result.issues.map((i) => i.code);
};

describe("problem validation: accepted boundaries", () => {
  it.each<[string, ProblemSpec, string, number]>([
    ["count zero", { type: "count", quantity: 0 }, "S01", 0],
    ["count upper bound", { type: "count", quantity: 20 }, "S01", 20],
    ["compose to 20", { type: "compose", partA: 10, partB: 10 }, "S02", 20],
    ["compose with zero", { type: "compose", partA: 0, partB: 0 }, "S02", 0],
    [
      "decompose whole",
      { type: "decompose", total: 20, knownPart: 20 },
      "S02",
      0,
    ],
    [
      "decompose no known part",
      { type: "decompose", total: 15, knownPart: 0 },
      "S02",
      15,
    ],
    [
      "take away to zero",
      { type: "subtract-take-away", start: 7, takeAway: 7 },
      "S03",
      0,
    ],
    [
      "take away from 20",
      { type: "subtract-take-away", start: 20, takeAway: 0 },
      "S03",
      20,
    ],
    [
      "lowest crossing",
      { type: "subtract-cross-ten", start: 11, takeAway: 2 },
      "S04",
      9,
    ],
    [
      "highest crossing",
      { type: "subtract-cross-ten", start: 18, takeAway: 9 },
      "S04",
      9,
    ],
    [
      "crossing to a low result",
      { type: "subtract-cross-ten", start: 11, takeAway: 9 },
      "S04",
      2,
    ],
  ])("%s", (_name, spec, skill, answer) => {
    expect(validateProblem(raw(spec, skill, answer)).ok).toBe(true);
  });
});

describe("problem validation: rejections", () => {
  it.each<[string, ProblemSpec, string]>([
    ["count above 20", { type: "count", quantity: 21 }, "S01"],
    ["negative count", { type: "count", quantity: -1 }, "S01"],
    ["decimal count", { type: "count", quantity: 2.5 }, "S01"],
    ["NaN count", { type: "count", quantity: NaN }, "S01"],
    ["Infinity count", { type: "count", quantity: Infinity }, "S01"],
    ["compose over 20", { type: "compose", partA: 15, partB: 6 }, "S02"],
    [
      "decompose known part above total",
      { type: "decompose", total: 5, knownPart: 6 },
      "S02",
    ],
    [
      "take away more than start",
      { type: "subtract-take-away", start: 4, takeAway: 5 },
      "S03",
    ],
    [
      "start above 20",
      { type: "subtract-take-away", start: 21, takeAway: 1 },
      "S03",
    ],
    [
      "cross-ten that does not cross",
      { type: "subtract-cross-ten", start: 15, takeAway: 5 },
      "S04",
    ],
    [
      "cross-ten from 19",
      { type: "subtract-cross-ten", start: 19, takeAway: 9 },
      "S04",
    ],
    [
      "cross-ten from 10",
      { type: "subtract-cross-ten", start: 10, takeAway: 3 },
      "S04",
    ],
    [
      "cross-ten taking 10",
      { type: "subtract-cross-ten", start: 15, takeAway: 10 },
      "S04",
    ],
  ])("%s", (_name, spec, skill) => {
    expect(issueCodes(raw(spec, skill, 0))).toContain("bad-parameter");
  });

  it("rejects a stored answer that disagrees with the parameters", () => {
    const codes = issueCodes(
      raw({ type: "subtract-take-away", start: 13, takeAway: 5 }, "S03", 7),
    );
    expect(codes).toEqual(["answer-mismatch"]);
  });

  it("rejects an unknown problem type, including inherited property names", () => {
    expect(
      issueCodes(raw({ type: "multiply" } as unknown as ProblemSpec, "S03", 1)),
    ).toContain("unknown-type");
    expect(
      issueCodes(raw({ type: "toString" } as unknown as ProblemSpec, "S03", 1)),
    ).toContain("unknown-type");
  });

  it("rejects unknown skills, S05 as a problem skill, and type/skill mismatches", () => {
    const spec: ProblemSpec = {
      type: "subtract-take-away",
      start: 9,
      takeAway: 4,
    };
    expect(issueCodes(raw(spec, "S99", 5))).toContain("unknown-skill");
    expect(issueCodes(raw(spec, "S05", 5))).toContain(
      "non-instructional-skill",
    );
    expect(issueCodes(raw(spec, "S01", 5))).toContain("skill-mismatch");
  });

  it("rejects wrong versions, bad ids, bad banks and non-objects", () => {
    const spec: ProblemSpec = { type: "count", quantity: 3 };
    expect(
      issueCodes(raw(spec, "S01", 3, { curriculumVersion: "old" })),
    ).toContain("version-mismatch");
    expect(issueCodes(raw(spec, "S01", 3, { contentVersion: "" }))).toContain(
      "missing-version",
    );
    expect(issueCodes(raw(spec, "S01", 3, { id: " " }))).toContain("bad-id");
    expect(
      issueCodes(raw(spec, "S01", 3, { eligibleBank: "final-exam" })),
    ).toContain("bad-bank");
    expect(issueCodes(raw(spec, "S01", 3, { answer: "3" }))).toContain(
      "bad-answer",
    );
    expect(issueCodes(null)).toEqual(["malformed"]);
    expect(issueCodes("problem")).toEqual(["malformed"]);
  });

  it("assertValidProblem throws a ProblemValidationError with all issues", () => {
    expect(() => assertValidProblem({})).toThrow(ProblemValidationError);
  });

  it("freezes a copy and leaves the caller's object alone", () => {
    const input = raw({ type: "count", quantity: 4 }, "S01", 4);
    const validated = assertValidProblem(input);
    expect(Object.isFrozen(validated)).toBe(true);
    expect(Object.isFrozen(input)).toBe(false);
    expect(validated).not.toBe(input);
  });
});

describe("evaluation", () => {
  it.each<[string, ProblemSpec, string, number]>([
    ["count", { type: "count", quantity: 9 }, "S01", 9],
    ["compose", { type: "compose", partA: 6, partB: 7 }, "S02", 13],
    ["decompose", { type: "decompose", total: 15, knownPart: 8 }, "S02", 7],
    [
      "simple subtraction",
      { type: "subtract-take-away", start: 9, takeAway: 4 },
      "S03",
      5,
    ],
    [
      "subtract to zero",
      { type: "subtract-take-away", start: 8, takeAway: 8 },
      "S03",
      0,
    ],
    [
      "subtract from upper bound",
      { type: "subtract-take-away", start: 20, takeAway: 6 },
      "S03",
      14,
    ],
    [
      "crossing ten",
      { type: "subtract-cross-ten", start: 13, takeAway: 5 },
      "S04",
      8,
    ],
  ])(
    "scores the right answer correct and a wrong one incorrect: %s",
    (_n, spec, skill, answer) => {
      const p = problem(spec, skill, answer);
      expect(evaluateResponse(p, answer).status).toBe("correct");
      const wrong = answer === 20 ? 19 : answer + 1;
      expect(evaluateResponse(p, wrong).status).toBe("incorrect");
    },
  );

  it("reports make-ten steps for crossing-ten problems", () => {
    const result = evaluateResponse(
      problem({ type: "subtract-cross-ten", start: 13, takeAway: 5 }, "S04", 8),
      8,
    );
    expect(result).toMatchObject({
      status: "correct",
      problemType: "subtract-cross-ten",
      skillId: "S04",
      expectedAnswer: 8,
      strategy: { kind: "make-ten", takeToTen: 3, takeFromTen: 2 },
    });
  });

  it("does not attach a strategy to other problem types", () => {
    const result = evaluateResponse(
      problem({ type: "count", quantity: 2 }, "S01", 2),
      2,
    );
    expect(result).not.toHaveProperty("strategy");
  });

  it.each<[string, unknown, string]>([
    ["numeric string", "8", "wrong-type"],
    ["empty string", "", "wrong-type"],
    ["array", [8], "wrong-type"],
    ["object", { value: 8 }, "wrong-type"],
    ["boolean", true, "wrong-type"],
    ["undefined", undefined, "missing"],
    ["null", null, "missing"],
    ["decimal", 7.5, "not-whole-number"],
    ["decimal equal to answer when rounded", 8.0000001, "not-whole-number"],
    ["NaN", NaN, "not-finite"],
    ["Infinity", Infinity, "not-finite"],
    ["negative", -8, "out-of-range"],
    ["above 20", 21, "out-of-range"],
  ])("treats %s as invalid, never as a score", (_n, response, reason) => {
    const p = problem(
      { type: "subtract-cross-ten", start: 13, takeAway: 5 },
      "S04",
      8,
    );
    expect(evaluateResponse(p, response)).toEqual({
      status: "invalid",
      problemId: "T-1",
      reason,
    });
  });

  it("accepts the lowest and highest allowed responses", () => {
    const p = problem({ type: "count", quantity: 0 }, "S01", 0);
    expect(evaluateResponse(p, 0).status).toBe("correct");
    expect(evaluateResponse(p, 20).status).toBe("incorrect");
  });

  it("is repeatable and does not modify the problem", () => {
    const p = problem(
      { type: "subtract-take-away", start: 12, takeAway: 7 },
      "S03",
      5,
    );
    const before = JSON.stringify(p);
    const first = evaluateResponse(p, 5);
    const results = Array.from({ length: 50 }, () => evaluateResponse(p, 5));
    for (const r of results) expect(r).toEqual(first);
    expect(JSON.stringify(p)).toBe(before);
  });

  it("has no place to put a theme: unexpected fields are rejected", () => {
    const base = raw(
      { type: "subtract-take-away", start: 13, takeAway: 5 },
      "S03",
      8,
    );
    expect(issueCodes({ ...base, theme: "space" })).toEqual(["unknown-field"]);
    expect(issueCodes({ ...base, spec: { ...base.spec, bonus: 1 } })).toEqual([
      "unknown-field",
    ]);
  });
});
