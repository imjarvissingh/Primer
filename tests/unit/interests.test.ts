// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DEMO_NUMBERS,
  INTERESTS,
  INTEREST_IDS,
  pickSurprise,
} from "@/interests";
import { THEMES, fillStory } from "@/themes";

describe("interest registry", () => {
  it("has exactly the five planned interests with unique ids, titles and classes", () => {
    expect(INTERESTS.map((i) => i.id)).toEqual([...INTEREST_IDS]);
    expect(INTEREST_IDS).toEqual([
      "cricket",
      "building",
      "space",
      "basketball",
      "soccer",
    ]);
    for (const key of ["id", "title", "className", "guideName"] as const) {
      expect(new Set(INTERESTS.map((i) => i[key])).size).toBe(5);
    }
  });

  it("tells the same 13 and 5 story in every interest, from one shared constant", () => {
    expect(DEMO_NUMBERS).toEqual({ start: 13, takeAway: 5 });
    for (const i of INTERESTS) {
      expect(i.story, i.id).toContain("{start}");
      expect(i.story, i.id).toContain("{takeAway}");
      expect(i.story, i.id).not.toMatch(/\d/); // numbers never live in copy
      expect(fillStory(i.story, DEMO_NUMBERS).match(/\d+/g), i.id).toEqual([
        "13",
        "5",
      ]);
      expect(i.question, i.id).toMatch(/^How many .* remain/);
    }
  });

  it("holds no field that could carry mathematical authority", () => {
    const forbidden =
      /answer|expected|correct|score|threshold|bank|hint|mastery|evidence|policy|operand/i;
    for (const i of INTERESTS) {
      for (const key of Object.keys(i)) expect(key).not.toMatch(forbidden);
    }
  });

  it("maps only to existing themes, and only where a mission already exists", () => {
    const themeIds = THEMES.map((t) => t.id);
    const playable = INTERESTS.filter((i) => i.existingMission !== null);
    expect(playable.map((i) => i.id)).toEqual(["building", "space"]);
    for (const i of playable) {
      const m = i.existingMission!;
      expect(themeIds).toContain(m.themeId);
      expect(THEMES.find((t) => t.id === m.themeId)?.href).toBe(m.href);
    }
  });

  it("picks a valid interest for Surprise me, across the whole range", () => {
    expect(pickSurprise(() => 0)).toBe("cricket");
    expect(pickSurprise(() => 0.999999)).toBe("soccer");
    expect(pickSurprise(() => 1)).toBe("soccer");
    for (let i = 0; i < 50; i++) {
      expect(INTEREST_IDS).toContain(pickSurprise());
    }
  });

  it("stays import-free and out of storage, network and tracking", () => {
    const src = readFileSync("src/interests/index.ts", "utf8");
    const flow = readFileSync("src/components/welcome/WelcomeFlow.tsx", "utf8");
    expect(src).not.toMatch(/^import (?!type)/m);
    for (const text of [src, flow]) {
      expect(text).not.toMatch(
        /localStorage|sessionStorage|document\.cookie|indexedDB|fetch\(|XMLHttpRequest|sendBeacon|analytics/i,
      );
    }
    expect(flow).not.toMatch(/type="(text|email|date|tel)"|<textarea/);
  });
});
