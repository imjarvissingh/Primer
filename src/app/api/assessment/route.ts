import { MAX_ASSESSMENT_REQUEST_BYTES } from "@/lib/assessment-protocol";
import { handleAssessmentRequest } from "@/server/assessment/service";
import { defaultAssessmentStore } from "@/server/assessment/sessions";
import { parseAssessmentRequest } from "@/server/assessment/validate";
import { readBounded } from "@/server/http";
import { startLimiter } from "@/server/rate-limit";

const HEADERS = { "Cache-Control": "no-store" };
const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: HEADERS });

/**
 * Demo independent-assessment API. Unauthenticated and in-memory: it collects
 * no personal data and is NOT secure assessment infrastructure. Nothing a
 * learner submits is logged. See docs/ARCHITECTURE.md.
 */
export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return json({ ok: false, error: "bad-request" }, 415);
  }
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_ASSESSMENT_REQUEST_BYTES) {
    return json({ ok: false, error: "too-large" }, 413);
  }
  const raw = await readBounded(request, MAX_ASSESSMENT_REQUEST_BYTES + 1);

  const parsed = parseAssessmentRequest(raw);
  if (!parsed.ok) {
    return json(
      { ok: false, error: parsed.error },
      parsed.error === "too-large" ? 413 : 400,
    );
  }
  if (
    parsed.request.action === "start" &&
    !startLimiter("assessment").allow(Date.now())
  ) {
    return json({ ok: false, error: "rate-limited" }, 429);
  }
  try {
    const reply = handleAssessmentRequest(
      defaultAssessmentStore(),
      parsed.request,
      Date.now(),
      () => crypto.randomUUID(),
    );
    return json(reply.body, reply.status);
  } catch {
    // Never echo internals, which could include problem data.
    return json({ ok: false, error: "server-error" }, 500);
  }
}
