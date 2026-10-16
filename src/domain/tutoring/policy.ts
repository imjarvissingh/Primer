import {
  CURRICULUM,
  getPrerequisites,
  isAssessmentPhase,
  type InstructionalSkillId,
  type LearningPhase,
} from "../curriculum";
import type { AttemptOutcome } from "../math";
import { HINT_LADDERS, type HintId } from "./hints";

/**
 * HOW THIS WORKS (read top to bottom):
 *  1. startItem() makes a fresh state for one question.
 *  2. step(state, event) returns the next state AND the one action the app may take.
 *  3. When an item is finished, call startItem() again for the next question.
 *
 * The policy never sees the correct answer, only whether the attempt was
 * "correct", "incorrect" or "invalid". It also never writes any text: actions
 * are controlled names, and the app maps them to reviewed wording.
 */

/** Wrong tries allowed in practice before we stop trying this item. */
export const MAX_INCORRECT_PRACTICE_ATTEMPTS = 5;
/** Unreadable answers in a row before we offer to skip. */
export const MAX_INVALID_BEFORE_SKIP_OFFER = 3;

export type ItemStatus = "awaiting-attempt" | "item-complete" | "ended";

export interface TutorState {
  readonly phase: LearningPhase;
  readonly skillId: InstructionalSkillId;
  readonly status: ItemStatus;
  /** Valid but wrong answers on this item. */
  readonly incorrectAttempts: number;
  /** Unreadable answers on this item. They are not counted as wrong. */
  readonly invalidAttempts: number;
  /** Hints shown on this item. Always 0 outside guided practice. */
  readonly hintsShown: number;
}

export type TutorEvent =
  | { readonly type: "attempt"; readonly outcome: AttemptOutcome }
  | { readonly type: "skip" }
  | { readonly type: "stop" };

export type TutorAction =
  /** Practice only: brief positive confirmation. */
  | { readonly kind: "confirm-correct"; readonly independent: boolean }
  /** Practice only: neutral "not quite" feedback. No answer, no blame. */
  | { readonly kind: "neutral-feedback" }
  /** Practice only: show one approved hint. */
  | { readonly kind: "show-hint"; readonly hintId: HintId }
  /** Practice only: offer easier practice on a prerequisite skill. */
  | { readonly kind: "practice-prerequisite"; readonly skillId: string }
  /** Practice only: gently offer to skip while the item stays open. */
  | { readonly kind: "offer-skip" }
  /** Assessment only: the same neutral acknowledgement whether right or wrong. */
  | { readonly kind: "acknowledge-response" }
  /** Any phase: the answer could not be read; ask again without scoring it. */
  | { readonly kind: "ask-again" }
  | { readonly kind: "skip-item" }
  /** Safe stop. `reason` says why; the child is never blamed. */
  | {
      readonly kind: "end-session";
      readonly reason: "learner-stopped" | "unproductive";
    };

export interface TutorStep {
  readonly state: TutorState;
  readonly action: TutorAction;
}

export class InvalidTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTransitionError";
  }
}

export function startItem(
  phase: LearningPhase,
  skillId: InstructionalSkillId,
): TutorState {
  return {
    phase,
    skillId,
    status: "awaiting-attempt",
    incorrectAttempts: 0,
    invalidAttempts: 0,
    hintsShown: 0,
  };
}

export function step(state: TutorState, event: TutorEvent): TutorStep {
  if (state.status === "ended") {
    throw new InvalidTransitionError(
      "The session has ended; no further events are allowed",
    );
  }
  if (state.status === "item-complete") {
    throw new InvalidTransitionError(
      "This item is finished; call startItem() for the next one",
    );
  }

  if (event.type === "stop") {
    return end(state, "learner-stopped");
  }
  if (event.type === "skip") {
    return {
      state: { ...state, status: "item-complete" },
      action: { kind: "skip-item" },
    };
  }
  if (event.type !== "attempt") {
    throw new InvalidTransitionError(`Unknown event: ${JSON.stringify(event)}`);
  }

  if (event.outcome === "invalid") return handleInvalid(state);

  return isAssessmentPhase(state.phase)
    ? handleAssessmentAttempt(state)
    : handlePracticeAttempt(state, event.outcome);
}

function end(
  state: TutorState,
  reason: "learner-stopped" | "unproductive",
): TutorStep {
  return {
    state: { ...state, status: "ended" },
    action: { kind: "end-session", reason },
  };
}

function handleInvalid(state: TutorState): TutorStep {
  const invalidAttempts = state.invalidAttempts + 1;
  const next = { ...state, invalidAttempts };
  // Only practice offers a skip prompt. In assessments the skip button is always available anyway.
  if (
    invalidAttempts >= MAX_INVALID_BEFORE_SKIP_OFFER &&
    !isAssessmentPhase(state.phase)
  ) {
    return { state: next, action: { kind: "offer-skip" } };
  }
  return { state: next, action: { kind: "ask-again" } };
}

/** One scored try, no hints, no answer, same reply for right and wrong. */
function handleAssessmentAttempt(state: TutorState): TutorStep {
  return {
    state: { ...state, status: "item-complete" },
    action: { kind: "acknowledge-response" },
  };
}

function handlePracticeAttempt(
  state: TutorState,
  outcome: "correct" | "incorrect",
): TutorStep {
  if (outcome === "correct") {
    return {
      state: { ...state, status: "item-complete" },
      // "independent" means no hint was needed. Even so, practice never proves mastery.
      action: { kind: "confirm-correct", independent: state.hintsShown === 0 },
    };
  }

  const incorrectAttempts = state.incorrectAttempts + 1;
  const ladder = HINT_LADDERS[state.skillId];
  const prerequisite = getPrerequisites(CURRICULUM, state.skillId)[0];

  // Attempt 1 gets neutral feedback; attempts 2.. walk up the hint ladder.
  if (incorrectAttempts === 1) {
    return {
      state: { ...state, incorrectAttempts },
      action: { kind: "neutral-feedback" },
    };
  }
  const hintIndex = incorrectAttempts - 2;
  if (hintIndex < ladder.length) {
    return {
      state: { ...state, incorrectAttempts, hintsShown: hintIndex + 1 },
      action: { kind: "show-hint", hintId: ladder[hintIndex] },
    };
  }

  // Hints are used up. Fall back to an easier skill once, then offer a skip, then stop.
  if (incorrectAttempts >= MAX_INCORRECT_PRACTICE_ATTEMPTS) {
    return end({ ...state, incorrectAttempts }, "unproductive");
  }
  if (incorrectAttempts === ladder.length + 2 && prerequisite !== undefined) {
    return {
      state: { ...state, incorrectAttempts, status: "item-complete" },
      action: { kind: "practice-prerequisite", skillId: prerequisite },
    };
  }
  return {
    state: { ...state, incorrectAttempts },
    action: { kind: "offer-skip" },
  };
}
