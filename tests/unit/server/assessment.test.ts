// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/assessment/route";
import { CURRICULUM } from "@/domain/curriculum";
import {
  DRAFT_EVIDENCE_POLICY,
  interpretSkillEvidence,
  isIndependentEvidence,
  validateEvidenceRecord,
  type EvidenceRecord,
} from "@/domain/evidence";
import {
  BASELINE_BANK,
  DELAYED_BANK,
  GUIDED_PRACTICE_BANK,
  INDEPENDENT_BANK,
} from "@/domain/assessment";
import type {
  AssessmentReply,
  AssessmentRequest,
  AssessmentStepReply,
  AssessmentSummary,
} from "@/lib/assessment-protocol";
import { selectAssessmentItems, toQuestion } from "@/server/assessment/items";
import { handleAssessmentRequest } from "@/server/assessment/service";
import { AssessmentStore } from "@/server/assessment/sessions";
import { parseAssessmentRequest } from "@/server/assessment/validate";
import {
  START_LIMIT,
  START_WINDOW_MS,
  StartLimiter,
} from "@/server/rate-limit";
import { SESSION_TTL_MS } from "@/server/ttl-store";

const ID = "123e4567-e89b-42d3-a456-426614174000";
const T0 = 5_000_000;
let store: AssessmentStore;
let counter: number;
const newId = () =>
  `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`;
const run = (req: AssessmentRequest, now = T0) =>
  handleAssessmentRequest(store, req, now, newId);

/** Correct answers for the four independent items, in order (16-5, 19-7, 14-6, 17-9). */
const RIGHT = [11, 12, 8, 8];

function begin() {
  const r = run({ action: "start" });
  if (!r.body.ok || !("sessionId" in r.body)) throw new Error("start failed");
  return { id: r.body.sessionId, seq: r.body.seq, first: r.body.question };
}
type Session = { id: string; seq: number };
function send(
  s: Session,
  req: Omit<AssessmentRequest, "sessionId" | "seq"> & Record<string, unknown>,
) {
  const r = run({ ...req, sessionId: s.id, seq: s.seq } as AssessmentRequest);
  if (r.body.ok && "ack" in r.body) s.seq = r.body.seq;
  return r;
}
const answer = (s: Session, value: unknown) =>
  send(s, { action: "answer", answer: value });
const step = (r: { body: AssessmentReply }) => {
  if (!r.body.ok || !("ack" in r.body)) throw new Error("not a step reply");
  return r.body as AssessmentStepReply;
};
const summary = (s: Session) => {
  const r = run({ action: "summary", sessionId: s.id });
  if (!r.body.ok || !("counts" in r.body))
    throw new Error(`no summary: ${JSON.stringify(r.body)}`);
  return r.body as AssessmentSummary;
};

beforeEach(() => {
  store = new AssessmentStore();
  counter = 0;
});

describe("item selection", () => {
  it("uses exactly the independent bank, in bank order, and nothing else", () => {
    const items = selectAssessmentItems();
    expect(items.map((p) => p.id)).toEqual(
      INDEPENDENT_BANK.items.map((p) => p.id),
    );
    expect(items.map((p) => p.id)).toEqual([
      "IN-01",
      "IN-02",
      "IN-03",
      "IN-04",
    ]);
    const elsewhere = [
      BASELINE_BANK,
      GUIDED_PRACTICE_BANK,
      DELAYED_BANK,
    ].flatMap((b) => b.items.map((p) => p.id));
    for (const p of items) expect(elsewhere).not.toContain(p.id);
  });

  it("the hand-written answers in these tests match the bank", () => {
    expect(selectAssessmentItems().map((p) => p.answer)).toEqual(RIGHT);
  });

  it("projects each question to display numbers only", () => {
    const q = toQuestion(selectAssessmentItems()[0], 0, 4);
    expect(q).toEqual({
      position: 1,
      total: 4,
      start: 16,
      takeAway: 5,
      maxAnswer: 20,
    });
  });
});

