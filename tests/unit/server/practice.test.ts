// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import {
  DELAYED_BANK,
  INDEPENDENT_BANK,
  BASELINE_BANK,
} from "@/domain/assessment";
import { POST } from "@/app/api/practice/bridge/route";
import type {
  PracticeFeedback,
  PracticeRequest,
  PracticeResponse,
} from "@/lib/practice-protocol";
import { getMission } from "@/server/practice/missions";
import { handlePracticeRequest } from "@/server/practice/service";
import {
  MAX_SESSIONS,
  SESSION_TTL_MS,
  SessionStore,
} from "@/server/practice/sessions";
import { parseRequest } from "@/server/practice/validate";

const ID = "123e4567-e89b-42d3-a456-426614174000";
let store: SessionStore;
let counter: number;
const newId = () =>
  `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`;
const T0 = 1_000_000;

function run(req: PracticeRequest, now = T0) {
  return handlePracticeRequest(store, req, now, newId);
}
function begin() {
  const r = run({ action: "start", missionId: "broken-bridge" });
  if (!r.body.ok || !("sessionId" in r.body)) throw new Error("start failed");
  return { id: r.body.sessionId, seq: r.body.seq, challenge: r.body.challenge };
}
/** Submits an answer using the server's current seq, like a well-behaved client. */
function answer(s: { id: string }, seqRef: { seq: number }, value: unknown) {
  const r = run({
    action: "attempt",
    sessionId: s.id,
    seq: seqRef.seq,
    answer: value,
  });
  if (r.body.ok && "feedback" in r.body) seqRef.seq = r.body.seq;
  return r;
}
const feedbackOf = (r: { body: PracticeResponse }): PracticeFeedback => {
  if (!r.body.ok || !("feedback" in r.body)) throw new Error("no feedback");
  return r.body.feedback;
};

beforeEach(() => {
  store = new SessionStore();
  counter = 0;
});

describe("parseRequest", () => {
  const ok = (o: unknown) => parseRequest(JSON.stringify(o));
  it("accepts well-formed requests", () => {
    expect(ok({ action: "start", missionId: "broken-bridge" }).ok).toBe(true);
    expect(ok({ action: "attempt", sessionId: ID, seq: 0, answer: 8 }).ok).toBe(
      true,
    );
    expect(ok({ action: "skip", sessionId: ID, seq: 2 }).ok).toBe(true);
    expect(ok({ action: "stop", sessionId: ID, seq: 2 }).ok).toBe(true);
  });
  it("passes a missing or non-number answer through for the evaluator to reject", () => {
    expect(ok({ action: "attempt", sessionId: ID, seq: 0 }).ok).toBe(true);
    expect(
      ok({ action: "attempt", sessionId: ID, seq: 0, answer: "8" }).ok,
    ).toBe(true);
  });
  it.each([
    ["not JSON", "{nope"],
    ["array", "[]"],
    ["null", "null"],
    ["unknown action", JSON.stringify({ action: "reveal" })],
    ["prototype-ish action", JSON.stringify({ action: "__proto__" })],
    [
      "extra key",
      JSON.stringify({
        action: "start",
        missionId: "broken-bridge",
        itemId: "IN-01",
      }),
    ],
    [
      "client answer key",
      JSON.stringify({
        action: "attempt",
        sessionId: ID,
        seq: 0,
        answer: 8,
        expectedAnswer: 8,
      }),
    ],
    [
      "bad session id",
      JSON.stringify({ action: "skip", sessionId: "abc", seq: 0 }),
    ],
    [
      "fractional seq",
      JSON.stringify({ action: "skip", sessionId: ID, seq: 1.5 }),
    ],
    [
      "negative seq",
      JSON.stringify({ action: "skip", sessionId: ID, seq: -1 }),
    ],
    ["string seq", JSON.stringify({ action: "skip", sessionId: ID, seq: "1" })],
    ["missing mission", JSON.stringify({ action: "start" })],
  ])("rejects %s", (_name, raw) => {
    expect(parseRequest(raw).ok).toBe(false);
  });
  it("rejects unknown mission names, including assessment item ids", () => {
    for (const missionId of [
      "IN-01",
      "BL-05",
      "DL-01",
      "GP-07",
      "constructor",
    ]) {
      expect(ok({ action: "start", missionId })).toEqual({
        ok: false,
        error: "unknown-mission",
      });
    }
  });
  it("rejects oversized bodies", () => {
    const big = JSON.stringify({
      action: "attempt",
      sessionId: ID,
      seq: 0,
      answer: "x".repeat(5000),
    });
    expect(parseRequest(big)).toEqual({ ok: false, error: "too-large" });
  });
});

