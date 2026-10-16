import {
  PRACTICE_API_PATH,
  type PracticeRequest,
  type PracticeResponse,
} from "@/lib/practice-protocol";

export type ApiResult = PracticeResponse | { ok: false; error: "network" };

export async function sendPractice(
  request: PracticeRequest,
): Promise<ApiResult> {
  try {
    const res = await fetch(PRACTICE_API_PATH, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      cache: "no-store",
    });
    const data: unknown = await res.json();
    if (typeof data === "object" && data !== null && "ok" in data) {
      return data as PracticeResponse;
    }
    return { ok: false, error: "network" };
  } catch {
    return { ok: false, error: "network" };
  }
}