describe("request validation", () => {
  const ok = (o: unknown) => parseAssessmentRequest(JSON.stringify(o));
  it("accepts the five well-formed shapes", () => {
    expect(ok({ action: "start" }).ok).toBe(true);
    expect(ok({ action: "answer", sessionId: ID, seq: 0, answer: 8 }).ok).toBe(
      true,
    );
    expect(ok({ action: "answer", sessionId: ID, seq: 0 }).ok).toBe(true);
    expect(ok({ action: "skip", sessionId: ID, seq: 1 }).ok).toBe(true);
    expect(ok({ action: "stop", sessionId: ID, seq: 1 }).ok).toBe(true);
    expect(ok({ action: "summary", sessionId: ID }).ok).toBe(true);
  });
  it.each([
    ["not JSON", "{no"],
    ["array", "[]"],
    ["unknown action", JSON.stringify({ action: "reveal" })],
    [
      "start with an item id",
      JSON.stringify({ action: "start", itemId: "IN-04" }),
    ],
    ["start with a bank", JSON.stringify({ action: "start", bank: "delayed" })],
    [
      "client-supplied score",
      JSON.stringify({
        action: "answer",
        sessionId: ID,
        seq: 0,
        answer: 8,
        correct: true,
      }),
    ],
    [
      "client-supplied hint count",
      JSON.stringify({
        action: "answer",
        sessionId: ID,
        seq: 0,
        answer: 8,
        hintsUsed: 0,
      }),
    ],
    [
      "client-supplied evidence",
      JSON.stringify({ action: "summary", sessionId: ID, evidence: [] }),
    ],
    ["bad session id", JSON.stringify({ action: "summary", sessionId: "x" })],
    [
      "fractional seq",
      JSON.stringify({ action: "skip", sessionId: ID, seq: 0.5 }),
    ],
    ["string seq", JSON.stringify({ action: "skip", sessionId: ID, seq: "0" })],
  ])("rejects %s", (_n, raw) => {
    expect(parseAssessmentRequest(raw).ok).toBe(false);
  });
  it("rejects oversized bodies", () => {
    const big = JSON.stringify({
      action: "answer",
      sessionId: ID,
      seq: 0,
      answer: "x".repeat(4000),
    });
    expect(parseAssessmentRequest(big)).toEqual({
      ok: false,
      error: "too-large",
    });
  });
});

