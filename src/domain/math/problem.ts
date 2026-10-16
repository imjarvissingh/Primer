import { CURRICULUM, LEARNING_PHASES } from "../curriculum";
import {
  deepFreeze,
  formatIssues,
  type ValidationIssue,
  type ValidationResult,
} from "../shared/validation";
import {
  MAX_QUANTITY,
  SKILL_FOR_TYPE,
  type ProblemType,
  type MathProblem,
  type ProblemSpec,
  type ValidatedProblem,
} from "./types";

/** The correct answer, computed only from the problem parameters. */
export function computeAnswer(spec: ProblemSpec): number {
  switch (spec.type) {
    case "count":
      return spec.quantity;
    case "compose":
      return spec.partA + spec.partB;
    case "decompose":
      return spec.total - spec.knownPart;
    case "subtract-take-away":
    case "subtract-cross-ten":
      return spec.start - spec.takeAway;
  }
}

/** Integer arithmetic only: every operand is checked as a safe integer first. */
const isWhole = (n: unknown): n is number =>
  typeof n === "number" && Number.isSafeInteger(n);
const inRange = (n: unknown, min: number, max: number): n is number =>
  isWhole(n) && n >= min && n <= max;

function checkSpec(
  spec: ProblemSpec,
  add: (code: string, msg: string) => void,
) {
  const bad = (field: string, rule: string) =>
    add("bad-parameter", `${spec.type}: ${field} ${rule}`);
  switch (spec.type) {
    case "count":
      if (!inRange(spec.quantity, 0, MAX_QUANTITY))
        bad("quantity", `must be an integer 0–${MAX_QUANTITY}`);
      break;
    case "compose":
      if (!inRange(spec.partA, 0, MAX_QUANTITY))
        bad("partA", `must be an integer 0–${MAX_QUANTITY}`);
      else if (!inRange(spec.partB, 0, MAX_QUANTITY))
        bad("partB", `must be an integer 0–${MAX_QUANTITY}`);
      else if (spec.partA + spec.partB > MAX_QUANTITY)
        bad("partA + partB", `must not exceed ${MAX_QUANTITY}`);
      break;
    case "decompose":
      if (!inRange(spec.total, 0, MAX_QUANTITY))
        bad("total", `must be an integer 0–${MAX_QUANTITY}`);
      else if (!inRange(spec.knownPart, 0, spec.total))
        bad("knownPart", "must be an integer from 0 to total");
      break;
    case "subtract-take-away":
      if (!inRange(spec.start, 0, MAX_QUANTITY))
        bad("start", `must be an integer 0–${MAX_QUANTITY}`);
      else if (!inRange(spec.takeAway, 0, spec.start))
        bad("takeAway", "must be an integer from 0 to start");
      break;
    case "subtract-cross-ten":
      if (!inRange(spec.start, 11, 18))
        bad("start", "must be an integer 11–18");
      else if (!inRange(spec.takeAway, 1, 9))
        bad("takeAway", "must be an integer 1–9");
      else if (spec.start - spec.takeAway > 9)
        bad(
          "takeAway",
          "must make the result less than ten (it must cross ten)",
        );
      break;
  }
}

