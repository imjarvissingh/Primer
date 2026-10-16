/**
 * Wire format for the independent-assessment demo. Types and constants only.
 *
 * During the check, a reply never says whether an answer was right: a correct
 * and an incorrect answer return exactly the same shape. Only the summary,
 * available after the check ends, carries outcomes, and it never carries an
 * answer key or an item id.
 */

export const ASSESSMENT_API_PATH = "/api/assessment";
export const MAX_ASSESSMENT_REQUEST_BYTES = 1024;

export type AssessmentRequest =
  | { action: "start" }
  | { action: "answer"; sessionId: string; seq: number; answer: unknown }
  | { action: "skip"; sessionId: string; seq: number }
  | { action: "stop"; sessionId: string; seq: number }
  | { action: "summary"; sessionId: string };

/** One question as the learner may see it: the numbers to display, nothing else. */
export interface AssessmentQuestion {
  /** 1-based position. */
  position: number;
  total: number;
  start: number;
  takeAway: number;
  maxAnswer: number;
}

export type AssessmentAck = "recorded" | "ask-again" | "skipped" | "stopped";
export type AssessmentStatus = "in-progress" | "complete" | "stopped";

export type AssessmentStartReply = {
  ok: true;
  sessionId: string;
  seq: number;
  question: AssessmentQuestion;
};

export type AssessmentStepReply = {
  ok: true;
  seq: number;
  ack: AssessmentAck;
  status: AssessmentStatus;
  /** The question to show next (or again), or null when the check is over. */
  question: AssessmentQuestion | null;
};

export type SummaryItemOutcome =
  "correct" | "incorrect" | "skipped" | "not-reached";

export interface AssessmentSummary {
  ok: true;
  /** Always true: this is demonstration data, never a real child's record. */
  synthetic: true;
  status: Exclude<AssessmentStatus, "in-progress">;
  counts: {
    total: number;
    answered: number;
    correct: number;
    skipped: number;
    notReached: number;
  };
  items: {
    position: number;
    /** The question as displayed, e.g. "16 − 5". Never the answer. */
    expression: string;
    skill: string;
    outcome: SummaryItemOutcome;
  }[];
  skills: {
    id: string;
    title: string;
    answered: number;
    correct: number;
    /** "Not yet assessed" or "Needs more evidence": never a mastery label. */
    observation: string;
  }[];
  mastery: {
    awarded: false;
    state: string;
    policy: string;
  };
  provenance: {
    phase: "independent";
    hintsUsed: 0;
    contentReview: "draft";
    curriculumVersion: string;
    contentVersion: string;
  };
}

export type AssessmentErrorCode =
  | "bad-request"
  | "too-large"
  | "session-not-found"
  | "stale"
  | "session-closed"
  | "not-finished"
  | "server-error";

export interface AssessmentFailure {
  ok: false;
  error: AssessmentErrorCode;
}

export type AssessmentReply =
  | AssessmentStartReply
  | AssessmentStepReply
  | AssessmentSummary
  | AssessmentFailure;