describe("running the check", () => {
  it("starts with only the first question", () => {
    const s = begin();
    expect(s.first).toMatchObject({
      position: 1,
      total: 4,
      start: 16,
      takeAway: 5,
    });
    expect(Object.keys(s.first).sort()).toEqual([
      "maxAnswer",
      "position",
      "start",
      "takeAway",
      "total",
    ]);
  });

  it("shows exactly one question at a time, in order, never a future one", () => {
    const s = begin();
    const seen: number[] = [];
    for (const value of RIGHT) {
      const r = step(answer(s, value));
      if (r.question) seen.push(r.question.start);
    }
    expect(seen).toEqual([19, 14, 17]); // questions 2, 3, 4; then none
  });

  it("returns a byte-identical reply for a right and a wrong answer", () => {
    const a = begin();
    const b = begin();
    expect(answer(a, 11)).toEqual(answer(b, 3));
    const a2 = answer(a, 12);
    const b2 = answer(b, 0);
    expect(a2).toEqual(b2);
  });

  it("never reveals correctness during the check, in any reply", () => {
    const s = begin();
    const texts = [
      JSON.stringify(answer(s, 11).body),
      JSON.stringify(answer(s, 1).body),
      JSON.stringify(answer(s, 8).body),
      JSON.stringify(send(s, { action: "skip" }).body),
    ];
    for (const t of texts) {
      const keys = Object.keys(JSON.parse(t) as object).sort();
      expect(keys).toEqual(["ack", "ok", "question", "seq", "status"]);
      // "maxAnswer" is the picker's upper bound, so it is removed before scanning.
      expect(t.replace("maxAnswer", "")).not.toMatch(
        /correct|incorrect|wrong|right|expected|answer|score|IN-0|S03|S04/i,
      );
    }
  });

  it("does not score an unreadable answer and keeps the same question", () => {
    const s = begin();
    for (const bad of ["11", 11.5, -1, 21, null, true, [11], undefined]) {
      const r = step(answer(s, bad));
      expect(r.ack).toBe("ask-again");
      expect(r.question).toMatchObject({ position: 1 });
    }
    // Still the first question; the first valid answer is the one that counts.
    expect(step(answer(s, 11)).ack).toBe("recorded");
    expect(step(answer(s, 12)).question).toMatchObject({ position: 3 });
  });

  it("counts only the first scored answer per item", () => {
    const s = begin();
    const stale = { id: s.id, seq: s.seq };
    answer(s, 3); // wrong, scored
    // A replay of the same request cannot score again or move on.
    const replay = run({
      action: "answer",
      sessionId: stale.id,
      seq: stale.seq,
      answer: 11,
    });
    expect(replay).toEqual({
      status: 409,
      body: { ok: false, error: "stale" },
    });
    for (const v of [12, 8, 8]) answer(s, v);
    expect(summary(s).items[0].outcome).toBe("incorrect");
    expect(summary(s).counts).toMatchObject({ answered: 4, correct: 3 });
  });

  it("rejects stale and future sequence numbers without changing state", () => {
    const s = begin();
    expect(
      run({ action: "answer", sessionId: s.id, seq: 9, answer: 11 }).status,
    ).toBe(409);
    expect(run({ action: "skip", sessionId: s.id, seq: 9 }).status).toBe(409);
    expect(step(answer(s, 11)).question).toMatchObject({ position: 2 });
  });

  it("treats skip as not-correct and records no evidence for it", () => {
    const s = begin();
    expect(step(send(s, { action: "skip" })).ack).toBe("skipped");
    for (const v of [12, 8, 8]) answer(s, v);
    const sum = summary(s);
    expect(sum.items[0].outcome).toBe("skipped");
    expect(sum.counts).toEqual({
      total: 4,
      answered: 3,
      correct: 3,
      skipped: 1,
      notReached: 0,
    });
    expect(sum.skills.find((x) => x.id === "S03")).toMatchObject({
      answered: 1,
      correct: 1,
    });
  });

  it("stops early and reports the rest as not reached", () => {
    const s = begin();
    answer(s, 11);
    const r = step(send(s, { action: "stop" }));
    expect(r).toMatchObject({
      ack: "stopped",
      status: "stopped",
      question: null,
    });
    expect(summary(s)).toMatchObject({
      status: "stopped",
      counts: { total: 4, answered: 1, correct: 1, skipped: 0, notReached: 3 },
    });
  });

  it("completes after four items and then refuses further events", () => {
    const s = begin();
    let last!: AssessmentStepReply;
    for (const v of RIGHT) last = step(answer(s, v));
    expect(last).toMatchObject({ status: "complete", question: null });
    expect(
      run({ action: "answer", sessionId: s.id, seq: s.seq, answer: 1 }),
    ).toEqual({
      status: 409,
      body: { ok: false, error: "session-closed" },
    });
    expect(run({ action: "skip", sessionId: s.id, seq: s.seq }).status).toBe(
      409,
    );
  });

  it("handles unknown and expired sessions the same safe way", () => {
    expect(run({ action: "summary", sessionId: ID }).status).toBe(404);
    expect(run({ action: "skip", sessionId: ID, seq: 0 }).status).toBe(404);
    const s = begin();
    expect(
      run({ action: "summary", sessionId: s.id }, T0 + SESSION_TTL_MS + 1)
        .status,
    ).toBe(404);
  });

  it("each start is a fresh session: a retake adds no evidence to an earlier one", () => {
    const a = begin();
    for (const v of RIGHT) answer(a, v);
    const before = JSON.stringify(summary(a));
    const b = begin();
    for (const v of [0, 0, 0, 0]) answer(b, v);
    expect(JSON.stringify(summary(a))).toBe(before);
    expect(summary(b).counts.correct).toBe(0);
  });
});

