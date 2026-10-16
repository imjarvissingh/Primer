import { MAX_REQUEST_BYTES } from "@/lib/practice-protocol";
import { readBounded } from "@/server/http";
import { startLimiter } from "@/server/rate-limit";
import { handlePracticeRequest } from "@/server/practice/service";
import { defaultStore } from "@/server/practice/sessions";
import { parseRequest } from "@/server/practice/validate";

const HEADERS = { "Cache-Control": "no-store" };

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: HEADERS });

/**
 * Demo practice API for the Broken Bridge mission. Unauthenticated and
 * in-memory: it collects no personal data and is NOT secure assessment
 * infrastructure. See docs/ARCHITECTURE.md.
 */
export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return json({ ok: false, error: "bad-request" }, 415);
  }
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_REQUEST_BYTES) {
    return json({ ok: false, error: "too-large" }, 413);
  }
  // Read at most one byte past the limit so an absent or false length cannot force a big read.
  const raw = await readBounded(request, MAX_REQUEST_BYTES + 1);

  const parsed = parseRequest(raw);
  if (!parsed.ok) {
    return json(
      { ok: false, error: parsed.error },
      parsed.error === "too-large" ? 413 : 400,
    );
  }
  if (
    parsed.request.action === "start" &&
    !startLimiter("practice").allow(Date.now())
  ) {
    return json({ ok: false, error: "rate-limited" }, 429);
  }
  try {
    const reply = handlePracticeRequest(
      defaultStore(),
      parsed.request,
      Date.now(),
      () => crypto.randomUUID(),
    );
    return json(reply.body, reply.status);
  } catch {
    // Never echo internals (which could include problem data) to the client.
    return json({ ok: false, error: "server-error" }, 500);
  }
}
