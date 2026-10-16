import { describe, expect, it } from "vitest";
import {
  ASSESSMENT_PHASES,
  type InstructionalSkillId,
} from "@/domain/curriculum";
import {
  HINT_LADDERS,
  InvalidTransitionError,
  MAX_INCORRECT_PRACTICE_ATTEMPTS,
  startItem,
  step,
  type TutorAction,
  type TutorEvent,
  type TutorState,
} from "@/domain/tutoring";

const correct: TutorEvent = { type: "attempt", outcome: "correct" };
const incorrect: TutorEvent = { type: "attempt", outcome: "incorrect" };
const invalid: TutorEvent = { type: "attempt", outcome: "invalid" };

/** Applies events in order and returns every action taken plus the final state. */
function run(state: TutorState, events: TutorEvent[]) {
  const actions: TutorAction[] = [];
  let current = state;
  for (const event of events) {
    const result = step(current, event);
    actions.push(result.action);
    current = result.state;
  }
  return { actions, state: current };
}

describe("guided practice", () => {
  const fresh = () => startItem("guided-practice", "S04");

  it("confirms a correct first attempt as independent", () => {
    const { state, action } = step(fresh(), correct);
    expect(action).toEqual({ kind: "confirm-correct", independent: true });
    expect(state.status).toBe("item-complete");
  });

  it("gives neutral feedback, with no hint, on the first incorrect attempt", () => {
    const { state, action } = step(fresh(), incorrect);
    expect(action).toEqual({ kind: "neutral-feedback" });
    expect(state.hintsShown).toBe(0);
    expect(state.status).toBe("awaiting-attempt");
  });

  it("escalates through the approved hint ladder in order", () => {
    const { actions } = run(fresh(), [incorrect, incorrect, incorrect]);
    expect(actions).toEqual([
      { kind: "neutral-feedback" },
      { kind: "show-hint", hintId: HINT_LADDERS.S04[0] },
      { kind: "show-hint", hintId: HINT_LADDERS.S04[1] },
    ]);
  });

  it("marks a correct answer after a hint as NOT independent", () => {
    const { actions } = run(fresh(), [incorrect, incorrect, correct]);
    expect(actions[2]).toEqual({ kind: "confirm-correct", independent: false });
  });

  it("falls back to the nearest prerequisite once hints are used up", () => {
    const { actions, state } = run(fresh(), [
      incorrect,
      incorrect,
      incorrect,
      incorrect,
    ]);
    expect(actions[3]).toEqual({
      kind: "practice-prerequisite",
      skillId: "S03",
    });
    expect(state.status).toBe("item-complete");
  });

  it("offers a skip instead of a fallback when the skill has no prerequisite", () => {
    const { actions } = run(startItem("guided-practice", "S01"), [
      incorrect,
      incorrect,
      incorrect,
      incorrect,
    ]);
    expect(actions[3]).toEqual({ kind: "offer-skip" });
  });

  it("stops safely, without blame, when attempts stay unproductive", () => {
    const events = Array.from(
      { length: MAX_INCORRECT_PRACTICE_ATTEMPTS },
      () => incorrect,
    );
    const { actions, state } = run(startItem("guided-practice", "S01"), events);
    expect(actions.at(-1)).toEqual({
      kind: "end-session",
      reason: "unproductive",
    });
    expect(state.status).toBe("ended");
  });

  it("never shows more hints than the ladder holds", () => {
    const skills: InstructionalSkillId[] = ["S01", "S02", "S03", "S04"];
    for (const skill of skills) {
      let state = startItem("guided-practice", skill);
      const hints: TutorAction[] = [];
      // Keep answering wrong until the policy closes the item or ends the session.
      while (state.status === "awaiting-attempt") {
        const result = step(state, incorrect);
        if (result.action.kind === "show-hint") hints.push(result.action);
        state = result.state;
      }
      expect(hints).toHaveLength(HINT_LADDERS[skill].length);
      expect(state.incorrectAttempts).toBeLessThanOrEqual(
        MAX_INCORRECT_PRACTICE_ATTEMPTS,
      );
    }
  });

  it("does not count an unreadable answer as an attempt or a hint trigger", () => {
    const { actions, state } = run(fresh(), [invalid, invalid]);
    expect(actions).toEqual([{ kind: "ask-again" }, { kind: "ask-again" }]);
    expect(state.incorrectAttempts).toBe(0);
    expect(state.hintsShown).toBe(0);
  });

  it("offers a skip after repeated unreadable answers", () => {
    const { actions } = run(fresh(), [invalid, invalid, invalid]);
    expect(actions[2]).toEqual({ kind: "offer-skip" });
  });

  it("allows skip and stop at any time", () => {
    expect(step(fresh(), { type: "skip" }).action).toEqual({
      kind: "skip-item",
    });
    expect(step(fresh(), { type: "stop" }).action).toEqual({
      kind: "end-session",
      reason: "learner-stopped",
    });
  });
});

