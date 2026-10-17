import { describe, expect, it } from "vitest";
import { ALL_BANKS } from "@/domain/assessment/items";
import {
  advance,
  APPLY_PROBLEM,
  back,
  canAdvance,
  canPress,
  chooseAnswer,
  countAt,
  countedGroup,
  initialLab,
  isCrossTenProblem,
  isMarkable,
  isRight,
  LESSON_PROBLEM,
  nextNeeds,
  openQuestion,
  pressBall,
  RACK,
  recap,
  shownBy,
  triesFor,
  type LabState,
} from "@/lib/make-ten-lab";

const press = (s: LabState, ...is: number[]) =>
  is.reduce((acc, i) => pressBall(acc, i), s);
const range = (a: number, b: number) =>
  Array.from({ length: b - a + 1 }, (_, i) => a + i);
const total = (s: LabState) =>
  countAt(s, "pile") + countAt(s, "rack") + countAt(s, "nets");

/** Fill the rack with balls 1–10 and say how many are outside it. */
function toStep2(): LabState {
  const s = press(initialLab(), ...range(0, 9));
  return advance(chooseAnswer(s, "extras", 3));
}
function toStep3(): LabState {
  const s = press(toStep2(), 10, 11, 12);
  return advance(chooseAnswer(s, "more", 2));
}
function toStep4(): LabState {
  return advance(press(toStep3(), 0, 1));
}

describe("draft make-ten lab: numbers", () => {
  it("both problems cross ten and the unguided try is not from any question bank", () => {
    expect(isCrossTenProblem(LESSON_PROBLEM)).toBe(true);
    expect(isCrossTenProblem(APPLY_PROBLEM)).toBe(true);
    // The lab is not assessment content. Its unguided try must not be (or share
    // a starting number with) any baseline, practice, check or delayed item.
    // 13 − 5 is the public mission itself and is deliberately the lesson.
    const starts = ALL_BANKS.flatMap((b) => b.items).flatMap((it) =>
      "start" in it.spec ? [it.spec.start] : [],
    );
    expect(starts.length).toBeGreaterThan(0);
    expect(starts).not.toContain(APPLY_PROBLEM.total);
  });

  it("rejects problems that do not cross ten", () => {
    expect(isCrossTenProblem({ total: 13, take: 3 })).toBe(false);
    expect(isCrossTenProblem({ total: 9, take: 5 })).toBe(false);
    expect(isCrossTenProblem({ total: 20, take: 11 })).toBe(false);
    expect(isCrossTenProblem({ total: 12.5, take: 5 })).toBe(false);
  });
});

describe("draft make-ten lab: step 1, ten and three", () => {
  it("starts with 13 separate balls outside an empty rack", () => {
    const s = initialLab();
    expect(s.places).toHaveLength(13);
    expect(countAt(s, "pile")).toBe(13);
    expect(openQuestion(s)).toBeNull();
    expect(nextNeeds(s)).toBe("fill-rack");
  });

  it("the rack holds exactly ten, and any ten will do", () => {
    const s = press(initialLab(), 12, 0, 5, 7, 3, 9, 11, 2, 4, 6, 1, 8);
    expect(countAt(s, "rack")).toBe(RACK);
    expect(countAt(s, "pile")).toBe(3);
    expect(total(s)).toBe(13);
  });

  it("asks how many are outside only once the ten is complete", () => {
    const nine = press(initialLab(), ...range(0, 8));
    expect(openQuestion(nine)).toBeNull();
    expect(chooseAnswer(nine, "extras", 4)).toBe(nine);
    expect(openQuestion(press(nine, 9))).toBe("extras");
  });

  it("checks the answer against the balls on screen, not a stored number", () => {
    const full = press(initialLab(), ...range(0, 9));
    expect(shownBy(full, "extras")).toBe(3);
    for (const wrong of [10, 13, 2, 0]) {
      const s = chooseAnswer(full, "extras", wrong);
      expect(isRight(s, "extras")).toBe(false);
      expect(advance(s).step).toBe(1);
    }
    const right = chooseAnswer(full, "extras", 3);
    expect(isRight(right, "extras")).toBe(true);
    expect(advance(right).step).toBe(2);
  });

  it("moving a ball clears the answer it was about (no stale 'right')", () => {
    const right = chooseAnswer(
      press(initialLab(), ...range(0, 9)),
      "extras",
      3,
    );
    const moved = press(right, 0);
    expect(moved.answers.extras).toBeUndefined();
    expect(canAdvance(press(moved, 0))).toBe(false);
  });

  it("rejects malformed answers and answers to a question that is not open", () => {
    const full = press(initialLab(), ...range(0, 9));
    expect(chooseAnswer(full, "extras", -1)).toBe(full);
    expect(chooseAnswer(full, "extras", 2.5)).toBe(full);
    expect(chooseAnswer(full, "more", 2)).toBe(full);
  });
});

