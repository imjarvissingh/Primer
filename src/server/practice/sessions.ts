import "server-only";
import type { TutorState } from "@/domain/tutoring";
import type { Mission } from "./missions";

/** Sessions expire this long after their last use. */
export const SESSION_TTL_MS = 30 * 60 * 1000;
/** Hard cap so a flood of "start" calls cannot grow memory without bound. */
export const MAX_SESSIONS = 500;

export interface PracticeSession {
  readonly id: string;
  readonly mission: Mission;
  tutor: TutorState;
  /** Counts accepted events. A request must quote the current value. */
  seq: number;
  expiresAt: number;
}

/**
 * Short-lived, in-memory sessions for the demo. Nothing is persisted: a server
 * restart, a new serverless instance or a TTL expiry all end a session, and the
 * client is told to start again. Holds no learner identity.
 */
export class SessionStore {
  private readonly sessions = new Map<string, PracticeSession>();

  create(
    id: string,
    mission: Mission,
    tutor: TutorState,
    now: number,
  ): PracticeSession {
    this.prune(now);
    // Map keeps insertion order, so the first key is the oldest session.
    while (this.sessions.size >= MAX_SESSIONS) {
      const oldest = this.sessions.keys().next().value;
      if (oldest === undefined) break;
      this.sessions.delete(oldest);
    }
    const session: PracticeSession = {
      id,
      mission,
      tutor,
      seq: 0,
      expiresAt: now + SESSION_TTL_MS,
    };
    this.sessions.set(id, session);
    return session;
  }

  get(id: string, now: number): PracticeSession | null {
    const session = this.sessions.get(id);
    if (session === undefined) return null;
    if (session.expiresAt <= now) {
      this.sessions.delete(id);
      return null;
    }
    session.expiresAt = now + SESSION_TTL_MS;
    return session;
  }

  get size(): number {
    return this.sessions.size;
  }

  private prune(now: number) {
    for (const [id, s] of this.sessions) {
      if (s.expiresAt <= now) this.sessions.delete(id);
    }
  }
}

const GLOBAL_KEY = Symbol.for("primer.practice.sessionStore");
type WithStore = typeof globalThis & { [GLOBAL_KEY]?: SessionStore };

/** One store per server process; survives dev hot reloads. */
export function defaultStore(): SessionStore {
  const g = globalThis as WithStore;
  g[GLOBAL_KEY] ??= new SessionStore();
  return g[GLOBAL_KEY];
}
