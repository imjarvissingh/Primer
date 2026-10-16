// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  MAX_FRAME_QUANTITY,
  crossesTen,
  makeTenView,
  partWhole,
  type CellState,
  type MakeTenView,
} from "@/lib/ten-frame";
import { MAX_QUANTITY } from "@/domain/math";

const count = (cells: readonly CellState[], s: CellState) =>
  cells.filter((c) => c === s).length;

/** Independent check: counters plus take-now cells must add up to the start. */
function counters(view: MakeTenView) {
  return view.frames.reduce(
    (n, f) => n + count(f.cells, "counter") + count(f.cells, "take-now"),
    0,
  );
}

it("uses the same largest quantity as the domain", () => {
  expect(MAX_FRAME_QUANTITY).toBe(MAX_QUANTITY);
});

describe("partWhole", () => {
  it.each([
    [0, 0, 0],
    [7, 0, 7],
    [10, 1, 0],
    [13, 1, 3],
    [19, 1, 9],
    [20, 2, 0],
  ])("%i is %i ten(s) and %i ones", (n, tens, ones) => {
    expect(partWhole(n)).toEqual({ tens, ones });
  });
  it.each([-1, 21, 1.5, NaN, Infinity, "13", null, undefined])(
    "rejects %s",
    (bad) => expect(partWhole(bad)).toBeNull(),
  );
});

describe("crossesTen", () => {
  it.each([
    [13, 5],
    [11, 2],
    [18, 9],
    [16, 7],
    [19, 10],
  ])("%i - %i crosses ten", (s, t) => expect(crossesTen(s, t)).toBe(true));
  it.each([
    [13, 3], // lands exactly on ten
    [13, 2], // stays above ten
    [10, 4], // starts at ten
    [9, 5], // below ten
    [13, 14], // takes more than the start
    [20, 11], // outside the supported range
    [13, 5.5],
  ])("%i - %i does not", (s, t) => expect(crossesTen(s, t)).toBe(false));
  it("rejects non-numbers", () => {
    expect(crossesTen("13", 5)).toBe(false);
    expect(crossesTen(13, null)).toBe(false);
  });
});

describe("makeTenView", () => {
  const split = (start: number, takeAway: number, to: number) =>
    makeTenView({ start, takeAway, takeToTen: to, takeFromTen: null });
  const fromTen = (start: number, takeAway: number, to: number, from: number) =>
    makeTenView({ start, takeAway, takeToTen: to, takeFromTen: from });

  it("split stage for 13 - 5: a full ten plus three extras to take first", () => {
    const v = split(13, 5, 3);
    expect(v).not.toBeNull();
    expect(v!.stage).toBe("split");
    expect(v!.takeFromTen).toBeNull();
    expect(count(v!.frames[0].cells, "counter")).toBe(10);
    expect(count(v!.frames[1].cells, "take-now")).toBe(3);
    expect(counters(v!)).toBe(13);
  });

  it("from-ten stage for 13 - 5: extras gone, two marked in the ten", () => {
    const v = fromTen(13, 5, 3, 2);
    expect(v!.stage).toBe("from-ten");
    expect(count(v!.frames[0].cells, "counter")).toBe(8);
    expect(count(v!.frames[0].cells, "take-now")).toBe(2);
    expect(count(v!.frames[1].cells, "taken")).toBe(3);
  });

  it.each([
    [16, 7, 6, 1],
    [11, 2, 1, 1],
    [18, 9, 8, 1],
    [14, 8, 4, 4],
    [19, 10, 9, 1],
    [11, 11, 1, 10],
  ])(
    "is arithmetically consistent for %i - %i",
    (start, takeAway, to, from) => {
      const a = split(start, takeAway, to)!;
      const b = fromTen(start, takeAway, to, from)!;
      expect(counters(a)).toBe(start);
      expect(count(a.frames[1].cells, "take-now")).toBe(to);
      expect(count(b.frames[0].cells, "take-now")).toBe(from);
      expect(to + from).toBe(takeAway);
      for (const f of [...a.frames, ...b.frames])
        expect(f.cells).toHaveLength(10);
    },
  );

  it("never exposes the final result as a field", () => {
    const v = fromTen(13, 5, 3, 2)!;
    expect(Object.keys(v).sort()).toEqual(
      ["frames", "stage", "start", "takeFromTen", "takeToTen"].sort(),
    );
  });

  it.each([
    ["not crossing ten", split(13, 3, 3)],
    ["starts at ten", split(10, 5, 0)],
    ["wrong takeToTen", split(13, 5, 2)],
    ["parts do not add up", fromTen(13, 5, 3, 3)],
    ["zero second step", fromTen(13, 5, 3, 0)],
    ["negative second step", fromTen(13, 5, 3, -2)],
    ["fractional", fromTen(13, 5, 3, 2.5)],
    ["start out of range", split(25, 5, 15)],
  ])("returns null when %s", (_name, view) => {
    expect(view).toBeNull();
  });
});