describe("draft make-ten lab: steps 2 and 3, five as three and two", () => {
  it("only the three extras can move first; the ten stays put", () => {
    const s = toStep2();
    for (const i of range(0, 9)) expect(canPress(s, i)).toBe(false);
    for (const i of [10, 11, 12]) expect(canPress(s, i)).toBe(true);
  });

  it("'how many more' opens once every extra is at the nets and is read from the empty spots", () => {
    let s = press(toStep2(), 10, 11);
    expect(openQuestion(s)).toBeNull();
    expect(nextNeeds(s)).toBe("move-extras");
    s = press(s, 12);
    expect(countAt(s, "nets")).toBe(3);
    expect(shownBy(s, "more")).toBe(2);
    expect(advance(chooseAnswer(s, "more", 5)).step).toBe(2);
    expect(advance(chooseAnswer(s, "more", 3)).step).toBe(2);
    expect(advance(chooseAnswer(s, "more", 2)).step).toBe(3);
  });

  it("step 3 takes exactly two from the ten, never more, and can undo only those", () => {
    const s = toStep3();
    expect(nextNeeds(s)).toBe("fill-nets");
    const two = press(s, 0, 1, 2);
    expect(countAt(two, "nets")).toBe(5);
    expect(countAt(two, "rack")).toBe(8);
    expect(two.fromRack).toEqual([0, 1]);
    expect(canAdvance(two)).toBe(true);
    // An extra moved in step 2 cannot be pulled back in step 3.
    expect(canPress(two, 10)).toBe(false);
    const undone = press(two, 1);
    expect(countAt(undone, "rack")).toBe(9);
    expect(undone.fromRack).toEqual([0]);
    expect(total(undone)).toBe(13);
  });
});

describe("draft make-ten lab: step 4, what is left", () => {
  it("asks the learner for the remainder and states nothing first", () => {
    const s = toStep4();
    expect(openQuestion(s)).toBe("left");
    expect(shownBy(s, "left")).toBe(8);
    expect(recap(s)).toBeNull();
    // Five (the balls moved), thirteen (the start) and ten (the full rack) are wrong.
    for (const wrong of [5, 13, 10, 7]) {
      const t = chooseAnswer(s, "left", wrong);
      expect(isRight(t, "left")).toBe(false);
      expect(recap(t)).toBeNull();
    }
  });

  it("the recap is built from what the learner actually did", () => {
    const s = chooseAnswer(toStep4(), "left", 8);
    expect(recap(s)).toEqual({
      total: 13,
      extras: 3,
      fromRack: 2,
      take: 5,
      left: 8,
    });
  });

  it("marking balls while counting changes no quantity", () => {
    const s = toStep4();
    const marked = press(s, 2, 3, 4);
    expect(marked.marked).toEqual([2, 3, 4]);
    expect(marked.places).toEqual(s.places);
    expect(press(marked, 3).marked).toEqual([2, 4]);
    // Balls at the nets cannot be marked.
    expect(canPress(s, 0)).toBe(false);
  });
});

describe("draft make-ten lab: step 5, the unguided try", () => {
  it("is a fresh 11 − 4 with no rack and its answer read from the picture", () => {
    const s = advance(chooseAnswer(toStep4(), "left", 8));
    expect(s.step).toBe(5);
    expect(s.places).toHaveLength(APPLY_PROBLEM.total);
    expect(countAt(s, "rack")).toBe(0);
    expect(openQuestion(s)).toBeNull();
    const four = press(s, 0, 1, 2, 3);
    expect(canPress(four, 4)).toBe(false);
    expect(openQuestion(four)).toBe("apply");
    expect(isRight(chooseAnswer(four, "apply", 7), "apply")).toBe(true);
    expect(isRight(chooseAnswer(four, "apply", 4), "apply")).toBe(false);
    expect(canAdvance(four)).toBe(false);
  });
});

describe("draft make-ten lab: back and start again", () => {
  it("Back restores the previous step exactly as it was left", () => {
    const s2 = toStep2();
    const s3 = toStep3();
    const restored = back(s3);
    expect(restored.step).toBe(2);
    expect(restored.places).toEqual(press(s2, 10, 11, 12).places);
    expect(restored.answers.more).toBe(2);
    expect(back(back(restored)).step).toBe(1);
    expect(back(initialLab())).toEqual(initialLab());
  });

  it("Back from the unguided try returns to the lesson's last step", () => {
    const s4 = chooseAnswer(toStep4(), "left", 8);
    const restored = back(advance(s4));
    expect(restored.step).toBe(4);
    expect(restored.places).toEqual(s4.places);
    expect(restored.problem).toEqual(LESSON_PROBLEM);
  });

  it("random presses, answers, Next and Back never break conservation or the limits", () => {
    let s = initialLab();
    let seed = 7;
    const rnd = (n: number) => {
      seed = (seed * 48271) % 2147483647;
      return seed % n;
    };
    for (let k = 0; k < 2000; k++) {
      const r = rnd(10);
      if (r < 6) s = pressBall(s, rnd(s.places.length));
      else if (r < 8) {
        const q = openQuestion(s);
        if (q) s = chooseAnswer(s, q, rnd(14));
      } else if (r === 8) s = advance(s);
      else s = back(s);
      expect(total(s)).toBe(s.problem.total);
      expect(countAt(s, "rack")).toBeLessThanOrEqual(RACK);
      expect(countAt(s, "nets")).toBeLessThanOrEqual(s.problem.take);
      if (s.step >= 2 && s.step <= 4)
        expect(countAt(s, "rack")).toBeGreaterThanOrEqual(8);
    }
  });
});

