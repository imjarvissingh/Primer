import "server-only";
import type { TutorState } from "@/domain/tutoring";
import type { Mission } from "./missions";
import { TtlStore, singleton } from "../ttl-store";

export { MAX_SESSIONS, SESSION_TTL_MS } from "../ttl-store";

export interface PracticeSession {
  readonly id: string;
  readonly mission: Mission;
  tutor: TutorState;
  /** Counts accepted events. A request must quote the current value. */
  seq: number;
  expiresAt: number;
}

export class SessionStore extends TtlStore<PracticeSession> {
  create(
    id: string,
    mission: Mission,
    tutor: TutorState,
    now: number,
  ): PracticeSession {
    return this.add(
      id,
      (expiresAt) => ({ id, mission, tutor, seq: 0, expiresAt }),
      now,
    );
  }
}

/** One store per server process; survives dev hot reloads. */
export function defaultStore(): SessionStore {
  return singleton("primer.practice.sessionStore", () => new SessionStore());
}
