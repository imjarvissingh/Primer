import { connection } from "next/server";

/**
 * Liveness probe for a hosting platform. Returns no session, count, version or
 * configuration data: it only says the process is up and answering.
 */
export async function GET() {
  await connection();
  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