describe("draft make-ten lab: counting aid and support after mix-ups", () => {
  it("balls outside a full ten can be marked, and marking changes no quantity", () => {
    const full = press(initialLab(), ...range(0, 9));
    expect(countedGroup(full)).toBe("pile");
    const marked = press(full, 10, 12);
    expect(marked.marked).toEqual([10, 12]);
    expect(marked.places).toEqual(full.places);
    expect(shownBy(marked, "extras")).toBe(3);
    // Before the ten is full the same balls are for moving, not marking.
    expect(countedGroup(press(initialLab(), 0))).toBeNull();
    expect(isMarkable(full, 0)).toBe(false);
  });

  it("any move clears the marks, because the groups they described changed", () => {
    const marked = press(press(initialLab(), ...range(0, 9)), 10, 11);
    expect(press(marked, 0).marked).toEqual([]);
    const four = press(toStep4(), 2, 3);
    expect(four.marked).toEqual([2, 3]);
    expect(advance(chooseAnswer(four, "left", 8)).marked).toEqual([]);
  });

  it("the unguided try offers no counting aid", () => {
    const s = advance(chooseAnswer(toStep4(), "left", 8));
    const four = press(s, 0, 1, 2, 3);
    expect(countedGroup(four)).toBeNull();
    expect(press(four, 5)).toBe(four);
  });

  it("counts wrong numbers for the same picture and starts again when it changes", () => {
    let s = press(initialLab(), ...range(0, 9));
    s = chooseAnswer(s, "extras", 5);
    s = chooseAnswer(s, "extras", 10);
    expect(triesFor(s, "extras")).toBe(2);
    // A right number is not a mix-up and adds nothing.
    expect(triesFor(chooseAnswer(s, "extras", 3), "extras")).toBe(2);
    // Taking a ball back changes the picture: the count and the answer reset.
    const moved = press(s, 0);
    expect(triesFor(moved, "extras")).toBe(0);
    expect(moved.answers.extras).toBeUndefined();
  });
});

describe("draft make-ten lab: the numbers a stage asks for come from the picture", () => {
  it("the learner is never told how many to take in step 3; the nets show the room", () => {
    const s = toStep3();
    expect(s.answers.more).toBe(2);
    expect(s.problem.take - countAt(s, "nets")).toBe(2);
  });

  it("Next then Back returns exactly the same lab, answers and marks included", () => {
    const states = [
      initialLab(),
      toStep2(),
      press(chooseAnswer(press(toStep2(), 10, 11, 12), "more", 5), 0),
      toStep3(),
      press(toStep4(), 2, 4),
      chooseAnswer(toStep4(), "left", 8),
    ];
    for (const s of states) {
      if (!canAdvance(s)) continue;
      expect(back(advance(s))).toEqual(s);
    }
  });

  it("pressing a movable ball twice puts everything back exactly", () => {
    for (const s of [
      initialLab(),
      toStep2(),
      toStep3(),
      advance(chooseAnswer(toStep4(), "left", 8)),
    ]) {
      for (let i = 0; i < s.places.length; i++) {
        const once = pressBall(s, i);
        if (once === s || once.places[i] === s.places[i]) continue; // a mark, not a move
        const twice = pressBall(once, i);
        expect(twice.places).toEqual(s.places);
        expect(twice.fromRack).toEqual(s.fromRack);
      }
    }
  });

  it("no recap before a right answer, in any reachable state", () => {
    let s = initialLab();
    let seed = 11;
    const rnd = (n: number) => {
      seed = (seed * 48271) % 2147483647;
      return seed % n;
    };
    for (let k = 0; k < 3000; k++) {
      const r = rnd(10);
      if (r < 6) s = pressBall(s, rnd(s.places.length));
      else if (r < 8) {
        const q = openQuestion(s);
        if (q) s = chooseAnswer(s, q, rnd(14));
      } else if (r === 8) s = advance(s);
      else s = back(s);
      const rc = recap(s);
      if (rc) {
        expect(s.step).toBe(4);
        expect(s.answers.left).toBe(8);
        expect(rc).toEqual({
          total: 13,
          extras: 3,
          fromRack: 2,
          take: 5,
          left: 8,
        });
      }
      // Every object has exactly one valid place; marks only name counted objects.
      expect(s.places).toHaveLength(s.problem.total);
      for (const p of s.places) expect(["pile", "rack", "nets"]).toContain(p);
      for (const i of s.marked) expect(isMarkable(s, i)).toBe(true);
      // A "right" verdict is always about the picture as it is now.
      for (const q of ["extras", "more", "left", "apply"] as const)
        if (isRight(s, q)) expect(s.answers[q]).toBe(shownBy(s, q));
    }
  });
});