describe("mission selection", () => {
  it("resolves only the guided-practice 13 - 5 item and exposes just its numbers", () => {
    const mission = getMission("broken-bridge");
    expect(mission?.problem.id).toBe("GP-07");
    expect(mission?.challenge).toEqual({
      missionId: "broken-bridge",
      start: 13,
      takeAway: 5,
      maxAnswer: 20,
    });
  });
  it("never resolves to an item from an assessment bank", () => {
    const reserved = [
      ...BASELINE_BANK.items,
      ...INDEPENDENT_BANK.items,
      ...DELAYED_BANK.items,
    ].map((p) => p.id);
    expect(reserved).not.toContain(getMission("broken-bridge")?.problem.id);
    for (const id of [
      ...reserved,
      "GP-01",
      "constructor",
      "toString",
      7,
      null,
    ]) {
      expect(getMission(id)).toBeNull();
    }
  });
});

describe("start", () => {
  it("returns an opaque session id and the public challenge with no answer", () => {
    const r = run({ action: "start", missionId: "broken-bridge" });
    expect(r.status).toBe(200);
    const text = JSON.stringify(r.body);
    expect(Object.keys(r.body).sort()).toEqual([
      "challenge",
      "ok",
      "seq",
      "sessionId",
    ]);
    for (const banned of [
      "answer",
      "expected",
      "GP-07",
      "S04",
      "reviewStatus",
      "spec",
    ]) {
      expect(text).not.toContain(banned);
    }
  });
});

describe("scoring and tutoring (server-authoritative)", () => {
  it("scores 8 as correct and finishes the session", () => {
    const s = begin();
    const ref = { seq: s.seq };
    const r = answer(s, ref, 8);
    expect(feedbackOf(r)).toEqual({ kind: "correct" });
    expect(r.body).toMatchObject({ sessionStatus: "finished" });
  });

  it.each([5, 0, 13, 9, 20])("scores %i as incorrect", (n) => {
    const s = begin();
    const r = answer(s, { seq: s.seq }, n);
    expect(feedbackOf(r)).toEqual({ kind: "neutral-feedback" });
    expect(r.body).toMatchObject({ sessionStatus: "open" });
  });

  it.each([
    ["string 8", "8"],
    ["decimal", 8.5],
    ["negative", -8],
    ["out of range", 21],
    ["NaN-ish null", null],
    ["boolean", true],
    ["array", [8]],
    ["object", { valueOf: 8 }],
    ["missing", undefined],
  ])("never scores %s as correct", (_n, value) => {
    const s = begin();
    const r = answer(s, { seq: s.seq }, value);
    expect(feedbackOf(r)).toEqual({ kind: "ask-again" });
    expect(r.body).toMatchObject({ sessionStatus: "open" });
  });

  it("offers a skip after repeated unreadable answers, without counting them as wrong", () => {
    const s = begin();
    const ref = { seq: s.seq };
    answer(s, ref, "x");
    answer(s, ref, "x");
    expect(feedbackOf(answer(s, ref, "x"))).toEqual({ kind: "offer-skip" });
    // Still on a fresh first wrong answer: neutral feedback, not a hint.
    expect(feedbackOf(answer(s, ref, 3))).toEqual({ kind: "neutral-feedback" });
  });

  it("follows the Phase 2 sequence: neutral, hint 1, hint 2, easier practice", () => {
    const s = begin();
    const ref = { seq: s.seq };
    expect(feedbackOf(answer(s, ref, 1)).kind).toBe("neutral-feedback");
    expect(feedbackOf(answer(s, ref, 1))).toEqual({
      kind: "hint",
      hintId: "hint.make-ten.fill-to-ten",
      hintNumber: 1,
      steps: { takeToTen: 3, takeFromTen: 2 },
    });
    expect(feedbackOf(answer(s, ref, 1))).toMatchObject({
      kind: "hint",
      hintId: "hint.make-ten.take-rest-from-ten",
      hintNumber: 2,
    });
    const last = answer(s, ref, 1);
    expect(feedbackOf(last)).toEqual({ kind: "easier-practice" });
    expect(last.body).toMatchObject({ sessionStatus: "finished" });
  });

  it("a correct answer after hints is still just confirmation, with no mastery field", () => {
    const s = begin();
    const ref = { seq: s.seq };
    answer(s, ref, 1);
    answer(s, ref, 1);
    const r = answer(s, ref, 8);
    expect(r.body).toEqual({
      ok: true,
      seq: ref.seq,
      feedback: { kind: "correct" },
      sessionStatus: "finished",
    });
  });

  it("never puts the final answer in a response", () => {
    const s = begin();
    const ref = { seq: s.seq };
    const all: string[] = [];
    for (let i = 0; i < 4; i++)
      all.push(JSON.stringify(answer(s, ref, 1).body));
    for (const text of all) {
      expect(text).not.toMatch(/answer|expected|"8"|:8[,}]/);
    }
  });

  it("learner can stop or skip; either finishes the session", () => {
    const a = begin();
    expect(
      feedbackOf(run({ action: "stop", sessionId: a.id, seq: a.seq })),
    ).toEqual({
      kind: "ended",
      reason: "learner-stopped",
    });
    const b = begin();
    expect(
      feedbackOf(run({ action: "skip", sessionId: b.id, seq: b.seq })),
    ).toEqual({
      kind: "skipped",
    });
  });
});

