import "server-only";
import { singleton } from "./ttl-store";

/** At most this many new sessions per window, per server process (not per person). */
export const START_LIMIT = 120;
export const START_WINDOW_MS = 60 * 1000;

/**
 * A deliberately small fixed-window cap on session starts. It exists so a flood
 * of "start" calls cannot churn the bounded session store and evict sessions
 * that are in use. It is global to one process: no IP address, header or other
 * identifier is read, so it fingerprints nobody, and it is NOT robust across
 * several server instances.
 */
export class StartLimiter {
  private windowStart = Number.NEGATIVE_INFINITY;
  private used = 0;

  constructor(private readonly limit: number = START_LIMIT) {}

  /** Returns true if one more start is allowed right now. */
  allow(now: number): boolean {
    if (now - this.windowStart >= START_WINDOW_MS || now < this.windowStart) {
      this.windowStart = now;
      this.used = 0;
    }
    if (this.used >= this.limit) return false;
    this.used += 1;
    return true;
  }
}

/**
 * Reads PRIMER_START_LIMIT, which only the Playwright test server sets: the
 * browser suite starts more sessions per minute than the production cap allows
 * and would otherwise fail on its own traffic. Anything that is not a whole
 * number from 1 to 100000 is ignored, so a bad value can never disable the cap.
 */
export function configuredStartLimit(raw: string | undefined): number {
  if (raw === undefined || !/^[0-9]{1,6}$/.test(raw)) return START_LIMIT;
  const n = Number(raw);
  return n >= 1 && n <= 100_000 ? n : START_LIMIT;
}

/** Separate limiters so one flow cannot starve the other. */
export function startLimiter(flow: "practice" | "assessment"): StartLimiter {
  return singleton(
    `primer.${flow}.startLimiter`,
    () =>
      new StartLimiter(configuredStartLimit(process.env.PRIMER_START_LIMIT)),
  );
}
