import "server-only";
import {
  MAX_ASSESSMENT_REQUEST_BYTES,
  type AssessmentErrorCode,
  type AssessmentRequest,
} from "@/lib/assessment-protocol";

export type ParseResult =
  | { ok: true; request: AssessmentRequest }
  | { ok: false; error: AssessmentErrorCode };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const keysAre = (o: Record<string, unknown>, keys: string[]) =>
  Object.keys(o).length === keys.length &&
  keys.every((k) => Object.hasOwn(o, k));

const BAD = { ok: false, error: "bad-request" } as const;

/**
 * Turns an untrusted body into a typed request, or a safe error. Exact keys
 * only: a client cannot name an item, a score, a hint count or an evidence
 * field. `answer` is passed on untouched for the domain evaluator to classify.
 */
export function parseAssessmentRequest(raw: string): ParseResult {
  if (new TextEncoder().encode(raw).length > MAX_ASSESSMENT_REQUEST_BYTES) {
    return { ok: false, error: "too-large" };
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return BAD;
  }
  if (!isRecord(body)) return BAD;

  if (body.action === "start") {
    return keysAre(body, ["action"])
      ? { ok: true, request: { action: "start" } }
      : BAD;
  }

  const sessionId = body.sessionId;
  if (typeof sessionId !== "string" || !UUID.test(sessionId)) return BAD;

  if (body.action === "summary") {
    return keysAre(body, ["action", "sessionId"])
      ? { ok: true, request: { action: "summary", sessionId } }
      : BAD;
  }

  const { seq } = body;
  if (typeof seq !== "number" || !Number.isSafeInteger(seq) || seq < 0)
    return BAD;

  if (body.action === "answer") {
    // A missing answer is readable as "missing" by the evaluator, so allow both shapes.
    if (
      !keysAre(body, ["action", "sessionId", "seq", "answer"]) &&
      !keysAre(body, ["action", "sessionId", "seq"])
    ) {
      return BAD;
    }
    return {
      ok: true,
      request: { action: "answer", sessionId, seq, answer: body.answer },
    };
  }
  if (body.action === "skip" || body.action === "stop") {
    return keysAre(body, ["action", "sessionId", "seq"])
      ? { ok: true, request: { action: body.action, sessionId, seq } }
      : BAD;
  }
  return BAD;
}