describe("session integrity", () => {
  it("rejects a duplicate submission carrying a stale seq, without changing state", () => {
    const s = begin();
    const first = run({
      action: "attempt",
      sessionId: s.id,
      seq: 0,
      answer: 5,
    });
    const dup = run({ action: "attempt", sessionId: s.id, seq: 0, answer: 5 });
    expect(first.status).toBe(200);
    expect(dup).toEqual({ status: 409, body: { ok: false, error: "stale" } });
    // The duplicate was not counted: this is the second real wrong answer, so a hint follows.
    const next = run({ action: "attempt", sessionId: s.id, seq: 1, answer: 5 });
    expect(feedbackOf(next).kind).toBe("hint");
  });

  it("does not trust a client-supplied future seq", () => {
    const s = begin();
    expect(
      run({ action: "attempt", sessionId: s.id, seq: 99, answer: 8 }).status,
    ).toBe(409);
  });

  it("rejects events after the item is finished", () => {
    const s = begin();
    run({ action: "attempt", sessionId: s.id, seq: 0, answer: 8 });
    expect(
      run({ action: "attempt", sessionId: s.id, seq: 1, answer: 8 }),
    ).toEqual({
      status: 409,
      body: { ok: false, error: "session-closed" },
    });
  });

  it("treats unknown and expired sessions the same safe way", () => {
    expect(run({ action: "skip", sessionId: ID, seq: 0 }).status).toBe(404);
    const s = begin();
    const late = run(
      { action: "skip", sessionId: s.id, seq: 0 },
      T0 + SESSION_TTL_MS + 1,
    );
    expect(late).toEqual({
      status: 404,
      body: { ok: false, error: "session-not-found" },
    });
  });

  it("restart creates an independent session; the old one is untouched", () => {
    const a = begin();
    run({ action: "attempt", sessionId: a.id, seq: 0, answer: 5 });
    const b = begin();
    expect(b.id).not.toBe(a.id);
    expect(
      feedbackOf(run({ action: "attempt", sessionId: b.id, seq: 0, answer: 5 }))
        .kind,
    ).toBe("neutral-feedback");
    expect(getMission("broken-bridge")?.problem.id).toBe("GP-07");
  });

  it("caps stored sessions and evicts the oldest", () => {
    const first = begin();
    for (let i = 0; i < MAX_SESSIONS; i++) begin();
    expect(store.size).toBeLessThanOrEqual(MAX_SESSIONS);
    expect(run({ action: "skip", sessionId: first.id, seq: 0 }).status).toBe(
      404,
    );
  });
});

describe("route handler", () => {
  const call = (
    body: string,
    headers: Record<string, string> = { "content-type": "application/json" },
  ) =>
    POST(
      new Request("http://localhost/api/practice/bridge", {
        method: "POST",
        body,
        headers,
      }),
    );

  it("starts a session and sets no-store", async () => {
    const res = await call(
      JSON.stringify({ action: "start", missionId: "broken-bridge" }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const data = (await res.json()) as PracticeResponse;
    expect(data.ok && "sessionId" in data && data.challenge.start).toBe(13);
  });

  it("completes a correct attempt end to end", async () => {
    const start = (await (
      await call(
        JSON.stringify({ action: "start", missionId: "broken-bridge" }),
      )
    ).json()) as { sessionId: string };
    const res = await call(
      JSON.stringify({
        action: "attempt",
        sessionId: start.sessionId,
        seq: 0,
        answer: 8,
      }),
    );
    expect(await res.json()).toMatchObject({
      ok: true,
      feedback: { kind: "correct" },
    });
  });

  it("rejects malformed, oversized, wrong-type and unknown-mission requests", async () => {
    expect((await call("{bad")).status).toBe(400);
    expect(
      (await call(JSON.stringify({ action: "start", missionId: "IN-01" })))
        .status,
    ).toBe(400);
    expect((await call("x".repeat(5000))).status).toBe(413);
    expect((await call("{}", { "content-type": "text/plain" })).status).toBe(
      415,
    );
    expect((await call("")).status).toBe(400);
  });
});
