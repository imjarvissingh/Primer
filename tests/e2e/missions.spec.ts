import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { FORBIDDEN, walk } from "./helpers";

const API = "/api/practice/mission";

/** Written out independently of src/themes so the test checks what users actually see. */
const THEMES = [
  {
    route: "/block-builder",
    name: "Block Builder",
    title: "The Broken Bridge",
    start: "Start building",
    playHeading: "Fix the bridge",
    Item: "Block",
    plural: "blocks",
    supplyPlace: "in the pile",
    builtPlace: "on the bridge",
    built: "On the bridge",
    story: /The builder has 13 blocks/,
    done: "The bridge is fixed!",
    home: "Try The Broken Bridge",
  },
  {
    route: "/space-construction",
    name: "Space Construction",
    title: "The Space Station Mission",
    start: "Start the mission",
    playHeading: "Build the station",
    Item: "Module",
    plural: "modules",
    supplyPlace: "in the supply",
    builtPlace: "on the station",
    built: "On the station",
    story: /The space engineer has 13 modules/,
    done: "The station is ready!",
    home: "Try The Space Station Mission",
  },
  {
    route: "/cricket",
    name: "Cricket Academy",
    title: "Practice at the Nets",
    start: "Start practice",
    playHeading: "Fill the practice nets",
    Item: "Ball",
    plural: "balls",
    supplyPlace: "in the basket",
    builtPlace: "at the nets",
    built: "At the nets",
    story: /The coach has 13 practice balls in a basket/,
    done: "Practice can begin!",
    home: "Try Practice at the Nets",
  },
  {
    route: "/basketball",
    name: "Basketball Challenge",
    title: "Court Practice",
    start: "Start court practice",
    playHeading: "Fill the court",
    Item: "Basketball",
    plural: "basketballs",
    supplyPlace: "in the rack",
    builtPlace: "on the court",
    built: "On the court",
    story: /The coach has 13 basketballs in the equipment rack/,
    done: "The court is ready!",
    home: "Try Court Practice",
  },
  {
    route: "/soccer",
    name: "Soccer Quest",
    title: "Training Day",
    start: "Start training",
    playHeading: "Set up the field",
    Item: "Soccer ball",
    plural: "soccer balls",
    supplyPlace: "in the bag",
    builtPlace: "on the field",
    built: "On the field",
    story: /The coach has 13 soccer balls in a storage bag/,
    done: "Training can start!",
    home: "Try Training Day",
  },
] as const;
type Theme = (typeof THEMES)[number];

const pick = (page: Page, n: number) =>
  page.getByRole("radio", { name: String(n), exact: true });
const check = (page: Page) =>
  page.getByRole("button", { name: "Check my answer" });
const supplyItem = (page: Page, t: Theme, n: number) =>
  page.getByRole("button", {
    name: new RegExp(`^${t.Item} ${n}, ${t.supplyPlace}`),
  });
const anySupply = (page: Page, t: Theme) =>
  page.getByRole("button", {
    name: new RegExp(`^${t.Item} \\d+, ${t.supplyPlace}`),
  });

async function startMission(page: Page, t: Theme) {
  await page.goto(t.route);
  await page.getByRole("button", { name: t.start }).click();
  await expect(
    page.getByRole("heading", { name: t.playHeading }),
  ).toBeVisible();
}
async function buildFive(page: Page, t: Theme) {
  for (let n = 1; n <= 5; n++) await supplyItem(page, t, n).click();
  await expect(
    page.getByText(
      `${t.plural[0].toUpperCase()}${t.plural.slice(1)} ${t.builtPlace}: 5`,
    ),
  ).toBeVisible();
}
/** Built / empty construction slots drawn in the decorative scene. */
const slotCount = (page: Page, kind: "built" | "empty") =>
  page.locator(`svg[data-scene] [data-slot="${kind}"]`);
