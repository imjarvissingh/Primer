import {
  ASSESSMENT_API_PATH,
  type AssessmentReply,
  type AssessmentRequest,
} from "@/lib/assessment-protocol";

export type AssessmentApiResult =
  AssessmentReply | { ok: false; error: "network" };

export async function sendAssessment(
  request: AssessmentRequest,
): Promise<AssessmentApiResult> {
  try {
    const res = await fetch(ASSESSMENT_API_PATH, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      cache: "no-store",
    });
    const data: unknown = await res.json();
    if (typeof data === "object" && data !== null && "ok" in data) {
      return data as AssessmentReply;
    }
    return { ok: false, error: "network" };
  } catch {
    return { ok: false, error: "network" };
  }
}
