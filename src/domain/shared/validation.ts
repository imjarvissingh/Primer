/** A single validation problem, with a stable code so tests and callers can match on it. */
export interface ValidationIssue {
  readonly code: string;
  readonly message: string;
}

export type ValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issues: readonly ValidationIssue[] };

export function formatIssues(issues: readonly ValidationIssue[]): string {
  return issues.map((i) => `[${i.code}] ${i.message}`).join("; ");
}

/** Recursively freezes plain data so shared domain definitions cannot be mutated. */
export function deepFreeze<T>(value: T): Readonly<T> {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