describe("summary and evidence", () => {
  it("refuses a summary while the check is still running", () => {
    const s = begin();
    expect(run({ action: "summary", sessionId: s.id })).toEqual({
      status: 409,
      body: { ok: false, error: "not-finished" },
    });
  });

  it("derives counts from the server's own evaluation", () => {
    const s = begin();
    for (const v of [11, 0, 8, 0]) answer(s, v);
    const sum = summary(s);
    expect(sum.synthetic).toBe(true);
    expect(sum.counts).toEqual({
      total: 4,
      answered: 4,
      correct: 2,
      skipped: 0,
      notReached: 0,
    });
    expect(sum.items.map((i) => i.outcome)).toEqual([
      "correct",
      "incorrect",
      "correct",
      "incorrect",
    ]);
    expect(sum.items.map((i) => i.expression)).toEqual([
      "16 − 5",
      "19 − 7",
      "14 − 6",
      "17 − 9",
    ]);
    expect(sum.skills.map((k) => [k.id, k.answered, k.correct])).toEqual([
      ["S03", 2, 1],
      ["S04", 2, 1],
    ]);
  });

  it("keeps version provenance, zero hints and the independent phase", () => {
    const s = begin();
    for (const v of RIGHT) answer(s, v);
    expect(summary(s).provenance).toEqual({
      phase: "independent",
      hintsUsed: 0,
      contentReview: "draft",
      curriculumVersion: CURRICULUM.curriculumVersion,
      contentVersion: CURRICULUM.contentVersion,
    });
  });

  it("awards no mastery even for a perfect score, and only ever says needs-more-evidence", () => {
    const s = begin();
    for (const v of RIGHT) answer(s, v);
    const sum = summary(s);
    expect(sum.counts.correct).toBe(4);
    expect(sum.mastery).toEqual({
      awarded: false,
      state: "emerging",
      policy: "draft-unapproved",
    });
    expect(
      sum.skills.every((k) => k.observation === "Needs more evidence"),
    ).toBe(true);
    expect(JSON.stringify(sum)).not.toMatch(/mastered|provisional|confirmed/i);
  });

  it("says not-assessed when nothing was answered", () => {
    const s = begin();
    send(s, { action: "stop" });
    const sum = summary(s);
    expect(sum.mastery.state).toBe("not-assessed");
    expect(sum.skills.every((k) => k.observation === "Not yet assessed")).toBe(
      true,
    );
  });

  it("contains no answer key, item id or bank metadata", () => {
    const s = begin();
    for (const v of RIGHT) answer(s, v);
    const text = JSON.stringify(summary(s));
    for (const banned of [
      "expectedAnswer",
      "IN-0",
      "eligibleBank",
      "reviewStatus",
      "itemId",
      '"answer"',
    ]) {
      expect(text).not.toContain(banned);
    }
  });
});

describe("assessment is separate from guided practice", () => {
  it("has its own store, so a practice id is unknown to the assessment and vice versa", async () => {
    const { handlePracticeRequest } = await import("@/server/practice/service");
    const { SessionStore } = await import("@/server/practice/sessions");
    const practice = new SessionStore();
    const p = handlePracticeRequest(
      practice,
      { action: "start", missionId: "subtract-practice" },
      T0,
      newId,
    );
    if (!p.body.ok || !("sessionId" in p.body))
      throw new Error("practice start failed");
    expect(run({ action: "summary", sessionId: p.body.sessionId }).status).toBe(
      404,
    );
  });

  it("source never uses practice hints, prerequisite remediation or the guided-practice bank", () => {
    const dir = "src/server/assessment";
    for (const f of readdirSync(dir)) {
      const text = readFileSync(`${dir}/${f}`, "utf8");
      expect(text, f).not.toMatch(
        /GUIDED_PRACTICE_BANK|BASELINE_BANK|DELAYED_BANK|HINT_LADDERS|show-hint|practice-prerequisite/,
      );
      expect(text, f).not.toMatch(/console\./);
    }
    expect(readFileSync("src/app/api/assessment/route.ts", "utf8")).not.toMatch(
      /console\./,
    );
  });
});

describe("route handler", () => {
  const call = (
    body: string,
    headers: Record<string, string> = { "content-type": "application/json" },
  ) =>
    POST(
      new Request("http://localhost/api/assessment", {
        method: "POST",
        body,
        headers,
      }),
    );

  it("runs a whole check over HTTP and sets no-store", async () => {
    const start = await call(JSON.stringify({ action: "start" }));
    expect(start.headers.get("cache-control")).toBe("no-store");
    const s = (await start.json()) as { sessionId: string };
    let seq = 0;
    for (const v of RIGHT) {
      const res = await call(
        JSON.stringify({
          action: "answer",
          sessionId: s.sessionId,
          seq,
          answer: v,
        }),
      );
      seq = ((await res.json()) as { seq: number }).seq;
    }
    const sum = (await (
      await call(JSON.stringify({ action: "summary", sessionId: s.sessionId }))
    ).json()) as AssessmentSummary;
    expect(sum.counts.correct).toBe(4);
  });

  it("rejects malformed, oversized and wrong-type requests", async () => {
    expect((await call("{bad")).status).toBe(400);
    expect(
      (await call(JSON.stringify({ action: "start", itemId: "IN-01" }))).status,
    ).toBe(400);
    expect((await call("x".repeat(5000))).status).toBe(413);
    expect((await call("{}", { "content-type": "text/plain" })).status).toBe(
      415,
    );
    expect((await call("")).status).toBe(400);
  });
});

