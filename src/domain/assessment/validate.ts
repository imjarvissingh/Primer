import { CURRICULUM, LEARNING_PHASES } from "../curriculum";
import type { ProblemSpec, ValidatedProblem } from "../math";
import type { ValidationIssue } from "../shared/validation";
import type { QuestionBank } from "./types";

/**
 * EXACT key: two items with the same key are the same question (same type and
 * same numbers). Reusing one across banks would let practice leak into assessment.
 */
export function exactItemKey(spec: ProblemSpec): string {
  switch (spec.type) {
    case "count":
      return `count:${spec.quantity}`;
    case "compose":
      return `compose:${spec.partA},${spec.partB}`;
    case "decompose":
      return `decompose:${spec.total},${spec.knownPart}`;
    case "subtract-take-away":
    case "subtract-cross-ten":
      return `${spec.type}:${spec.start},${spec.takeAway}`;
  }
}

/**
 * EQUIVALENT key: questions that are different numerically as written but share
 * one underlying number fact, such as 4+3 and 3+4, or 13−5 and 13−8 (which
 * use the same three numbers). This is only a warning signal: educators may
 * want similar items in different banks, but should do it knowingly.
 */
export function equivalentItemKey(spec: ProblemSpec): string {
  const pair = (a: number, b: number) => [a, b].sort((x, y) => x - y).join(",");
  switch (spec.type) {
    case "count":
      return `count:${spec.quantity}`;
    case "compose":
      return `compose:${pair(spec.partA, spec.partB)}`;
    case "decompose":
      return `compose:${pair(spec.knownPart, spec.total - spec.knownPart)}`;
    case "subtract-take-away":
    case "subtract-cross-ten":
      return `${spec.type}:${spec.start}|${pair(spec.takeAway, spec.start - spec.takeAway)}`;
  }
}

export interface EquivalenceWarning {
  readonly itemIds: readonly [string, string];
  readonly phases: readonly [string, string];
}

export interface BankReport {
  /** Hard errors. A non-empty list means the banks must not be used. */
  readonly issues: readonly ValidationIssue[];
  /** Different items that rest on the same number fact. Needs educator judgement. */
  readonly equivalenceWarnings: readonly EquivalenceWarning[];
}

export function checkBanks(banks: readonly QuestionBank[]): BankReport {
  const issues: ValidationIssue[] = [];
  const add = (code: string, message: string) => issues.push({ code, message });

  const phases = banks.map((b) => b.phase);
  for (const phase of LEARNING_PHASES) {
    const count = phases.filter((p) => p === phase).length;
    if (count === 0) add("missing-bank", `No bank for phase ${phase}`);
    if (count > 1)
      add("duplicate-bank", `More than one bank for phase ${phase}`);
  }

  const seenIds = new Map<string, string>();
  const seenExact = new Map<string, { id: string; phase: string }>();
  const seenFacts = new Map<
    string,
    { id: string; phase: string; spec: ProblemSpec }[]
  >();
  const warnings: EquivalenceWarning[] = [];

  for (const bank of banks) {
    if (bank.curriculumVersion !== CURRICULUM.curriculumVersion) {
      add(
        "version-mismatch",
        `${bank.phase} bank has the wrong curriculumVersion`,
      );
    }
    if (bank.contentVersion !== CURRICULUM.contentVersion) {
      add(
        "version-mismatch",
        `${bank.phase} bank has the wrong contentVersion`,
      );
    }
    if (bank.items.length === 0)
      add("empty-bank", `${bank.phase} bank has no items`);

    for (const p of bank.items as readonly ValidatedProblem[]) {
      if (p.eligibleBank !== bank.phase) {
        add(
          "wrong-bank",
          `${p.id} is marked for ${p.eligibleBank} but sits in ${bank.phase}`,
        );
      }
      if (
        p.curriculumVersion !== bank.curriculumVersion ||
        p.contentVersion !== bank.contentVersion
      ) {
        add("version-mismatch", `${p.id} versions differ from its bank`);
      }
      if (seenIds.has(p.id))
        add("duplicate-id", `Item id ${p.id} is used more than once`);
      seenIds.set(p.id, bank.phase);

      const exact = exactItemKey(p.spec);
      const earlier = seenExact.get(exact);
      if (earlier) {
        add(
          "duplicate-item",
          `${p.id} (${bank.phase}) repeats ${earlier.id} (${earlier.phase}): ${exact}`,
        );
      } else {
        seenExact.set(exact, { id: p.id, phase: bank.phase });
      }

      // Same number fact but not the same question: warn, do not reject.
      const fact = equivalentItemKey(p.spec);
      for (const other of seenFacts.get(fact) ?? []) {
        if (exactItemKey(other.spec) !== exact) {
          warnings.push({
            itemIds: [other.id, p.id],
            phases: [other.phase, bank.phase],
          });
        }
      }
      seenFacts.set(fact, [
        ...(seenFacts.get(fact) ?? []),
        { id: p.id, phase: bank.phase, spec: p.spec },
      ]);
    }
  }
  return { issues, equivalenceWarnings: warnings };
}
