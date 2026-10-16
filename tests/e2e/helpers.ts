import { readdirSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Strings that must never reach a browser: answer keys and bank internals.
 * Curriculum/content version labels are NOT listed: the adult summary shows them
 * on purpose as provenance, and they identify no item or answer.
 */
export const FORBIDDEN = [
  "expectedAnswer",
  "eligibleBank",
  "reviewStatus",
  "subtract-cross-ten",
  "subtract-take-away",
  "GUIDED_PRACTICE",
  "GP-0",
  "BL-0",
  "IN-0",
  "DL-0",
  "INDEPENDENT_BANK",
  "DRAFT_EVIDENCE_POLICY",
];

export function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const f = path.join(dir, n);
    return statSync(f).isDirectory() ? walk(f) : [f];
  });
}
