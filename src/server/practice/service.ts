import "server-only";
import { evaluateResponse, type EvaluationResult } from "@/domain/math";
import {
  InvalidTransitionError,
  startItem,
  step,
  type HintId,
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
import { getMission, getSupportMission } from "./missions";
import type { PracticeSession, SessionStore } from "./sessions";

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

function ok(
  session: PracticeSession,
  feedback: PracticeFeedback,
  sessionStatus: SessionStatus,
): ServiceReply {
  session.seq += 1;
  return {
    status: 200,
    body: { ok: true, seq: session.seq, feedback, sessionStatus },
  };
}

/**
 * Runs one validated request against the session store. All correctness and
 * tutoring decisions happen here, using the Phase 2 evaluator and policy.
 * The service only ORCHESTRATES what the policy already authorizes (a hint, or
 * the `practice-prerequisite` action); it adds no tutoring rules of its own
 * beyond "the warm-up is offered once".
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

  if (session.stage === "support-offer") return handleOffer(session, request);
  if (request.action === "support") return fail(409, "session-closed");
  if (session.tutor.status !== "awaiting-attempt") {
    return fail(409, "session-closed");
  }
  return handleEvent(session, request);
}

/** While the warm-up is on offer, only "yes", "no" or "stop" are meaningful. */
function handleOffer(
  session: PracticeSession,
  request: PracticeRequest,
): ServiceReply {
  if (request.action === "stop") {
    session.tutor = { ...session.tutor, status: "ended" };
    return ok(
      session,
      { kind: "ended", reason: "learner-stopped" },
      "finished",
    );
  }
  if (request.action !== "support" || session.support === null) {
    return fail(409, "session-closed");
  }
  if (request.choice === "decline") {
    // Back to "main" with a finished item, so any later request is refused.
    session.stage = "main";
    session.support = null;
    return ok(session, { kind: "easier-practice" }, "finished");
  }
  session.stage = "support";
  session.supportUsed = true;
  session.hintsBeforeSupport = session.tutor.hintsShown;
  session.tutor = startItem("guided-practice", session.support.problem.skillId);
  return ok(
    session,
    { kind: "support-started", challenge: session.support.challenge },
    "open",
  );
}

function handleEvent(
  session: PracticeSession,
  request: Exclude<PracticeRequest, { action: "start" | "support" }>,
): ServiceReply {
  const inSupport = session.stage === "support";
  const problem =
    inSupport && session.support !== null
      ? session.support.problem
      : session.mission.problem;

  let event: TutorEvent;
  let result: EvaluationResult | null = null;
  if (request.action === "attempt") {
    result = evaluateResponse(problem, request.answer);
    event = { type: "attempt", outcome: result.status };
  } else {
    event = { type: request.action };
  }

  try {
    const next = step(session.tutor, event);
    session.tutor = next.state;
    const action = next.action;

    if (inSupport) {
      // Anything that finishes the warm-up (including the policy's own
      // "easier practice" for the warm-up) simply returns to the mission.
      if (
        action.kind === "confirm-correct" ||
        action.kind === "skip-item" ||
        action.kind === "practice-prerequisite" ||
        (action.kind === "end-session" && action.reason === "unproductive")
      ) {
        return returnToMission(session);
      }
    } else if (action.kind === "practice-prerequisite") {
      const support = session.supportUsed
        ? null
        : getSupportMission(action.skillId);
      if (support !== null) {
        session.stage = "support-offer";
        session.support = support;
        return ok(session, { kind: "support-offer" }, "open");
      }
    }

    return ok(
      session,
      toFeedback(action, next.state, result),
      statusOf(next.state),
    );
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return fail(409, "session-closed");
    }
    throw error;
  }
}

/** Fresh try at the mission. Earlier hints stay counted, so help is never hidden. */
function returnToMission(session: PracticeSession): ServiceReply {
  session.stage = "main";
  session.support = null;
  session.tutor = {
    ...startItem("guided-practice", session.mission.problem.skillId),
    hintsShown: session.hintsBeforeSupport,
  };
  return ok(session, { kind: "support-finished" }, "open");
}

function statusOf(state: TutorState): SessionStatus {
  return state.status === "awaiting-attempt" ? "open" : "finished";
}

/**
 * Discloses only what the hint being shown uses. The first make-ten hint gets
 * the extras to take first; the number still to take from the ten arrives only
 * with the second hint.
 */
function authorizedSteps(
  hintId: HintId,
  result: EvaluationResult | null,
): Extract<PracticeFeedback, { kind: "hint" }>["steps"] {
  if (result === null || result.status === "invalid") return null;
  const strategy = result.strategy;
  if (strategy === undefined) return null;
  if (hintId === "hint.make-ten.fill-to-ten") {
    return { takeToTen: strategy.takeToTen, takeFromTen: null };
  }
  if (hintId === "hint.make-ten.take-rest-from-ten") {
    return {
      takeToTen: strategy.takeToTen,
      takeFromTen: strategy.takeFromTen,
    };
  }
  return null;
}

function toFeedback(
  action: TutorAction,
  state: TutorState,
  result: EvaluationResult | null,
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
        steps: authorizedSteps(action.hintId, result),
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
