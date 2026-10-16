import "server-only";
import { evaluateResponse } from "@/domain/math";
import { startItem, step, type TutorEvent } from "@/domain/tutoring";
import type {
  AssessmentAck,
  AssessmentFailure,
  AssessmentRequest,
  AssessmentStartReply,
  AssessmentStepReply,
  AssessmentSummary,
} from "@/lib/assessment-protocol";
import { selectAssessmentItems, toQuestion } from "./items";
import type { AssessmentSession, AssessmentStore } from "./sessions";
import { buildSummary } from "./summary";

export interface AssessmentServiceReply {
  status: number;
  body:
    | AssessmentStartReply
    | AssessmentStepReply
    | AssessmentSummary
    | AssessmentFailure;
}

const fail = (
  status: number,
  error: AssessmentFailure["error"],
): AssessmentServiceReply => ({ status, body: { ok: false, error } });

const questionOf = (s: AssessmentSession) =>
  s.status === "in-progress"
    ? toQuestion(s.items[s.index], s.index, s.items.length)
    : null;

/**
 * Runs one validated request. The Phase 2 evaluator scores, and the Phase 2
 * tutoring policy in its assessment phase decides the reply: the same neutral
 * acknowledgement for a right and a wrong answer, no hints, one scored try.
 */
export function handleAssessmentRequest(
  store: AssessmentStore,
  request: AssessmentRequest,
  now: number,
  newId: () => string,
): AssessmentServiceReply {
  if (request.action === "start") {
    const items = selectAssessmentItems();
    const session = store.create(
      newId(),
      items,
      startItem("independent", items[0].skillId),
      now,
    );
    return {
      status: 200,
      body: {
        ok: true,
        sessionId: session.id,
        seq: session.seq,
        question: toQuestion(items[0], 0, items.length),
      },
    };
  }

  const session = store.get(request.sessionId, now);
  if (session === null) return fail(404, "session-not-found");

  if (request.action === "summary") {
    if (session.status === "in-progress") return fail(409, "not-finished");
    return { status: 200, body: buildSummary(session) };
  }

  if (request.seq !== session.seq) return fail(409, "stale");
  if (session.status !== "in-progress") return fail(409, "session-closed");

  const problem = session.items[session.index];
  let event: TutorEvent;
  let correct: boolean | null = null;
  if (request.action === "answer") {
    const result = evaluateResponse(problem, request.answer);
    event = { type: "attempt", outcome: result.status };
    if (result.status !== "invalid") correct = result.status === "correct";
  } else {
    event = { type: request.action };
  }

  const next = step(session.tutor, event);
  session.tutor = next.state;
  session.seq += 1;

  let ack: AssessmentAck;
  switch (next.action.kind) {
    case "ask-again":
    case "offer-skip":
      // Unreadable answer: not scored, nothing recorded, the same item stays active.
      ack = "ask-again";
      break;
    case "acknowledge-response":
      session.records.push({
        problemId: problem.id,
        outcome: "answered",
        correct,
        occurredAtMs: now,
      });
      ack = "recorded";
      advance(session);
      break;
    case "skip-item":
      session.records.push({
        problemId: problem.id,
        outcome: "skipped",
        correct: null,
        occurredAtMs: now,
      });
      ack = "skipped";
      advance(session);
      break;
    case "end-session":
      session.status = "stopped";
      ack = "stopped";
      break;
    default:
      // Practice-only actions cannot occur in the independent phase.
      throw new Error("Unexpected tutoring action in assessment");
  }

  return {
    status: 200,
    body: {
      ok: true,
      seq: session.seq,
      ack,
      status: session.status,
      question: questionOf(session),
    },
  };
}

function advance(session: AssessmentSession) {
  session.index += 1;
  if (session.index >= session.items.length) {
    session.status = "complete";
    return;
  }
  session.tutor = startItem(
    "independent",
    session.items[session.index].skillId,
  );
}