const PROBLEM_KEYS = [
  "id",
  "curriculumVersion",
  "contentVersion",
  "skillId",
  "eligibleBank",
  "reviewStatus",
  "spec",
  "answer",
  "presentation",
];
const SPEC_KEYS: Readonly<Record<ProblemType, readonly string[]>> = {
  count: ["type", "quantity"],
  compose: ["type", "partA", "partB"],
  decompose: ["type", "total", "knownPart"],
  "subtract-take-away": ["type", "start", "takeAway"],
  "subtract-cross-ten": ["type", "start", "takeAway"],
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const nonEmpty = (v: unknown): v is string =>
  typeof v === "string" && v.trim() !== "";

/**
 * Validates untrusted problem data. The answer key is checked against a fresh
 * calculation from the parameters; a mismatch is rejected, never trusted.
 */
export function validateProblem(
  input: unknown,
): ValidationResult<ValidatedProblem> {
  const issues: ValidationIssue[] = [];
  const add = (code: string, message: string) => issues.push({ code, message });

  if (!isRecord(input)) {
    return {
      ok: false,
      issues: [{ code: "malformed", message: "Problem must be an object" }],
    };
  }
  for (const key of Object.keys(input)) {
    if (!PROBLEM_KEYS.includes(key))
      add("unknown-field", `Unexpected field: ${key}`);
  }
  if (!nonEmpty(input.id)) add("bad-id", "id must be a non-empty string");
  if (!nonEmpty(input.curriculumVersion))
    add("missing-version", "curriculumVersion is required");
  if (!nonEmpty(input.contentVersion))
    add("missing-version", "contentVersion is required");
  if (
    nonEmpty(input.curriculumVersion) &&
    input.curriculumVersion !== CURRICULUM.curriculumVersion
  ) {
    add(
      "version-mismatch",
      `curriculumVersion must be ${CURRICULUM.curriculumVersion}`,
    );
  }
  if (
    nonEmpty(input.contentVersion) &&
    input.contentVersion !== CURRICULUM.contentVersion
  ) {
    add(
      "version-mismatch",
      `contentVersion must be ${CURRICULUM.contentVersion}`,
    );
  }
  if (!(LEARNING_PHASES as readonly unknown[]).includes(input.eligibleBank)) {
    add("bad-bank", "eligibleBank is not a known learning phase");
  }
  if (
    input.reviewStatus !== "draft" &&
    input.reviewStatus !== "educator-approved"
  ) {
    add("bad-review-status", "reviewStatus must be draft or educator-approved");
  }
  const rep = isRecord(input.presentation)
    ? input.presentation.representation
    : undefined;
  if (rep !== "concrete" && rep !== "numeric") {
    add(
      "bad-presentation",
      "presentation.representation must be concrete or numeric",
    );
  }

  const spec = input.spec;
  const type = isRecord(spec) ? spec.type : undefined;
  if (typeof type !== "string" || !Object.hasOwn(SKILL_FOR_TYPE, type)) {
    add("unknown-type", `Unknown problem type: ${String(type)}`);
  } else {
    for (const key of Object.keys(spec as object)) {
      if (!SPEC_KEYS[type as ProblemType].includes(key)) {
        add("unknown-field", `Unexpected field in spec: ${key}`);
      }
    }
    checkSpec(spec as unknown as ProblemSpec, add);
    const expectedSkill = SKILL_FOR_TYPE[type as keyof typeof SKILL_FOR_TYPE];
    if (input.skillId !== expectedSkill) {
      add(
        "skill-mismatch",
        `${type} problems must reference skill ${expectedSkill}`,
      );
    }
  }
  // The skill must exist in the curriculum and be taught (S05 is an objective only).
  const skill = CURRICULUM.skills.find((s) => s.id === input.skillId);
  if (!skill) add("unknown-skill", `Unknown skillId: ${String(input.skillId)}`);
  else if (skill.kind !== "instructional") {
    add(
      "non-instructional-skill",
      `${skill.id} is an assessment objective, not a taught skill`,
    );
  }

  if (!isWhole(input.answer)) {
    add("bad-answer", "answer must be an integer");
  } else if (
    issues.length === 0 &&
    input.answer !== computeAnswer(spec as ProblemSpec)
  ) {
    add(
      "answer-mismatch",
      `Stored answer ${input.answer} does not match the computed answer for problem ${String(input.id)}`,
    );
  }

  if (issues.length > 0) return { ok: false, issues };
  // Copy, then freeze, so the caller's object is untouched.
  const copy = deepFreeze(
    structuredClone(input),
  ) as unknown as ValidatedProblem;
  return { ok: true, value: copy };
}

export class ProblemValidationError extends Error {
  readonly issues: readonly ValidationIssue[];
  constructor(issues: readonly ValidationIssue[]) {
    super(`Invalid problem: ${formatIssues(issues)}`);
    this.name = "ProblemValidationError";
    this.issues = issues;
  }
}

export function assertValidProblem(
  input: MathProblem | unknown,
): ValidatedProblem {
  const result = validateProblem(input);
  if (!result.ok) throw new ProblemValidationError(result.issues);
  return result.value;
}
