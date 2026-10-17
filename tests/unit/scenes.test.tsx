import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Scene } from "@/components/practice/scenes";
import {
  isComplete,
  NOT_STARTED,
  type ConstructionProgress,
} from "@/components/practice/scenes/progress";
import { THEMES } from "@/themes";

const progress = (placed: number): ConstructionProgress => ({
  placed,
  required: 5,
});

describe.each(THEMES)("scene of $displayName", (theme) => {
  const draw = (p: ConstructionProgress) =>
    render(<Scene themeId={theme.id} progress={p} />).container.querySelector(
      "svg[data-scene]",
    ) as SVGElement;

  it("is decorative: hidden from assistive technology and nothing in it is focusable", () => {
    const svg = draw(progress(3));
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("focusable")).toBe("false");
    expect(svg.querySelectorAll("a, button, input, [tabindex]")).toHaveLength(
      0,
    );
    // No printed numerals: a picture cannot state or hint at the answer.
    expect(svg.querySelectorAll("text, tspan")).toHaveLength(0);
  });

  it("draws one place per object to move, and only as many filled as are placed", () => {
    expect(draw(NOT_STARTED).querySelectorAll("[data-slot]")).toHaveLength(0);
    for (const placed of [0, 1, 4, 5]) {
      const svg = draw(progress(placed));
      expect(svg.querySelectorAll('[data-slot="built"]')).toHaveLength(placed);
      expect(svg.querySelectorAll('[data-slot="empty"]')).toHaveLength(
        5 - placed,
      );
    }
    // Too many placed never draws extra places.
    const over = draw(progress(7));
    expect(over.querySelectorAll('[data-slot="built"]')).toHaveLength(5);
    expect(over.querySelectorAll('[data-slot="empty"]')).toHaveLength(0);
  });

  it("keeps everything essential in the centre band so a phone crop never hides the goal", () => {
    const svg = draw(progress(2));
    expect(svg.getAttribute("viewBox")).toBe("0 0 600 340");
    expect(svg.getAttribute("preserveAspectRatio")).toBe("xMidYMid slice");
    // Each place is positioned by a transform or cx/x inside x = 110..490.
    const xs = [...svg.querySelectorAll("[data-slot]")].map((g) => {
      const t = /translate\(([-\d.]+)/.exec(g.getAttribute("transform") ?? "");
      if (t) return Number(t[1]);
      const c = g.querySelector("[cx], [x]");
      return Number(c?.getAttribute("cx") ?? c?.getAttribute("x"));
    });
    expect(xs).toHaveLength(5);
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(110);
      expect(x).toBeLessThanOrEqual(490);
    }
  });

  it("stays within a rendering budget, so five scenes cost little on a phone", () => {
    const svg = draw(progress(5));
    expect(svg.querySelectorAll("*").length).toBeLessThan(420);
    expect(svg.outerHTML.length).toBeLessThan(26_000);
  });

  it("has celebration pieces that exist in the markup but are shown only by the stage", () => {
    expect(
      draw(progress(5)).querySelectorAll(".celebrate .spark").length,
    ).toBeGreaterThan(3);
  });
});

describe("a picture filled is not a right answer", () => {
  it("is 'complete' only when exactly the goal number is placed", () => {
    expect(isComplete({ placed: 5, required: 5 })).toBe(true);
    expect(isComplete({ placed: 6, required: 5 })).toBe(false);
    expect(isComplete({ placed: 4, required: 5 })).toBe(false);
    expect(isComplete({ placed: 0, required: null })).toBe(false);
  });
});
