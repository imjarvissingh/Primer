import "server-only";
import {
  PRACTICE_MISSION_ID,
  MAX_REQUEST_BYTES,
  type PracticeErrorCode,
  type PracticeRequest,
} from "@/lib/practice-protocol";

export type ParseResult =
  | { ok: true; request: PracticeRequest }
  | { ok: false; error: PracticeErrorCode };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Exactly these keys, no more: unknown fields (an item id, an answer key) are rejected. */
const hasOnlyKeys = (o: Record<string, unknown>, keys: string[]) =>
  Object.keys(o).length === keys.length &&
  keys.every((k) => Object.hasOwn(o, k));

/**
 * Turns an untrusted request body into a typed request, or a safe error.
 * The learner's `answer` is deliberately NOT checked here: any JSON value is
 * passed to the domain evaluator, which classifies unreadable answers as
 * "invalid" and never scores them.
 */
export function parseRequest(raw: string): ParseResult {
  if (new TextEncoder().encode(raw).length > MAX_REQUEST_BYTES) {
    return { ok: false, error: "too-large" };
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return { ok: false, error: "bad-request" };
  }
  if (!isRecord(body)) return { ok: false, error: "bad-request" };

  const bad = { ok: false, error: "bad-request" } as const;

  if (body.action === "start") {
    if (!hasOnlyKeys(body, ["action", "missionId"])) return bad;
    if (body.missionId !== PRACTICE_MISSION_ID) {
      return typeof body.missionId === "string"
        ? { ok: false, error: "unknown-mission" }
        : bad;
    }
    return {
      ok: true,
      request: { action: "start", missionId: PRACTICE_MISSION_ID },
    };
  }

  if (body.action === "attempt") {
    if (!hasOnlyKeys(body, ["action", "sessionId", "seq", "answer"])) {
      // A missing answer is still readable as "missing" by the evaluator.
      if (!hasOnlyKeys(body, ["action", "sessionId", "seq"])) return bad;
    }
  } else if (body.action === "skip" || body.action === "stop") {
    if (!hasOnlyKeys(body, ["action", "sessionId", "seq"])) return bad;
  } else if (body.action === "support") {
    if (!hasOnlyKeys(body, ["action", "sessionId", "seq", "choice"]))
      return bad;
    if (body.choice !== "start" && body.choice !== "decline") return bad;
  } else {
    return bad;
  }

  const { sessionId, seq } = body;
  if (typeof sessionId !== "string" || !UUID.test(sessionId)) return bad;
  if (typeof seq !== "number" || !Number.isSafeInteger(seq) || seq < 0)
    return bad;

  if (body.action === "attempt") {
    return {
      ok: true,
      request: { action: "attempt", sessionId, seq, answer: body.answer },
    };
  }
  if (body.action === "support") {
    return {
      ok: true,
      request: {
        action: "support",
        sessionId,
        seq,
        choice: body.choice as "start" | "decline",
      },
    };
  }
  return { ok: true, request: { action: body.action, sessionId, seq } };
}
