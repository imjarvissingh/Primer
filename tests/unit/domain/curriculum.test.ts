import { describe, expect, it } from "vitest";
import {
  CURRICULUM,
  CURRICULUM_DEFINITION,
  CurriculumValidationError,
  createCurriculum,
  getAllPrerequisites,
  getAssessedSkills,
  getPrerequisites,
  getSkill,
  validateCurriculum,
  type CurriculumDefinition,
  type SkillDefinition,
} from "@/domain/curriculum";

function withSkills(skills: SkillDefinition[]): CurriculumDefinition {
  return { ...CURRICULUM_DEFINITION, skills };
}

function taught(id: string, prerequisites: string[] = []): SkillDefinition {
  return {
    id,
    kind: "instructional",
    title: `Skill ${id}`,
    description: "test",
    prerequisites,
    reviewStatus: "draft",
  };
}

const codes = (def: CurriculumDefinition) =>
  validateCurriculum(def).map((i) => i.code);

describe("shipped curriculum", () => {
  it("defines S01–S05 with version metadata and descriptions", () => {
    expect(CURRICULUM.skills.map((s) => s.id)).toEqual([
      "S01",
      "S02",
      "S03",
      "S04",
      "S05",
    ]);
    expect(CURRICULUM.curriculumVersion).toMatch(/\S/);
    expect(CURRICULUM.contentVersion).toMatch(/\S/);
    for (const skill of CURRICULUM.skills) {
      expect(skill.title).toMatch(/\S/);
      expect(skill.description).toMatch(/\S/);
      expect(skill.reviewStatus).toBe("draft");
    }
  });

  it("passes its own validation", () => {
    expect(validateCurriculum(CURRICULUM_DEFINITION)).toEqual([]);
  });

  it("treats S05 as an assessment objective, never a prerequisite", () => {
    expect(getSkill(CURRICULUM, "S05").kind).toBe("assessment-objective");
    for (const skill of CURRICULUM.skills) {
      if (skill.kind === "instructional")
        expect(skill.prerequisites).not.toContain("S05");
    }
    expect(getAssessedSkills(CURRICULUM, "S05")).toEqual(["S03", "S04"]);
    expect(getPrerequisites(CURRICULUM, "S05")).toEqual([]);
  });

  it("resolves prerequisites deterministically, nearest first", () => {
    expect(getPrerequisites(CURRICULUM, "S04")).toEqual(["S03", "S02"]);
    expect(getAllPrerequisites(CURRICULUM, "S04")).toEqual([
      "S03",
      "S02",
      "S01",
    ]);
    expect(getAllPrerequisites(CURRICULUM, "S01")).toEqual([]);
  });

  it("is frozen and createCurriculum does not freeze or alias the input", () => {
    expect(Object.isFrozen(CURRICULUM)).toBe(true);
    expect(Object.isFrozen(CURRICULUM.skills[0])).toBe(true);
    const input = withSkills([taught("A")]);
    const made = createCurriculum(input);
    expect(Object.isFrozen(input)).toBe(false);
    expect(made.skills[0]).not.toBe(input.skills[0]);
  });

  it("throws a clear error for unknown skill ids", () => {
    expect(() => getSkill(CURRICULUM, "S99")).toThrow("Unknown skill id: S99");
  });
});

describe("curriculum validation", () => {
  it("rejects duplicate ids", () => {
    expect(codes(withSkills([taught("A"), taught("A")]))).toContain(
      "duplicate-id",
    );
  });

  it("rejects references to missing skills", () => {
    expect(codes(withSkills([taught("A", ["Z"])]))).toContain(
      "missing-reference",
    );
  });

  it("rejects self-dependencies", () => {
    expect(codes(withSkills([taught("A", ["A"])]))).toContain(
      "self-dependency",
    );
  });

  it("rejects cycles and names the path", () => {
    const def = withSkills([
      taught("A", ["B"]),
      taught("B", ["C"]),
      taught("C", ["A"]),
    ]);
    expect(codes(def)).toContain("cycle");
    expect(
      validateCurriculum(def).find((i) => i.code === "cycle")?.message,
    ).toContain("A -> B -> C -> A");
  });

  it("rejects duplicate edges", () => {
    expect(codes(withSkills([taught("A"), taught("B", ["A", "A"])]))).toContain(
      "duplicate-edge",
    );
  });

  it("rejects an assessment objective used as a prerequisite", () => {
    const objective: SkillDefinition = {
      id: "O",
      kind: "assessment-objective",
      title: "o",
      description: "o",
      assesses: ["A"],
      evidencePhases: ["independent"],
      reviewStatus: "draft",
    };
    expect(
      codes(withSkills([taught("A"), objective, taught("B", ["O"])])),
    ).toContain("invalid-prerequisite");
  });

  it("rejects assessment objectives that assess nothing, miss targets, or count practice", () => {
    const base = {
      id: "O",
      kind: "assessment-objective" as const,
      title: "o",
      description: "o",
      reviewStatus: "draft" as const,
    };
    expect(
      codes(
        withSkills([
          { ...base, assesses: [], evidencePhases: ["independent"] },
        ]),
      ),
    ).toContain("empty-assessment");
    expect(
      codes(
        withSkills([
          { ...base, assesses: ["Z"], evidencePhases: ["independent"] },
        ]),
      ),
    ).toContain("missing-reference");
    expect(
      codes(
        withSkills([
          taught("A"),
          { ...base, assesses: ["A"], evidencePhases: ["guided-practice"] },
        ]),
      ),
    ).toContain("practice-as-evidence");
  });

  it("rejects missing versions and descriptions", () => {
    expect(
      codes({ ...CURRICULUM_DEFINITION, curriculumVersion: " " }),
    ).toContain("missing-version");
    expect(codes(withSkills([{ ...taught("A"), description: "" }]))).toContain(
      "missing-description",
    );
  });

  it("createCurriculum throws CurriculumValidationError carrying the issues", () => {
    try {
      createCurriculum(withSkills([taught("A", ["A"])]));
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(CurriculumValidationError);
      expect((error as CurriculumValidationError).issues[0].code).toBe(
        "self-dependency",
      );
    }
  });

  it("does not mutate the definition it validates", () => {
    const before = JSON.stringify(CURRICULUM_DEFINITION);
    validateCurriculum(CURRICULUM_DEFINITION);
    expect(JSON.stringify(CURRICULUM_DEFINITION)).toBe(before);
  });
});