describe.each(ASSESSMENT_PHASES)("%s assessment", (phase) => {
  const fresh = () => startItem(phase, "S03");

  it("gives the identical neutral reply for correct and incorrect answers", () => {
    const right = step(fresh(), correct).action;
    const wrong = step(fresh(), incorrect).action;
    expect(right).toEqual({ kind: "acknowledge-response" });
    expect(wrong).toEqual(right);
  });

  it("never produces a hint, confirmation, prerequisite fallback, or answer, for any event sequence", () => {
    const events: TutorEvent[] = [
      correct,
      incorrect,
      invalid,
      { type: "skip" },
      { type: "stop" },
    ];
    const allowed = new Set([
      "acknowledge-response",
      "ask-again",
      "skip-item",
      "end-session",
    ]);
    // Every ordering of up to 3 events, applied from a fresh item.
    const walk = (state: TutorState, depth: number) => {
      if (depth === 0) return;
      for (const event of events) {
        let result;
        try {
          result = step(state, event);
        } catch (error) {
          expect(error).toBeInstanceOf(InvalidTransitionError);
          continue;
        }
        expect(allowed.has(result.action.kind)).toBe(true);
        expect(JSON.stringify(result.action)).not.toMatch(
          /hint|answer|expected/i,
        );
        expect(result.state.hintsShown).toBe(0);
        walk(result.state, depth - 1);
      }
    };
    walk(fresh(), 3);
  });

  it("allows only one scored attempt per item", () => {
    const { state } = step(fresh(), incorrect);
    expect(state.status).toBe("item-complete");
    expect(() => step(state, incorrect)).toThrow(InvalidTransitionError);
  });

  it("asks again, without scoring, when the answer cannot be read", () => {
    const { state, action } = step(fresh(), invalid);
    expect(action).toEqual({ kind: "ask-again" });
    expect(state.status).toBe("awaiting-attempt");
    expect(step(state, invalid).action).toEqual({ kind: "ask-again" }); // never an offer-skip prompt
  });

  it("allows skipping and stopping", () => {
    expect(step(fresh(), { type: "skip" }).action).toEqual({
      kind: "skip-item",
    });
    expect(step(fresh(), { type: "stop" }).action.kind).toBe("end-session");
  });
});

describe("invalid transitions and determinism", () => {
  it("rejects events after an item is finished or the session has ended", () => {
    const done = step(startItem("guided-practice", "S01"), correct).state;
    expect(() => step(done, correct)).toThrow(InvalidTransitionError);
    const ended = step(startItem("guided-practice", "S01"), {
      type: "stop",
    }).state;
    expect(() => step(ended, { type: "skip" })).toThrow(InvalidTransitionError);
    expect(() => step(ended, correct)).toThrow("ended");
  });

  it("rejects unknown events", () => {
    const bad = { type: "reveal-answer" } as unknown as TutorEvent;
    expect(() => step(startItem("baseline", "S01"), bad)).toThrow(
      InvalidTransitionError,
    );
  });

  it("returns identical results for identical inputs and does not mutate its input", () => {
    const state = Object.freeze(startItem("guided-practice", "S03"));
    const first = step(state, incorrect);
    for (let i = 0; i < 20; i++) expect(step(state, incorrect)).toEqual(first);
    expect(state.incorrectAttempts).toBe(0);
  });

  it("only hands out controlled hint identifiers, never free text", () => {
    for (const ladder of Object.values(HINT_LADDERS)) {
      for (const id of ladder) expect(id).toMatch(/^hint\.[a-z-]+\.[a-z-]+$/);
    }
  });
});
