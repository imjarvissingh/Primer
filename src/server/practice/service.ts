import "server-only";
import { evaluateResponse } from "@/domain/math";
import {
  InvalidTransitionError,
  startItem,
  step,
  type TutorAction,
  type TutorEvent,
  type TutorState,
} from "@/domain/tutoring";
import type {
  PracticeFeedback,
  PracticeFailure,
  PracticeRequest,
  PracticeSuccess,
  SessionStatus,
} from "@/lib/practice-protocol";
import { getMission } from "./missions";
import type { SessionStore } from "./sessions";

export interface ServiceReply {
  status: number;
  body: PracticeSuccess | PracticeFailure;
}

const fail = (
  status: number,
  error: PracticeFailure["error"],
): ServiceReply => ({
  status,
  body: { ok: false, error },
});

/**
 * Runs one validated request against the session store. All correctness and
 * tutoring decisions happen here, using the Phase 2 evaluator and policy.
 */
export function handlePracticeRequest(
  store: SessionStore,
  request: PracticeRequest,
  now: number,
  newId: () => string,
): ServiceReply {
  if (request.action === "start") {
    const mission = getMission(request.missionId);
    if (mission === null) return fail(400, "unknown-mission");
    const session = store.create(
      newId(),
      mission,
      startItem("guided-practice", mission.problem.skillId),
      now,
    );
    return {
      status: 200,
      body: {
        ok: true,
        sessionId: session.id,
        seq: session.seq,
        challenge: mission.challenge,
      },
    };
  }

  const session = store.get(request.sessionId, now);
  if (session === null) return fail(404, "session-not-found");
  // Stale or duplicate request: the client is not looking at the current state.
  if (request.seq !== session.seq) return fail(409, "stale");
  if (session.tutor.status !== "awaiting-attempt") {
    return fail(409, "session-closed");
  }

  let event: TutorEvent;
  let hintSteps: PracticeFeedbackSteps = null;
  if (request.action === "attempt") {
    const result = evaluateResponse(session.mission.problem, request.answer);
    event = { type: "attempt", outcome: result.status };
    if (result.status !== "invalid" && result.strategy !== undefined) {
      hintSteps = {
        takeToTen: result.strategy.takeToTen,
        takeFromTen: result.strategy.takeFromTen,
      };
    }
  } else {
    event = { type: request.action };
  }

  try {
    const next = step(session.tutor, event);
    session.tutor = next.state;
    session.seq += 1;
    return {
      status: 200,
      body: {
        ok: true,
        seq: session.seq,
        feedback: toFeedback(next.action, next.state, hintSteps),
        sessionStatus: statusOf(next.state),
      },
    };
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return fail(409, "session-closed");
    }
    throw error;
  }
}

type PracticeFeedbackSteps = Extract<
  PracticeFeedback,
  { kind: "hint" }
>["steps"];

function statusOf(state: TutorState): SessionStatus {
  return state.status === "awaiting-attempt" ? "open" : "finished";
}

function toFeedback(
  action: TutorAction,
  state: TutorState,
  steps: PracticeFeedbackSteps,
): PracticeFeedback {
  switch (action.kind) {
    case "confirm-correct":
      return { kind: "correct" };
    case "neutral-feedback":
      return { kind: "neutral-feedback" };
    case "show-hint":
      return {
        kind: "hint",
        hintId: action.hintId,
        hintNumber: state.hintsShown,
        steps,
      };
    case "practice-prerequisite":
      return { kind: "easier-practice" };
    case "offer-skip":
      return { kind: "offer-skip" };
    case "ask-again":
      return { kind: "ask-again" };
    case "skip-item":
      return { kind: "skipped" };
    case "end-session":
      return { kind: "ended", reason: action.reason };
    case "acknowledge-response":
      // Assessment-only action; unreachable in guided practice.
      throw new Error("Unexpected assessment action in practice mission");
  }
}
