import { createCurriculum } from "./graph";
import type { CurriculumDefinition } from "./types";

export const CURRICULUM_VERSION = "curriculum-2026.10-draft.1";
export const CONTENT_VERSION = "content-2026.10-draft.1";

/**
 * Skill titles come from docs/CURRICULUM.md. Descriptions restate them.
 *
 * ASSUMPTIONS (not stated in the planning documents; see docs/CURRICULUM.md):
 *  - S02 and S03 each need S01 (a child must be able to count a quantity first).
 *  - S04 needs S03 (taking away) and S02 (teen-number decomposition). S03 is listed
 *    first because it is the nearest fallback when a child struggles with S04.
 *  - S05 assesses S03 and S04 (subtraction within 20, transfer to unseen items).
 * All of these are draft until an educator reviews them.
 */
export const CURRICULUM_DEFINITION: CurriculumDefinition = {
  curriculumVersion: CURRICULUM_VERSION,
  contentVersion: CONTENT_VERSION,
  skills: [
    {
      id: "S01",
      kind: "instructional",
      title: "Count and represent quantities 0–20",
      description: "Count a displayed quantity from 0 to 20 and represent it.",
      prerequisites: [],
      reviewStatus: "draft",
    },
    {
      id: "S02",
      kind: "instructional",
      title: "Compose and decompose numbers",
      description:
        "Put two parts together to make a number and split a number into parts, including teen numbers.",
      prerequisites: ["S01"],
      reviewStatus: "draft",
    },
    {
      id: "S03",
      kind: "instructional",
      title: "Model subtraction as taking away",
      description: "Subtract by taking a quantity away from a concrete whole.",
      prerequisites: ["S01"],
      reviewStatus: "draft",
    },
    {
      id: "S04",
      kind: "instructional",
      title: "Use make-ten strategies when crossing ten",
      description:
        "Subtract within 20 across ten by first making ten, then taking away the rest.",
      prerequisites: ["S03", "S02"],
      reviewStatus: "draft",
    },
    {
      id: "S05",
      kind: "assessment-objective",
      title: "Show independent transfer",
      description:
        "Solve unseen subtraction items independently, and again after a delay. This is evidence, not a lesson.",
      assesses: ["S03", "S04"],
      evidencePhases: ["independent", "delayed"],
      reviewStatus: "draft",
    },
  ],
};

export const CURRICULUM = createCurriculum(CURRICULUM_DEFINITION);
