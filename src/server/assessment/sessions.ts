import "server-only";
import type { ValidatedProblem } from "@/domain/math";
import type { TutorState } from "@/domain/tutoring";
import { TtlStore, singleton } from "../ttl-store";

/** What the server remembers about one item. `correct` is never sent during the check. */
export interface ItemRecord {
  readonly problemId: string;
  readonly outcome: "answered" | "skipped";
  /** Set only when outcome is "answered"; derived by the evaluator, never from the client. */
  readonly correct: boolean | null;
  readonly occurredAtMs: number;
}

export interface AssessmentSession {
  readonly id: string;
  /** SERVER-SIDE ONLY: answer-bearing problems, in the fixed presentation order. */
  readonly items: readonly ValidatedProblem[];
  /** Index of the active item. */
  index: number;
  tutor: TutorState;
  /** Counts accepted events. A request must quote the current value. */
  seq: number;
  status: "in-progress" | "complete" | "stopped";
  /** First scored (or skipped) outcome per item. At most one entry per item. */
  records: ItemRecord[];
  expiresAt: number;
}

export class AssessmentStore extends TtlStore<AssessmentSession> {
  create(
    id: string,
    items: readonly ValidatedProblem[],
    tutor: TutorState,
    now: number,
  ): AssessmentSession {
    return this.add(
      id,
      (expiresAt) => ({
        id,
        items,
        index: 0,
        tutor,
        seq: 0,
        status: "in-progress",
        records: [],
        expiresAt,
      }),
      now,
    );
  }
}

export function defaultAssessmentStore(): AssessmentStore {
  return singleton(
    "primer.assessment.sessionStore",
    () => new AssessmentStore(),
  );
}