async function expectSlots(page: Page, built: number, required = 5) {
  await expect(slotCount(page, "built")).toHaveCount(built);
  await expect(slotCount(page, "empty")).toHaveCount(required - built);
}
async function answer(page: Page, n: number) {
  // Wait out any in-flight request: controls are inert until the server replies.
  await expect(pick(page, n)).toBeEnabled();
  await pick(page, n).check({ force: true });
  await expect(check(page)).toHaveAttribute("aria-disabled", "false");
  await check(page).click();
}
async function tabTo(page: Page, target: Locator) {
  for (let i = 0; i < 80; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("Could not reach the target with Tab");
}

for (const t of THEMES) {
  test.describe(t.name, () => {
    test("full mission: build, wrong answer, hints, correct answer, completion, restart", async ({
      page,
    }) => {
      await startMission(page, t);
      await expect(page.getByText(t.story)).toBeVisible();
      await expect(anySupply(page, t)).toHaveCount(13);

      // Story and picture must agree before the answer is unlocked.
      await expect(pick(page, 8)).toBeDisabled();
      await buildFive(page, t);
      await expect(anySupply(page, t)).toHaveCount(8);
      // Un-tap one: the picker locks again; tap it back.
      await page
        .getByRole("button", {
          name: new RegExp(`^${t.Item} 5, ${t.builtPlace}`),
        })
        .click();
      await expect(pick(page, 8)).toBeDisabled();
      await supplyItem(page, t, 5).click();
      await expect(pick(page, 8)).toBeEnabled();

      await answer(page, 9);
      await expect(page.getByText(/Not quite yet/)).toBeVisible();
      await answer(page, 9);
      await expect(page.getByText("Hint 1", { exact: true })).toBeVisible();
      await expect(
        page.getByText(/same subtraction another way/i),
      ).toBeVisible();
      await expect(page.getByText(/Draft demo hint/)).toBeVisible();
      await answer(page, 7);
      await expect(page.getByText("Hint 2", { exact: true })).toBeVisible();
      await answer(page, 8);

      const done = page.getByRole("heading", { name: t.done });
      await expect(done).toBeVisible();
      await expect(done).toBeFocused();
      await expect(page.getByText(/does not measure mastery/)).toBeVisible();

      await page.getByRole("button", { name: "Start over" }).click();
      await expect(page.getByRole("heading", { name: t.title })).toBeVisible();
      await page.getByRole("button", { name: t.start }).click();
      await expect(anySupply(page, t)).toHaveCount(13);
    });

    test("repeated wrong answers reach a calm warm-up offer, and declining it ends calmly", async ({
      page,
    }) => {
      await startMission(page, t);
      await buildFive(page, t);
      for (let i = 0; i < 4; i++) await answer(page, 3);
      await expect(
        page.getByRole("heading", { name: /warm-up first/i }),
      ).toBeFocused();
      await expect(page.getByText(/fail|wrong/i)).toHaveCount(0);
      await page.getByRole("button", { name: "Not now" }).click();
      await expect(
        page.getByRole("heading", { name: /a little easier/i }),
      ).toBeVisible();
      await expect(page.getByText(/fail|wrong/i)).toHaveCount(0);
    });

    test("ten-frame pictures follow the authorized hints and never print the result", async ({
      page,
    }) => {
      const bodies: string[] = [];
      page.on("response", async (res) => {
        if (res.url().endsWith(API))
          bodies.push(await res.text().catch(() => ""));
      });
      await startMission(page, t);
      await buildFive(page, t);
      const frames = page.locator("figure.ten-frames");

      await answer(page, 9);
      await expect(page.getByText(/Not quite yet/)).toBeVisible();
      await expect(frames).toHaveCount(0);

      await answer(page, 9);
      await expect(page.getByText("Hint 1", { exact: true })).toBeVisible();
      await expect(frames).toHaveCount(1);
      await expect(frames.getByRole("img")).toHaveAttribute(
        "aria-label",
        new RegExp(`A picture of 13 ${t.plural} as one full ten and 3 extra`),
      );
      await expect(frames.locator('[data-cell="counter"]')).toHaveCount(10);
      await expect(frames.locator('[data-cell="take-now"]')).toHaveCount(3);
      // The server withheld hint 2's number from the hint 1 reply.
      expect(bodies.at(-1)).toContain('"takeFromTen":null');

      await answer(page, 9);
      await expect(page.getByText("Hint 2", { exact: true })).toBeVisible();
      await expect(frames.getByRole("img")).toHaveAttribute(
        "aria-label",
        /In the picture.*already taken.*2 marked to take next/,
      );
      await expect(frames.locator('[data-cell="counter"]')).toHaveCount(8);
      await expect(frames.locator('[data-cell="take-now"]')).toHaveCount(2);
      await expect(frames.locator('[data-cell="taken"]')).toHaveCount(3);
      // Nothing in the picture says how many are left.
      await expect(frames).not.toContainText(/\b8\b|left|remain/i);
      // The interactive field still holds exactly the learner's five.
      await expectSlots(page, 5);
      await expect(anySupply(page, t)).toHaveCount(8);
    });

    test("warm-up: offered once, answered, then back to the original mission and solved", async ({
      page,
    }) => {
      const bodies: string[] = [];
      page.on("response", async (res) => {
        if (res.url().endsWith(API))
          bodies.push(await res.text().catch(() => ""));
      });
      await startMission(page, t);
      await buildFive(page, t);
      for (let i = 0; i < 4; i++) await answer(page, 3);
      const offer = page.getByRole("heading", { name: /warm-up first/i });
      await expect(offer).toBeFocused();
      await page.getByRole("button", { name: "Try the warm-up" }).click();

      const warm = page.getByRole("heading", { name: "Warm-up" });
      await expect(warm).toBeFocused();
      await expect(anySupply(page, t)).toHaveCount(10);
      for (let n = 1; n <= 6; n++) await supplyItem(page, t, n).click();
      await expectSlots(page, 6, 6);
      await answer(page, 4);

      // Back on the original 13 - 5 with a fresh field.
      const back = page.getByRole("heading", { name: t.playHeading });
      await expect(back).toBeFocused();
      await expect(page.getByText(/You are back at the mission/)).toBeVisible();
      await expect(anySupply(page, t)).toHaveCount(13);
      await expectSlots(page, 0);
      await buildFive(page, t);
      await answer(page, 8);
      await expect(page.getByRole("heading", { name: t.done })).toBeVisible();
      await expect(page.getByText(/does not measure mastery/)).toBeVisible();

      // Responses stay free of answer keys and bank internals.
      for (const body of bodies) {
        for (const token of FORBIDDEN) expect(body.includes(token)).toBe(false);
        expect(body).not.toContain("mastery");
      }
    });

    test("the warm-up is bounded: leave it early, and it is never offered twice", async ({
      page,
    }) => {
      await startMission(page, t);
      await buildFive(page, t);
      for (let i = 0; i < 4; i++) await answer(page, 3);
      await page.getByRole("button", { name: "Try the warm-up" }).click();
      await expect(
        page.getByRole("heading", { name: "Warm-up" }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Back to the mission" })
        .first()
        .click();
      await expect(
        page.getByRole("heading", { name: t.playHeading }),
      ).toBeFocused();
      await buildFive(page, t);
      for (let i = 0; i < 4; i++) await answer(page, 3);
      await expect(
        page.getByRole("heading", { name: /a little easier/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /warm-up first/i }),
      ).toHaveCount(0);
    });

    test("keyboard-only: reach the offer, take the warm-up and come back", async ({
      page,
    }) => {
      await startMission(page, t);
      await buildFive(page, t);
      for (let i = 0; i < 4; i++) await answer(page, 3);
      await tabTo(page, page.getByRole("button", { name: "Try the warm-up" }));
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("heading", { name: "Warm-up" }),
      ).toBeFocused();
      await tabTo(
        page,
        page.getByRole("button", { name: "Back to the mission" }).first(),
      );
      await page.keyboard.press("Space");
      await expect(
        page.getByRole("heading", { name: t.playHeading }),
      ).toBeFocused();
    });

    for (const [name, width, height] of [
      // 320px is the WCAG 1.4.10 reflow width (Phase 8D audit found overflow here).
      ["very small mobile", 320, 640],
      ["small mobile", 360, 740],
      ["tablet", 768, 1024],
      ["desktop", 1440, 900],
    ] as const) {
      test(`ten-frame hint and warm-up fit with no horizontal overflow on ${name}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height });
        const overflow = () =>
          page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
        await startMission(page, t);
        await buildFive(page, t);
        await answer(page, 9);
        await answer(page, 9);
        await answer(page, 9);
        await expect(page.getByText("Hint 2", { exact: true })).toBeVisible();
        expect(await overflow()).toBeLessThanOrEqual(0);
        const svg = await page.locator("figure.ten-frames svg").boundingBox();
        expect(svg!.width).toBeGreaterThan(200);
        await answer(page, 9);
        await expect(
          page.getByRole("heading", { name: /warm-up first/i }),
        ).toBeVisible();
        expect(await overflow()).toBeLessThanOrEqual(0);
        for (const label of ["Try the warm-up", "Not now", "Stop for now"]) {
          const box = await page
            .getByRole("button", { name: label })
            .boundingBox();
          expect(box?.height).toBeGreaterThanOrEqual(44);
          expect(box?.width).toBeGreaterThanOrEqual(44);
        }
        await page.getByRole("button", { name: "Try the warm-up" }).click();
        await expect(
          page.getByRole("heading", { name: "Warm-up" }),
        ).toBeVisible();
        expect(await overflow()).toBeLessThanOrEqual(0);
      });
    }

    test("ten-frame pictures have no motion, with or without a reduced-motion preference", async ({
      page,
    }) => {
      for (const pref of ["reduce", "no-preference"] as const) {
        await page.emulateMedia({ reducedMotion: pref });
        await startMission(page, t);
        await buildFive(page, t);
        await answer(page, 9);
        await answer(page, 9);
        const cell = page.locator("figure.ten-frames [data-cell]").first();
        await expect(cell).toBeVisible();
        const style = await cell.evaluate((el) => {
          const c = getComputedStyle(el.querySelector("rect")!);
          return [c.animationName, c.transitionDuration];
        });
        expect(style).toEqual(["none", "0s"]);
      }
    });

    test("the scene builds up with each placed item and mirrors returns", async ({
      page,
    }) => {
      await page.goto(t.route);
      // Before the mission: a goal outline, but no per-item slots yet.
      await expectSlots(page, 0, 0);
      await page.getByRole("button", { name: t.start }).click();
      await expect(
        page.getByRole("heading", { name: t.playHeading }),
      ).toBeVisible();
      await expectSlots(page, 0);

      await supplyItem(page, t, 1).click();
      await expectSlots(page, 1);
      for (let n = 2; n <= 4; n++) await supplyItem(page, t, n).click();
      await expectSlots(page, 4);

      // Return one: one slot empties, and the supply regains an item.
      await page
        .getByRole("button", {
          name: new RegExp(`^${t.Item} 4, ${t.builtPlace}`),
        })
        .click();
      await expectSlots(page, 3);
      await expect(anySupply(page, t)).toHaveCount(10);

      await supplyItem(page, t, 4).click();
      await supplyItem(page, t, 5).click();
      await expectSlots(page, 5);
      await expect(pick(page, 8)).toBeEnabled();

      // A building that looks finished is not a correct answer.
      await expect(page.getByRole("heading", { name: t.done })).toHaveCount(0);

      // An incorrect answer leaves the construction exactly as it was.
      await answer(page, 9);
      await expect(page.getByText(/Not quite yet/)).toBeVisible();
      await expectSlots(page, 5);
      await expect(anySupply(page, t)).toHaveCount(8);

      await answer(page, 8);
      await expect(page.getByRole("heading", { name: t.done })).toBeVisible();

      await page.getByRole("button", { name: "Start over" }).click();
      await page.getByRole("button", { name: t.start }).click();
      await expect(
        page.getByRole("heading", { name: t.playHeading }),
      ).toBeVisible();
      await expectSlots(page, 0);
    });

    test("stop for now ends the mission and can be restarted", async ({
      page,
    }) => {
      await startMission(page, t);
      await page.getByRole("button", { name: "Stop for now" }).click();
      await expect(
        page.getByRole("heading", { name: "Taking a break" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Start over" }).click();
      await expect(page.getByRole("button", { name: t.start })).toBeVisible();
    });

    test("keyboard-only journey from start to completion", async ({ page }) => {
      await page.goto(t.route);
      await tabTo(page, page.getByRole("button", { name: t.start }));
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("heading", { name: t.playHeading }),
      ).toBeVisible();

      for (let n = 1; n <= 5; n++) {
        await tabTo(page, supplyItem(page, t, n));
        await page.keyboard.press(n % 2 === 0 ? "Enter" : "Space");
      }
      await expect(pick(page, 8)).toBeEnabled();
      await tabTo(page, pick(page, 0));
      for (let i = 0; i < 8; i++) await page.keyboard.press("ArrowRight");
      await expect(pick(page, 8)).toBeChecked();
      await tabTo(page, check(page));
      await page.keyboard.press("Enter");
      await expect(page.getByRole("heading", { name: t.done })).toBeFocused();
      await tabTo(page, page.getByRole("button", { name: "Start over" }));
      await page.keyboard.press("Enter");
      await expect(page.getByRole("heading", { name: t.title })).toBeVisible();
    });

    for (const [name, width, height] of [
      ["small mobile", 360, 740],
      ["tablet", 768, 1024],
      ["desktop", 1440, 900],
    ] as const) {
      test(`no horizontal overflow and big touch targets on ${name}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height });
        const overflow = () =>
          page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
        await page.goto(t.route);
        expect(await overflow()).toBeLessThanOrEqual(0);
        await page.getByRole("button", { name: t.start }).click();
        await expect(
          page.getByRole("heading", { name: t.playHeading }),
        ).toBeVisible();
        await buildFive(page, t);
        await answer(page, 9);
        await expect(page.getByText(/Not quite yet/)).toBeVisible();
        expect(await overflow()).toBeLessThanOrEqual(0);
        // Both ten-frame hints must also fit without sideways scrolling.
        for (const n of [1, 2]) {
          await answer(page, 9);
          await expect(
            page.getByText(`Hint ${n}`, { exact: true }),
          ).toBeVisible();
          expect(await overflow()).toBeLessThanOrEqual(0);
        }

        for (const target of [
          supplyItem(page, t, 6),
          check(page),
          page.getByRole("button", { name: "Stop for now" }),
        ]) {
          const box = await target.boundingBox();
          expect(box?.width).toBeGreaterThanOrEqual(44);
          expect(box?.height).toBeGreaterThanOrEqual(44);
        }
        await answer(page, 8);
        await expect(page.getByRole("heading", { name: t.done })).toBeVisible();
        expect(await overflow()).toBeLessThanOrEqual(0);
      });
    }

    test("the hint's outlined items are also named for assistive technology", async ({
      page,
    }) => {
      await startMission(page, t);
      await buildFive(page, t);
      const cued = page.getByRole("button", { name: /outlined by the hint/ });
      await expect(cued).toHaveCount(0);
      await answer(page, 9);
      await answer(page, 9);
      await expect(page.getByText("Hint 1", { exact: true })).toBeVisible();
      // "Take 3 first": exactly the three items numbered 11-13 carry the cue.
      await expect(cued).toHaveCount(3);
      await expect(
        supplyItem(page, t, 11).and(
          page.getByRole("button", { name: /outlined by the hint/ }),
        ),
      ).toHaveCount(1);
      await expect(supplyItem(page, t, 6)).not.toHaveAccessibleName(/outlined/);
    });

    // Phase 8D audit: between 640 and ~720px the two-column layout pushed the
    // fifth item of each row outside its panel (200% zoom on a 1280px screen).
    for (const width of [640, 700, 768]) {
      test(`every pile item stays inside its panel at ${width}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await startMission(page, t);
        const outside = await page.evaluate(() => {
          const panel = document.querySelector(".field-supply");
          if (panel === null) return -1;
          const right = panel.getBoundingClientRect().right;
          return [...panel.querySelectorAll(".item")].filter(
            (el) => el.getBoundingClientRect().right > right,
          ).length;
        });
        expect(outside).toBe(0);
      });
    }

    test("keyboard focus moves to the mission heading after Start and to the title after Start over", async ({
      page,
    }) => {
      await page.goto(t.route);
      const start = page.getByRole("button", { name: t.start });
      await start.focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("heading", { name: t.playHeading }),
      ).toBeFocused();
      await page.getByRole("button", { name: "Start over" }).click();
      await expect(page.getByRole("heading", { name: t.title })).toBeFocused();
    });

    for (const [pref, expected] of [
      ["reduce", "0s"],
      ["no-preference", "0.12s"],
    ] as const) {
      test(`item motion follows the ${pref} setting, and the mission still completes`, async ({
        page,
      }) => {
        await page.emulateMedia({ reducedMotion: pref });
        await startMission(page, t);
        const duration = await supplyItem(page, t, 1).evaluate(
          (el) => getComputedStyle(el).transitionDuration,
        );
        expect(duration).toBe(expected);
        await buildFive(page, t);
        await answer(page, 8);
        await expect(page.getByRole("heading", { name: t.done })).toBeVisible();
      });
    }

    for (const [pref, expected] of [
      ["reduce", "none"],
      ["no-preference", "slot-in"],
    ] as const) {
      test(`a new scene slot animates only when motion is allowed (${pref}), but always appears`, async ({
        page,
      }) => {
        await page.emulateMedia({ reducedMotion: pref });
        await startMission(page, t);
        await supplyItem(page, t, 1).click();
        await expectSlots(page, 1);
        const name = await slotCount(page, "built")
          .first()
          .evaluate((el) => getComputedStyle(el).animationName);
        expect(name).toBe(expected);
      });
    }

    test("a double-click on Check my answer sends one attempt", async ({
      page,
    }) => {
      await startMission(page, t);
      await buildFive(page, t);
      const attempts: string[] = [];
      page.on("request", (r) => {
        if (r.url().endsWith(API) && r.method() === "POST") {
          const body = r.postData() ?? "";
          if (body.includes('"attempt"')) attempts.push(body);
        }
      });
      await pick(page, 9).check({ force: true });
      await check(page).dblclick();
      await expect(page.getByText(/Not quite yet/)).toBeVisible();
      expect(attempts).toHaveLength(1);
    });

    test("no answer keys or bank content reach the browser", async ({
      page,
    }) => {
      const bodies: string[] = [];
      page.on("response", async (res) => {
        const type = res.headers()["content-type"] ?? "";
        if (/json|html|javascript|text/.test(type)) {
          bodies.push(`${res.url()}\n${await res.text().catch(() => "")}`);
        }
      });
      await startMission(page, t);
      await buildFive(page, t);
      for (let i = 0; i < 4; i++) await answer(page, i === 3 ? 8 : 3);
      await expect(page.getByRole("heading", { name: t.done })).toBeVisible();
      await page.waitForLoadState("networkidle");
      expect(bodies.length).toBeGreaterThan(3);
      for (const body of bodies) {
        for (const token of FORBIDDEN) {
          expect(
            body.includes(token),
            `"${token}" found in ${body.slice(0, 80)}`,
          ).toBe(false);
        }
      }
    });
  });
}

test("switching themes starts a fresh session and never carries progress over", async ({
  page,
}) => {
  const [bridge, space] = THEMES;
  await startMission(page, bridge);
  await buildFive(page, bridge);
  await answer(page, 9);
  await expect(page.getByText(/Not quite yet/)).toBeVisible();
  await page.getByRole("link", { name: "Back to Primer home" }).click();
  await page.getByRole("link", { name: space.home }).click();
  await expect(page).toHaveURL(/space-construction/);
  await expect(page.getByRole("heading", { name: space.title })).toBeVisible();
  await expect(
    page.locator("p:visible", {
      hasText: /begins a new practice session/,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: space.start }).click();
  await expect(anySupply(page, space)).toHaveCount(13);
  // The first wrong answer here is again "neutral": the earlier attempt did not count.
  await buildFive(page, space);
  await answer(page, 9);
  await expect(
    page.getByText(/Not quite yet. Look at the modules/),
  ).toBeVisible();
});

test("homepage links reach both missions", async ({ page }) => {
  for (const t of THEMES) {
    await page.goto("/");
    await page.getByRole("link", { name: t.home }).click();
    await expect(page).toHaveURL(new RegExp(t.route));
    await expect(
      page.getByRole("heading", { level: 1, name: t.name }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: t.title })).toBeVisible();
  }
});

test("the two themes look different but share the same layout and mathematics", async ({
  page,
}) => {
  const bg: string[] = [];
  for (const t of THEMES) {
    await startMission(page, t);
    bg.push(
      await page
        .locator(".mission-panel")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    );
    await expect(page.getByRole("radio")).toHaveCount(21);
    await expect(anySupply(page, t)).toHaveCount(13);
  }
  expect(bg[0]).not.toBe(bg[1]);
});

// ---- Answer isolation and API behaviour -----------------------------------

test("static client chunks on disk contain no answer keys or bank content", () => {
  const chunks = walk(path.resolve(".next/static")).filter((f) =>
    f.endsWith(".js"),
  );
  expect(chunks.length).toBeGreaterThan(0);
  for (const file of chunks) {
    const text = readFileSync(file, "utf8");
    for (const token of FORBIDDEN) {
      expect(
        text.includes(token),
        `"${token}" in ${path.relative(".", file)}`,
      ).toBe(false);
    }
  }
});

test("API responses expose only whitelisted fields", async ({ request }) => {
  const start = await request.post(API, {
    data: { action: "start", missionId: "subtract-practice" },
  });
  const s = await start.json();
  expect(Object.keys(s).sort()).toEqual([
    "challenge",
    "ok",
    "seq",
    "sessionId",
  ]);
  expect(Object.keys(s.challenge).sort()).toEqual([
    "maxAnswer",
    "missionId",
    "start",
    "takeAway",
  ]);
  const wrong = await request.post(API, {
    data: { action: "attempt", sessionId: s.sessionId, seq: 0, answer: 1 },
  });
  expect(Object.keys(await wrong.json()).sort()).toEqual([
    "feedback",
    "ok",
    "seq",
    "sessionStatus",
  ]);
});

test("invalid, duplicate and out-of-order requests are handled safely", async ({
  request,
}) => {
  const post = (data: unknown) => request.post(API, { data });
  const s = await (
    await post({ action: "start", missionId: "subtract-practice" })
  ).json();
  const id = s.sessionId as string;

  // Reserved assessment items cannot be requested, by name or as extra fields.
  expect((await post({ action: "start", missionId: "IN-01" })).status()).toBe(
    400,
  );
  expect(
    (
      await post({
        action: "start",
        missionId: "subtract-practice",
        itemId: "DL-01",
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await post({
        action: "attempt",
        sessionId: id,
        seq: 0,
        answer: 8,
        expectedAnswer: 1,
      })
    ).status(),
  ).toBe(400);
  // Oversized and malformed bodies.
  expect(
    (
      await request.post(API, {
        headers: { "content-type": "application/json" },
        data: "x".repeat(4000),
      })
    ).status(),
  ).toBe(413);
  expect(
    (
      await request.post(API, {
        headers: { "content-type": "application/json" },
        data: "{nope",
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await post({
        action: "attempt",
        sessionId: "not-a-uuid",
        seq: 0,
        answer: 8,
      })
    ).status(),
  ).toBe(400);
  // Unknown (e.g. expired or after restart) session.
  const ghost = await post({
    action: "skip",
    sessionId: "123e4567-e89b-42d3-a456-426614174000",
    seq: 0,
  });
  expect(ghost.status()).toBe(404);

  // A string "8" is never scored as correct.
  const bad = await (
    await post({ action: "attempt", sessionId: id, seq: 0, answer: "8" })
  ).json();
  expect(bad.feedback).toEqual({ kind: "ask-again" });
  expect(bad.sessionStatus).toBe("open");
  // Replaying seq 0 is stale.
  expect(
    (
      await post({ action: "attempt", sessionId: id, seq: 0, answer: 8 })
    ).status(),
  ).toBe(409);
  // The correct answer at the right seq finishes it; a repeat is refused.
  const ok = await (
    await post({ action: "attempt", sessionId: id, seq: 1, answer: 8 })
  ).json();
  expect(ok.feedback).toEqual({ kind: "correct" });
  expect(
    (
      await post({ action: "attempt", sessionId: id, seq: 2, answer: 8 })
    ).status(),
  ).toBe(409);
});
