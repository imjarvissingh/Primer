import type { InstructionalSkillId } from "../curriculum";

/**
 * Controlled hint identifiers. A hint is a REFERENCE to a piece of reviewed
 * teaching content (a visual cue or a model). The policy only ever hands out
 * these ids; it never writes hint text. The content behind each id is draft
 * until an educator approves it.
 */
export type HintId =
  | "hint.count.touch-each-once"
  | "hint.count.group-in-fives"
  | "hint.compose.show-two-groups"
  | "hint.compose.push-together"
  | "hint.take-away.cover-the-taken"
  | "hint.take-away.count-what-is-left"
  | "hint.make-ten.fill-to-ten"
  | "hint.make-ten.take-rest-from-ten";

/** Ordered from lightest visual cue to a worked model. Used by guided practice only. */
export const HINT_LADDERS: Readonly<
  Record<InstructionalSkillId, readonly HintId[]>
> = Object.freeze({
  S01: Object.freeze([
    "hint.count.touch-each-once",
    "hint.count.group-in-fives",
  ] as const),
  S02: Object.freeze([
    "hint.compose.show-two-groups",
    "hint.compose.push-together",
  ] as const),
  S03: Object.freeze([
    "hint.take-away.cover-the-taken",
    "hint.take-away.count-what-is-left",
  ] as const),
  S04: Object.freeze([
    "hint.make-ten.fill-to-ten",
    "hint.make-ten.take-rest-from-ten",
  ] as const),
});
