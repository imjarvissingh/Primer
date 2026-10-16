import { describe, expect, it } from "vitest";
import {
  NOT_STARTED,
  slotLayout,
  slotStates,
} from "@/components/practice/scenes/progress";

describe("slotStates", () => {
  it("has no slots before a mission starts", () => {
    expect(slotStates(NOT_STARTED)).toEqual([]);
  });

  it.each([
    [0, 5, 0],
    [1, 5, 1],
    [4, 5, 4],
    [5, 5, 5],
    [8, 5, 5], // over-placement never shows more than required
    [-1, 5, 0], // defensive: never negative
  ])("placed %i of %i required -> %i built", (placed, required, built) => {
    const s = slotStates({ placed, required });
    expect(s).toHaveLength(required);
    expect(s.filter(Boolean)).toHaveLength(built);
  });

  it("fills first to last, so removing one empties the last built slot", () => {
    expect(slotStates({ placed: 2, required: 4 })).toEqual([
      true,
      true,
      false,
      false,
    ]);
  });
});

describe("slotLayout", () => {
  it.each([1, 5, 9])("fits %i slots inside the span without overlap", (n) => {
    const l = slotLayout(n, 100, 150, 4);
    expect(l).toHaveLength(n);
    expect(l[0].x).toBe(100);
    const last = l[n - 1];
    expect(last.x + last.w).toBeCloseTo(250);
    l.slice(1).forEach((s, i) => expect(s.x).toBeGreaterThan(l[i].x + l[i].w));
  });
});
