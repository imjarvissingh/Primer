import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  GuideStrip,
  guideLine,
  type GuideMood,
} from "@/components/practice/Guide";
import { guideMoodFor } from "@/components/practice/PracticeMission";
import { GUIDE_LOOKS, ITEM_ARTS, THEMES } from "@/themes";

const MOODS: GuideMood[] = ["welcome", "working", "again", "done"];

describe("guide mood follows real game events", () => {
  it("welcomes with nothing placed and works while objects are moved", () => {
    expect(guideMoodFor(0, null)).toBe("welcome");
    expect(guideMoodFor(1, null)).toBe("working");
    expect(guideMoodFor(5, null)).toBe("working");
  });

  it("encourages after neutral feedback, a hint, a skip offer or an unreadable answer, whatever was placed", () => {
    for (const feedback of [
      { kind: "neutral-feedback" },
      { kind: "hint", hintId: "h", hintNumber: 1, steps: null },
      { kind: "offer-skip" },
      { kind: "ask-again" },
    ] as const) {
      expect(guideMoodFor(0, feedback)).toBe("again");
      expect(guideMoodFor(5, feedback)).toBe("again");
    }
  });

  it("never returns the finished reaction while a mission is still being played", () => {
    for (const placed of [0, 3, 5, 13]) {
      for (const feedback of [null, { kind: "neutral-feedback" } as const]) {
        expect(guideMoodFor(placed, feedback)).not.toBe("done");
      }
    }
  });
});

describe.each(THEMES)("guide of $displayName", (theme) => {
  const g = theme.guide;

  it("picks a known drawing and a known object drawing", () => {
    expect(GUIDE_LOOKS).toContain(g.look);
    expect(ITEM_ARTS).toContain(theme.itemArt);
  });

  it("has a different authored line for every moment, with no numbers", () => {
    const lines = MOODS.map((m) => guideLine(g, m));
    expect(new Set(lines).size).toBe(4);
    for (const l of lines) {
      expect(l).not.toMatch(/\d/);
      expect(l.length).toBeLessThan(70);
    }
  });

  it("never praises or judges, and never claims ability, after an answer that was not yet right", () => {
    expect(g.again).not.toMatch(
      /great|good|smart|clever|genius|amazing|perfect|correct|wrong|right|well done|try harder|fail/i,
    );
    for (const m of MOODS) {
      expect(guideLine(g, m)).not.toMatch(
        /smart|clever|genius|talent|gifted|best|better than|score|mastery|level/i,
      );
    }
  });

  it("renders its figure and line for each mood, hidden from assistive tech", () => {
    for (const mood of MOODS) {
      const { container, unmount } = render(
        <GuideStrip guide={g} mood={mood} />,
      );
      const svg = container.querySelector("svg.guide-figure");
      expect(svg?.getAttribute("aria-hidden")).toBe("true");
      expect(svg?.getAttribute("data-mood")).toBe(mood);
      expect(screen.getByTestId("guide-line").textContent).toBe(g[mood]);
      unmount();
    }
  });
});

describe("the five worlds are distinct", () => {
  it("each has its own guide name, object drawing and guide drawing", () => {
    expect(new Set(THEMES.map((t) => t.guide.name)).size).toBe(5);
    expect(new Set(THEMES.map((t) => t.itemArt)).size).toBe(5);
    expect(new Set(THEMES.map((t) => t.guide.look)).size).toBe(5);
  });
});
