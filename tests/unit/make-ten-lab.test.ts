import { describe, expect, it } from "vitest";
import {
  advance,
  allCounted,
  canAdvance,
  chooseGuess,
  countAt,
  initialLab,
  LAB_REST,
  pressBall,
  type LabState,
} from "@/lib/make-ten-lab";

const press = (s: LabState, ...is: number[]) =>
  is.reduce((acc, i) => pressBall(acc, i), s);
const range = (a: number, b: number) =>
  Array.from({ length: b - a + 1 }, (_, i) => a + i);

function toStep2() {
  return advance(press(initialLab(), ...range(0, 9)));
}
function toStep3() {
  let s = press(toStep2(), 10, 11, 12);
  s = chooseGuess(s, LAB_REST);
  return advance(s);
}

describe("draft make-ten lab rules", () => {
  it("starts with 13 loose balls and an empty rack", () => {
    const s = initialLab();
    expect(s.places).toHaveLength(13);
    expect(countAt(s, "pile")).toBe(13);
    expect(canAdvance(s)).toBe(false);
  });

  it("holds exactly ten in the rack and conserves 13 balls", () => {
    const s = press(initialLab(), ...range(0, 11));
    expect(countAt(s, "rack")).toBe(10);
    expect(countAt(s, "pile")).toBe(3);
    expect(s.places.length).toBe(13);
  });

  it("undo returns a ball to where it came from", () => {
    const s = press(initialLab(), 0, 0);
    expect(countAt(s, "rack")).toBe(0);
    expect(countAt(s, "pile")).toBe(13);
  });

  it("cannot advance from step 1 until the rack is full", () => {
    const nine = press(initialLab(), ...range(0, 8));
    expect(advance(nine).step).toBe(1);
    expect(toStep2().step).toBe(2);
  });

  it("step 2 needs the extras moved AND the right 'how many more' before advancing", () => {
    let s = press(toStep2(), 10, 11, 12);
    expect(countAt(s, "nets")).toBe(3);
    expect(advance(s).step).toBe(2);
    s = chooseGuess(s, 3);
    expect(advance(s).step).toBe(2);
    s = chooseGuess({ ...s, guess: null }, 2);
    expect(advance(s).step).toBe(3);
  });

  it("step 3 takes only two from the rack, and 5 are at the nets", () => {
    const s = toStep3();
    const three = press(s, 0, 1, 2);
    expect(countAt(three, "nets")).toBe(5);
    expect(countAt(three, "rack")).toBe(8);
    expect(canAdvance(three)).toBe(true);
  });

  it("step 3 undo only returns balls moved in step 3", () => {
    const s = press(toStep3(), 10);
    expect(s.places[10]).toBe("nets");
    expect(countAt(s, "nets")).toBe(3);
  });

  it("step 4 counts every ball left, and the picture agrees with the numbers", () => {
    let s = advance(press(toStep3(), 0, 1));
    expect(s.step).toBe(4);
    const left = s.places
      .map((p, i) => (p === "rack" ? i : -1))
      .filter((i) => i >= 0);
    expect(left).toHaveLength(8);
    expect(allCounted(s)).toBe(false);
    s = press(s, ...left);
    expect(allCounted(s)).toBe(true);
    expect(countAt(s, "pile") + countAt(s, "rack") + countAt(s, "nets")).toBe(
      13,
    );
  });

  it("rapid repeated presses never break conservation", () => {
    let s = initialLab();
    for (let k = 0; k < 200; k++) s = pressBall(s, (k * 7) % 13);
    expect(s.places).toHaveLength(13);
    expect(countAt(s, "rack")).toBeLessThanOrEqual(10);
  });
});
