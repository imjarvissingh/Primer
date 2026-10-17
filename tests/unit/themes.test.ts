// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { presentHint } from "@/components/practice/hints";
import { evaluateResponse } from "@/domain/math";
import { HINT_LADDERS } from "@/domain/tutoring";
import { getMission } from "@/server/practice/missions";
import {
  BLOCK_BUILDER_THEME,
  SPACE_CONSTRUCTION_THEME,
  STORY_PLACEHOLDERS,
  THEME_IDS,
  THEMES,
  countOf,
  fillStory,
  type ThemeConfig,
} from "@/themes";

/** Every string in a theme, with the key path that led to it. */
function leaves(value: unknown, path = ""): [string, unknown][] {
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([k, v]) =>
      leaves(v, path ? `${path}.${k}` : k),
    );
  }
  return [[path, value]];
}

describe("theme contract", () => {
  it("has exactly the two planned themes with unique ids, routes and classes", () => {
    expect(THEMES.map((t) => t.id)).toEqual([...THEME_IDS]);
    for (const key of [
      "id",
      "href",
      "className",
      "displayName",
      "missionTitle",
    ] as const) {
      expect(new Set(THEMES.map((t) => t[key])).size).toBe(THEMES.length);
    }
  });

  it("is plain, frozen, string-only data: no numbers, functions, or code", () => {
    for (const theme of THEMES) {
      expect(Object.isFrozen(theme)).toBe(true);
      expect(Object.isFrozen(theme.vocabulary)).toBe(true);
      for (const [path, value] of leaves(theme)) {
        expect(typeof value, `${theme.id}.${path}`).toBe("string");
        expect((value as string).trim(), `${theme.id}.${path}`).not.toBe("");
        // Numbers come from the server's challenge, never from a theme.
        expect(value, `${theme.id}.${path}`).not.toMatch(/\d/);
        expect(value, `${theme.id}.${path}`).not.toMatch(/https?:|\/\/|<|>/);
      }
    }
  });

  it("has no field that could carry mathematical or tutoring authority", () => {
    const forbidden =
      /answer|expected|correct|score|threshold|phase|bank|problem|hint|session|seq|mastery|skill|evidence|policy/i;
    for (const theme of THEMES) {
      for (const [path] of leaves(theme)) {
        expect(path, `${theme.id}.${path}`).not.toMatch(forbidden);
      }
    }
  });

  it("uses exactly the two allowed story placeholders and the theme's own noun", () => {
    for (const theme of THEMES) {
      for (const p of STORY_PLACEHOLDERS) expect(theme.story).toContain(p);
      const found = theme.story.match(/\{[^}]*\}/g) ?? [];
      expect(
        found.every((f) =>
          (STORY_PLACEHOLDERS as readonly string[]).includes(f),
        ),
      ).toBe(true);
      expect(theme.story).toContain(theme.vocabulary.plural);
      expect(theme.vocabulary.supplyPlace).toContain(
        theme.vocabulary.supplyNoun,
      );
    }
  });

  it("fills a story from the server's numbers", () => {
    expect(
      fillStory(BLOCK_BUILDER_THEME.story, { start: 13, takeAway: 5 }),
    ).toBe("The builder has 13 blocks. The team uses 5 of them on the bridge.");
    expect(
      fillStory(SPACE_CONSTRUCTION_THEME.story, { start: 13, takeAway: 5 }),
    ).toContain("13 modules");
    expect(countOf(1, SPACE_CONSTRUCTION_THEME.vocabulary)).toBe("1 module");
    expect(countOf(3, BLOCK_BUILDER_THEME.vocabulary)).toBe("3 blocks");
  });

  it("has a stylesheet rule for every theme class", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    for (const theme of THEMES) {
      expect(css).toMatch(new RegExp(`\\.${theme.className}\\b`));
    }
  });
});

describe("hint equivalence across themes", () => {
  const mission = getMission("subtract-practice");
  if (mission === null) throw new Error("mission missing");
  const strategy = (() => {
    const r = evaluateResponse(mission.problem, 1);
    if (r.status === "invalid" || r.strategy === undefined)
      throw new Error("no strategy");
    return {
      takeToTen: r.strategy.takeToTen,
      takeFromTen: r.strategy.takeFromTen,
    };
  })();
  const ladder = HINT_LADDERS[mission.problem.skillId];

  /** Replaces a theme's nouns with a placeholder, leaving only shared wording and numbers. */
  const neutral = (text: string, t: ThemeConfig) =>
    [
      t.vocabulary.plural,
      t.vocabulary.singular,
      t.vocabulary.supplyNoun,
    ].reduce((acc, word) => acc.replaceAll(word, "<noun>"), text);

  it.each(ladder)("%s means the same in all five themes", (hintId) => {
    const shown = THEMES.map((t) =>
      presentHint(hintId, strategy, mission.challenge.start, t.vocabulary),
    );
    const [first, ...rest] = shown;
    rest.forEach((other, i) => {
      const theme = THEMES[i + 1];
      expect(other.highlightAbove, theme.id).toBe(first.highlightAbove);
      expect(other.text.match(/\d+/g), theme.id).toEqual(
        first.text.match(/\d+/g),
      );
      expect(neutral(other.text, theme), theme.id).toBe(
        neutral(first.text, THEMES[0]),
      );
      expect(other.text, theme.id).not.toBe(first.text); // nouns really differ
    });
  });

  it("never states the final answer in any hint", () => {
    const answer = mission.challenge.start - mission.challenge.takeAway;
    for (const theme of THEMES) {
      for (const hintId of ladder) {
        const { text } = presentHint(
          hintId,
          strategy,
          mission.challenge.start,
          theme.vocabulary,
        );
        expect(text).not.toMatch(new RegExp(`\\b${answer}\\b`));
      }
    }
  });

  it("the shared mission is the same problem whichever theme is shown", () => {
    expect(mission.challenge).toMatchObject({ start: 13, takeAway: 5 });
    for (const theme of THEMES) {
      expect(JSON.stringify(theme)).not.toContain(
        String(mission.problem.answer),
      );
    }
  });
});
