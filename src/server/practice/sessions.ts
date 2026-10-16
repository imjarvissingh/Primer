import "server-only";
import type { TutorState } from "@/domain/tutoring";
import type { Mission, SupportMission } from "./missions";
import { TtlStore, singleton } from "../ttl-store";

export { MAX_SESSIONS, SESSION_TTL_MS } from "../ttl-store";

/**
 * Where the learner is in the one session:
 *  - "main":          answering the mission.
 *  - "support-offer": the policy asked for easier practice; waiting for a yes/no.
 *  - "support":       answering the short warm-up. `tutor` then belongs to the warm-up.
 */
export type SessionStage = "main" | "support-offer" | "support";

export interface PracticeSession {
  readonly id: string;
  readonly mission: Mission;
  tutor: TutorState;
  stage: SessionStage;
  /** The warm-up is offered at most once per session, so help can never loop. */
  supportUsed: boolean;
  /** SERVER-SIDE ONLY: set while a warm-up is offered or running. */
  support: SupportMission | null;
  /** Hints shown on the mission before the warm-up. Carried back so help stays visible. */
  hintsBeforeSupport: number;
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
      (expiresAt) => ({
        id,
        mission,
        tutor,
        stage: "main",
        supportUsed: false,
        support: null,
        hintsBeforeSupport: 0,
        seq: 0,
        expiresAt,
      }),
      now,
    );
  }
}

/** One store per server process; survives dev hot reloads. */
export function defaultStore(): SessionStore {
  return singleton("primer.practice.sessionStore", () => new SessionStore());
}