describe("evidence integrity (the contract the summary relies on)", () => {
  const rec = (over: Partial<EvidenceRecord>): EvidenceRecord => ({
    curriculumVersion: CURRICULUM.curriculumVersion,
    contentVersion: CURRICULUM.contentVersion,
    skillId: "S03",
    problemId: "IN-01",
    phase: "independent",
    correct: true,
    hintsUsed: 0,
    sequence: 0,
    occurredAtMs: 1,
    ...over,
  });

  it("rejects an assessment record that claims a hint", () => {
    expect(validateEvidenceRecord(rec({ hintsUsed: 1 })).ok).toBe(false);
  });

  it("never treats guided practice as independent, even with zero hints", () => {
    expect(isIndependentEvidence(rec({ phase: "guided-practice" }))).toBe(
      false,
    );
    const s = interpretSkillEvidence("S03", [
      rec({ phase: "guided-practice", problemId: "GP-05", sequence: 0 }),
      rec({ phase: "guided-practice", problemId: "GP-06", sequence: 1 }),
    ]);
    expect(s.counts.independentCorrect).toBe(0);
    expect(s.state).toBe("practicing");
  });

  it("counts a retaken item once, using the first attempt", () => {
    const s = interpretSkillEvidence("S03", [
      rec({ correct: false, sequence: 0 }),
      rec({ correct: true, sequence: 1 }),
    ]);
    expect(s.counts).toMatchObject({
      independentCorrect: 0,
      independentIncorrect: 1,
    });
  });

  it("handles missing items conservatively", () => {
    expect(interpretSkillEvidence("S04", []).state).toBe("not-assessed");
  });

  it("cannot award mastery under the draft policy, however many are correct", () => {
    const records = ["IN-01", "IN-02"].map((id, sequence) =>
      rec({ problemId: id, sequence }),
    );
    const s = interpretSkillEvidence("S03", records, DRAFT_EVIDENCE_POLICY);
    expect(s.counts.independentCorrect).toBe(2);
    expect(s.state).toBe("emerging");
    expect(s.policyApproval).toBe("draft-unapproved");
  });
});

describe("start rate limit", () => {
  it("caps starts per window without reading any identifier, then recovers", () => {
    const limiter = new StartLimiter();
    for (let i = 0; i < START_LIMIT; i++) {
      expect(limiter.allow(1_000)).toBe(true);
    }
    expect(limiter.allow(1_000)).toBe(false);
    expect(limiter.allow(1_000 + START_WINDOW_MS - 1)).toBe(false);
    expect(limiter.allow(1_000 + START_WINDOW_MS)).toBe(true);
  });

  it("has no configuration path: the cap is a constant and no env var, header or test mode can change it", () => {
    expect(START_LIMIT).toBe(120);
    expect(START_WINDOW_MS).toBe(60_000);
    const src = readFileSync(
      path.resolve(process.cwd(), "src/server/rate-limit.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/process\.env|PRIMER_START_LIMIT|NODE_ENV/);
    // Nothing in the app or its tests may reintroduce an override.
    for (const f of [
      "src/app/api/assessment/route.ts",
      "src/app/api/practice/mission/route.ts",
      "playwright.config.ts",
    ]) {
      const text = readFileSync(path.resolve(process.cwd(), f), "utf8");
      expect(text, f).not.toMatch(/PRIMER_START_LIMIT/);
    }
  });

  it("is applied to starts only and reads no client identifier", () => {
    for (const file of [
      "src/app/api/assessment/route.ts",
      "src/app/api/practice/mission/route.ts",
    ]) {
      const src = readFileSync(path.resolve(process.cwd(), file), "utf8");
      expect(src, file).toMatch(/action === "start"/);
      expect(src, file).not.toMatch(/x-forwarded-for|x-real-ip/i);
    }
  });
});
