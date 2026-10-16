import {
  deepFreeze,
  formatIssues,
  type ValidationIssue,
} from "../shared/validation";
import type {
  AssessmentObjective,
  CurriculumDefinition,
  InstructionalSkill,
  SkillDefinition,
} from "./types";

export class CurriculumValidationError extends Error {
  readonly issues: readonly ValidationIssue[];
  constructor(issues: readonly ValidationIssue[]) {
    super(`Invalid curriculum: ${formatIssues(issues)}`);
    this.name = "CurriculumValidationError";
    this.issues = issues;
  }
}

/** Checks a curriculum definition. Pure: never changes its input. */
export function validateCurriculum(
  def: CurriculumDefinition,
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (code: string, message: string) => issues.push({ code, message });

  if (!def.curriculumVersion.trim())
    add("missing-version", "curriculumVersion is empty");
  if (!def.contentVersion.trim())
    add("missing-version", "contentVersion is empty");

  const byId = new Map<string, SkillDefinition>();
  for (const skill of def.skills) {
    if (!skill.id.trim()) add("empty-id", "A skill has an empty id");
    else if (byId.has(skill.id))
      add("duplicate-id", `Duplicate skill id ${skill.id}`);
    else byId.set(skill.id, skill);
    if (!skill.title.trim() || !skill.description.trim()) {
      add(
        "missing-description",
        `Skill ${skill.id} needs a title and description`,
      );
    }
  }

  for (const skill of def.skills) {
    if (skill.kind === "instructional") {
      const seen = new Set<string>();
      for (const target of skill.prerequisites) {
        if (target === skill.id) {
          add("self-dependency", `${skill.id} cannot be its own prerequisite`);
        } else if (!byId.has(target)) {
          add(
            "missing-reference",
            `${skill.id} requires unknown skill ${target}`,
          );
        } else if (byId.get(target)?.kind !== "instructional") {
          add(
            "invalid-prerequisite",
            `${skill.id} requires ${target}, which is an assessment objective, not a taught skill`,
          );
        }
        if (seen.has(target))
          add("duplicate-edge", `${skill.id} lists ${target} twice`);
        seen.add(target);
      }
    } else {
      if (skill.assesses.length === 0) {
        add("empty-assessment", `${skill.id} must assess at least one skill`);
      }
      for (const target of skill.assesses) {
        if (!byId.has(target)) {
          add(
            "missing-reference",
            `${skill.id} assesses unknown skill ${target}`,
          );
        } else if (byId.get(target)?.kind !== "instructional") {
          add(
            "invalid-assessment-target",
            `${skill.id} can only assess taught skills`,
          );
        }
      }
      if (skill.evidencePhases.length === 0) {
        add("empty-phases", `${skill.id} needs at least one evidence phase`);
      }
      if (skill.evidencePhases.includes("guided-practice")) {
        add(
          "practice-as-evidence",
          `${skill.id} cannot use guided practice as evidence`,
        );
      }
    }
  }

  issues.push(...findCycles(def.skills, byId));
  return issues;
}

function findCycles(
  skills: readonly SkillDefinition[],
  byId: ReadonlyMap<string, SkillDefinition>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const done = new Set<string>();
  const path: string[] = [];

  const visit = (id: string) => {
    const skill = byId.get(id);
    if (!skill || skill.kind !== "instructional" || done.has(id)) return;
    const at = path.indexOf(id);
    if (at !== -1) {
      const cycle = [...path.slice(at), id].join(" -> ");
      issues.push({ code: "cycle", message: `Prerequisite cycle: ${cycle}` });
      return;
    }
    path.push(id);
    for (const next of skill.prerequisites) if (next !== id) visit(next);
    path.pop();
    done.add(id);
  };

  for (const skill of skills) visit(skill.id);
  return issues;
}

/** A validated, frozen curriculum with lookup helpers. Create it with createCurriculum. */
export interface Curriculum {
  readonly curriculumVersion: string;
  readonly contentVersion: string;
  readonly skills: readonly SkillDefinition[];
}

export function createCurriculum(def: CurriculumDefinition): Curriculum {
  const issues = validateCurriculum(def);
  if (issues.length > 0) throw new CurriculumValidationError(issues);
  // Copy first so we never freeze (or alias) the caller's object.
  return deepFreeze(structuredClone(def));
}

export function findSkill(
  curriculum: Curriculum,
  id: string,
): SkillDefinition | undefined {
  return curriculum.skills.find((s) => s.id === id);
}

export function getSkill(curriculum: Curriculum, id: string): SkillDefinition {
  const skill = findSkill(curriculum, id);
  if (!skill) throw new Error(`Unknown skill id: ${id}`);
  return skill;
}

export function getInstructionalSkills(
  curriculum: Curriculum,
): readonly InstructionalSkill[] {
  return curriculum.skills.filter(
    (s): s is InstructionalSkill => s.kind === "instructional",
  );
}

export function getAssessmentObjectives(
  curriculum: Curriculum,
): readonly AssessmentObjective[] {
  return curriculum.skills.filter(
    (s): s is AssessmentObjective => s.kind === "assessment-objective",
  );
}

/** Direct prerequisites in declared order. Assessment objectives have none. */
export function getPrerequisites(
  curriculum: Curriculum,
  id: string,
): readonly string[] {
  const skill = getSkill(curriculum, id);
  return skill.kind === "instructional" ? skill.prerequisites : [];
}

/** All direct and indirect prerequisites, nearest first, without duplicates. */
export function getAllPrerequisites(
  curriculum: Curriculum,
  id: string,
): readonly string[] {
  const result: string[] = [];
  const queue = [...getPrerequisites(curriculum, id)];
  while (queue.length > 0) {
    const next = queue.shift() as string;
    if (result.includes(next)) continue;
    result.push(next);
    queue.push(...getPrerequisites(curriculum, next));
  }
  return result;
}

/** Taught skills that an assessment objective measures. */
export function getAssessedSkills(
  curriculum: Curriculum,
  objectiveId: string,
): readonly string[] {
  const skill = getSkill(curriculum, objectiveId);
  return skill.kind === "assessment-objective" ? skill.assesses : [];
}
