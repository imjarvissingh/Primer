/**
 * Wire format between the Block Builder client and the practice API.
 * Types and constants only: no domain code, so the client can import it safely.
 * Nothing here can carry an answer key; a response never contains an answer field.
 */

export const PRACTICE_MISSION_ID = "subtract-practice";
export const PRACTICE_API_PATH = "/api/practice/mission";
/** Requests larger than this are rejected before parsing. */
export const MAX_REQUEST_BYTES = 1024;

export type PracticeRequest =
  | { action: "start"; missionId: typeof PRACTICE_MISSION_ID }
  | { action: "attempt"; sessionId: string; seq: number; answer: unknown }
  | { action: "skip"; sessionId: string; seq: number }
  | { action: "stop"; sessionId: string; seq: number }
  /** Answer the server's one-time offer of a short warm-up (see `support-offer`). */
  | {
      action: "support";
      sessionId: string;
      seq: number;
      choice: "start" | "decline";
    };

/** The question itself, as the story states it. Not an answer. */
export interface PublicChallenge {
  missionId: typeof PRACTICE_MISSION_ID;
  start: number;
  takeAway: number;
  /** Largest whole number the answer picker should offer. */
  maxAnswer: number;
}

/**
 * Numbers a make-ten hint may mention. They describe a strategy, not the final
 * answer. The server sends `takeFromTen` only with the hint that uses it, so a
 * client cannot draw a later step than the one it was authorized to show.
 */
export interface MakeTenHintSteps {
  takeToTen: number;
  takeFromTen: number | null;
}

/** The short warm-up activity's numbers. Same shape of question, no answer. */
export interface SupportChallenge {
  start: number;
  takeAway: number;
  maxAnswer: number;
}

/** What the learner is shown after an event. Controlled identifiers only. */
export type PracticeFeedback =
  | { kind: "correct" }
  | { kind: "neutral-feedback" }
  | {
      kind: "hint";
      hintId: string;
      /** 1-based position in the hint sequence. */
      hintNumber: number;
      steps: MakeTenHintSteps | null;
    }
  /** Wrong tries are used up. Practice stops here, with no warm-up (offered once, or declined). */
  | { kind: "easier-practice" }
  /** The server offers ONE short warm-up. The session stays open until the learner chooses. */
  | { kind: "support-offer" }
  /** The warm-up began; the learner is now answering `challenge` instead of the mission. */
  | { kind: "support-started"; challenge: SupportChallenge }
  /** The warm-up is over (done, skipped or finished trying). Back on the original mission. */
  | { kind: "support-finished" }
  | { kind: "offer-skip" }
  | { kind: "ask-again" }
  | { kind: "skipped" }
  | { kind: "ended"; reason: "learner-stopped" | "unproductive" };

/** `open`: more attempts allowed. `finished`: the item or session is over. */
export type SessionStatus = "open" | "finished";

export type PracticeSuccess =
  | { ok: true; sessionId: string; seq: number; challenge: PublicChallenge }
  | {
      ok: true;
      seq: number;
      feedback: PracticeFeedback;
      sessionStatus: SessionStatus;
    };

export type PracticeErrorCode =
  | "bad-request"
  | "too-large"
  | "unknown-mission"
  | "session-not-found"
  | "stale"
  | "session-closed"
  | "rate-limited"
  | "server-error";

export interface PracticeFailure {
  ok: false;
  error: PracticeErrorCode;
}

export type PracticeResponse = PracticeSuccess | PracticeFailure;
