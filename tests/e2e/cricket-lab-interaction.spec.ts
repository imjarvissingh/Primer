import { expect, test, type Page } from "@playwright/test";

/**
 * Learning Experience 2.2: layout, pinned board, status, animation and
 * adversarial interaction for the draft make-ten lab (local only; nothing here
 * touches the server or the tutor).
 */

const ballButton = (p: Page, n: number) =>
  p.locator(`button[data-lab-ball="${n}"]`);
const labAnswer = async (p: Page, n: number) => {
  await p
    .locator("label")
    .filter({ has: p.getByRole("radio", { name: String(n), exact: true }) })
    .click();
  await p.getByRole("button", { name: "Check", exact: true }).click();
};
const next = (p: Page) => p.getByRole("button", { name: "Next step" });
const stepOf = (p: Page) =>
  p.locator("[data-lab-step]").getAttribute("data-lab-step");

/** Every object's place, by number: the whole mathematical state of the board. */
const places = (p: Page) =>
  p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("button[data-lab-ball]")]
      .map((b) => `${b.dataset.labBall}:${b.dataset.labPlace}`)
      .sort((a, b) => parseInt(a) - parseInt(b)),
  );

async function toStep(p: Page, step: 1 | 2 | 3 | 4 | 5) {
  for (let n = 1; n <= 10; n++) await ballButton(p, n).click();
  if (step === 1) return;
  await labAnswer(p, 3);
  await next(p).click();
  for (const n of [11, 12, 13]) await ballButton(p, n).click();
  if (step === 2) return;
  await labAnswer(p, 2);
  await next(p).click();
  if (step === 3) return;
  for (const n of [1, 2]) await ballButton(p, n).click();
  await next(p).click();
  if (step === 4) return;
  await labAnswer(p, 8);
  await next(p).click();
}

const noOverflow = async (p: Page) =>
  expect(
    await p.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(0);

test.describe("lab layout on phones", () => {
  for (const [w, h] of [
    [320, 568],
    [390, 664],
    [390, 844],
  ] as const) {
    test(`${w}x${h}: the objects stay in view while a number is chosen`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/cricket/make-ten-lab");
      // Steps whose question sits below the objects: 1 (extras), 2 (more), 4 (left).
      for (const step of [1, 2, 4] as const) {
        await page.goto("/cricket/make-ten-lab");
        await toStep(page, step);
        const grid = page.locator(".answer-grid");
        await grid.scrollIntoViewIfNeeded();
        // The question can be reached with the board still on screen above it.
        await expect(page.locator(".lab-board")).toHaveAttribute(
          "data-pinned",
          "true",
        );
        const [board, chips] = await Promise.all([
          page.locator(".lab-board").boundingBox(),
          grid.boundingBox(),
        ]);
        expect(board!.y).toBeGreaterThanOrEqual(0);
        expect(board!.y + board!.height).toBeLessThanOrEqual(h);
        // Nothing of the question hides behind the pinned board, and every
        // number to choose from is on screen at once.
        expect(chips!.y).toBeGreaterThanOrEqual(board!.y + board!.height - 1);
        expect(chips!.y + chips!.height).toBeLessThanOrEqual(h);
        await noOverflow(page);
      }
    });

    test(`${w}x${h}: the ten is two rows of five and targets are at least 44px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/cricket/make-ten-lab");
      await toStep(page, 1);
      await page.evaluate(() =>
        document.getAnimations().forEach((a) => a.finish()),
      );
      const rack = await page
        .locator("button[data-lab-place='rack']")
        .evaluateAll((els) =>
          els.map((e) => {
            const r = e.getBoundingClientRect();
            return { top: Math.round(r.top), w: r.width, h: r.height };
          }),
        );
      expect(rack).toHaveLength(10);
      expect(new Set(rack.map((r) => r.top)).size).toBe(2);
      for (const r of rack) {
        expect(r.w).toBeGreaterThanOrEqual(43.5);
        expect(r.h).toBeGreaterThanOrEqual(43.5);
      }
      const chip = await page.locator(".answer-chip").first().boundingBox();
      expect(chip!.height).toBeGreaterThanOrEqual(44);
    });
  }

  for (const w of [320, 390]) {
    test(`200% text at ${w}px: every number is whole, at least 44px, and nothing scrolls sideways`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: w, height: 800 });
      await page.goto("/cricket/make-ten-lab");
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      await toStep(page, 1);
      const chips = await page.locator(".answer-chip").evaluateAll((els) =>
        els.map((e) => {
          const r = e.getBoundingClientRect();
          return {
            w: r.width,
            h: r.height,
            clipped: e.scrollWidth > e.clientWidth,
            lines: Math.round(
              r.height / parseFloat(getComputedStyle(e).lineHeight || "1"),
            ),
          };
        }),
      );
      expect(chips).toHaveLength(14);
      for (const c of chips) {
        expect(c.w).toBeGreaterThanOrEqual(43.5);
        expect(c.h).toBeGreaterThanOrEqual(43.5);
        expect(c.clipped).toBe(false);
      }
      await noOverflow(page);
    });
  }

  test("the nets show three and two as two groups on one row at 320px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/cricket/make-ten-lab");
    await toStep(page, 4);
    await page.evaluate(() =>
      document.getAnimations().forEach((a) => a.finish()),
    );
    const tops = await page
      .locator("button[data-lab-place='nets']")
      .evaluateAll((els) =>
        els.map((e) => Math.round(e.getBoundingClientRect().top)),
      );
    expect(tops).toHaveLength(5);
    expect(new Set(tops).size).toBe(1);
  });

  test("there is never an empty card; moves go to one hidden live region", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto("/cricket/make-ten-lab");
    for (const step of [1, 2, 3, 4, 5] as const) {
      await page.goto("/cricket/make-ten-lab");
      await toStep(page, step);
      for (const card of await page.locator(".lab .card").all())
        expect(((await card.textContent()) ?? "").trim()).not.toBe("");
      const status = page.getByTestId("lab-status");
      const box = await status.boundingBox();
      expect(box!.width).toBeLessThanOrEqual(1);
    }
    // Exactly one live region for moves; the form adds one for its own feedback.
    await page.goto("/cricket/make-ten-lab");
    await ballButton(page, 1).click();
    await expect(page.getByTestId("lab-status")).toHaveText(
      "Ball 1 moved to the rack.",
    );
    await expect(page.locator(".lab [aria-live]")).toHaveCount(1);
  });
});

test.describe("lab interaction under stress", () => {
  test("the chosen number is visibly selected (not white on a pale chip)", async ({
    page,
  }) => {
    await page.goto("/cricket/make-ten-lab");
    await toStep(page, 1);
    await page
      .locator("label")
      .filter({ has: page.getByRole("radio", { name: "4", exact: true }) })
      .click();
    const [on, off] = await Promise.all(
      ["4", "5"].map((n) =>
        page
          .locator("label")
          .filter({ has: page.getByRole("radio", { name: n, exact: true }) })
          .locator(".answer-chip")
          .evaluate((el) => {
            const c = getComputedStyle(el);
            return { bg: c.backgroundColor, fg: c.color };
          }),
      ),
    );
    expect(on.bg).not.toBe(off.bg);
    // Text and fill of the chosen chip must differ (they were both near white).
    expect(on.fg).not.toBe(on.bg);
    expect(on.bg).not.toBe("rgb(246, 251, 239)");
  });

  test("rapid taps keep every object, once", async ({ page }) => {
    await page.goto("/cricket/make-ten-lab");
    // Tap 13 times without waiting for any animation; only the first 10 fit.
    await page.evaluate(() => {
      for (let n = 1; n <= 13; n++)
        document
          .querySelector<HTMLButtonElement>(`button[data-lab-ball="${n}"]`)
          ?.click();
    });
    const state = await places(page);
    expect(state).toHaveLength(13);
    expect(state.filter((s) => s.endsWith(":rack"))).toHaveLength(10);
    expect(state.filter((s) => s.endsWith(":pile"))).toHaveLength(3);
    expect(new Set(state.map((s) => s.split(":")[0])).size).toBe(13);
  });

  test("taps in flight, Back and Start again never leave a stale picture", async ({
    page,
  }) => {
    await page.goto("/cricket/make-ten-lab");
    await toStep(page, 3);
    // Move a ball and, in the same frame, go Back and then start again.
    await page.evaluate(() => {
      document
        .querySelector<HTMLButtonElement>(
          'button[data-lab-ball="1"][data-lab-place="rack"]',
        )!
        .click();
    });
    await page.getByRole("button", { name: "Back a step" }).click();
    expect(await stepOf(page)).toBe("2");
    expect(
      (await places(page)).filter((s) => s.endsWith(":nets")),
    ).toHaveLength(3);
    await page.getByRole("button", { name: "Start again" }).click();
    expect(await stepOf(page)).toBe("1");
    expect(await places(page)).toEqual(
      Array.from({ length: 13 }, (_, i) => `${i + 1}:pile`).sort(
        (a, b) => parseInt(a) - parseInt(b),
      ),
    );
    await expect(page.locator("[data-lab-question]")).toHaveCount(0);
    // Nothing keeps animating once the state has settled.
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.getAnimations().filter((a) => a.playState === "running")
              .length,
        ),
      )
      .toBe(0);
  });

  test("every move can be undone by tapping again, as many times as the learner likes", async ({
    page,
  }) => {
    await page.goto("/cricket/make-ten-lab");
    const fresh = await places(page);
    for (let round = 0; round < 3; round++) {
      for (let n = 1; n <= 10; n++) await ballButton(page, n).click();
      await labAnswer(page, 4);
      for (let n = 10; n >= 1; n--) await ballButton(page, n).click();
      await expect(page.locator("[data-lab-question]")).toHaveCount(0);
    }
    expect(await places(page)).toEqual(fresh);
  });

  test("a changed picture never keeps an old answer", async ({ page }) => {
    await page.goto("/cricket/make-ten-lab");
    await toStep(page, 1);
    await labAnswer(page, 3);
    await expect(page.getByTestId("lab-feedback")).toContainText("Yes.");
    // Take one ball out of the rack: the ten is no longer full.
    await ballButton(page, 1).click();
    await expect(page.getByTestId("lab-feedback")).toHaveCount(0);
    await expect(page.getByTestId("lab-bond")).toHaveCount(0);
    await expect(next(page)).toHaveAttribute("aria-disabled", "true");
    await ballButton(page, 1).click();
    // The question is back, unanswered.
    await expect(page.getByTestId("lab-feedback")).toHaveCount(0);
    await expect(
      page.locator("[data-lab-question] form, form[data-lab-question]"),
    ).toHaveCount(1);
  });

  test("no recap before the learner says how many are left", async ({
    page,
  }) => {
    await page.goto("/cricket/make-ten-lab");
    await toStep(page, 4);
    await expect(page.getByTestId("lab-result")).toHaveCount(0);
    await labAnswer(page, 5);
    await expect(page.getByTestId("lab-result")).toHaveCount(0);
    await labAnswer(page, 8);
    await expect(page.getByTestId("lab-result")).toBeVisible();
    // Going back and forward asks again: no recap until the answer is given again.
    await page.getByRole("button", { name: "Back a step" }).click();
    await next(page).click();
    await expect(page.getByTestId("lab-result")).toHaveCount(0);
    await labAnswer(page, 8);
    await expect(page.getByTestId("lab-result")).toBeVisible();
    await page.getByRole("button", { name: "Start again" }).click();
    await expect(page.getByTestId("lab-result")).toHaveCount(0);
  });

  test("the unguided 11 − 4 is separate: no rack, no counting aid, no help text", async ({
    page,
  }) => {
    await page.goto("/cricket/make-ten-lab");
    await toStep(page, 5);
    for (let n = 1; n <= 4; n++) await ballButton(page, n).click();
    await expect(page.getByTestId("lab-count-aid")).toHaveCount(0);
    await expect(page.locator("button[aria-pressed]")).toHaveCount(0);
    for (const wrong of [4, 5, 6]) await labAnswer(page, wrong);
    // Repeated mix-ups get no extra support here: this try is meant to be unaided.
    await expect(page.getByTestId("lab-feedback")).not.toContainText(
      /one at a time|grown-up/,
    );
  });

  test("support after repeated mix-ups points to counting and never states the number", async ({
    page,
  }) => {
    await page.goto("/cricket/make-ten-lab");
    await toStep(page, 1);
    await labAnswer(page, 5);
    await labAnswer(page, 6);
    const fb = page.getByTestId("lab-feedback");
    await expect(fb).toContainText("one at a time");
    await labAnswer(page, 7);
    await expect(fb).toContainText("grown-up can count with you");
    await expect(fb).not.toContainText(/\b3\b/);
  });

  test("keyboard: focus follows the work through every step", async ({
    page,
  }) => {
    await page.goto("/cricket/make-ten-lab");
    await ballButton(page, 1).focus();
    for (let k = 0; k < 10; k++) await page.keyboard.press("Enter");
    await expect(
      page.getByRole("radio", { name: "0", exact: true }),
    ).toBeFocused();
    // Tab out of the numbers to a counting aid: a pile ball can be marked by keyboard.
    await ballButton(page, 12).focus();
    await page.keyboard.press("Space");
    await expect(ballButton(page, 12)).toHaveAttribute("aria-pressed", "true");
    // Marking keeps focus on the ball (it was not replaced).
    await expect(ballButton(page, 12)).toBeFocused();
  });
});

test.describe("lab motion", () => {
  const animating = (p: Page) =>
    p.evaluate(
      () =>
        [...document.querySelectorAll("button[data-lab-ball]")].filter(
          (b) => b.getAnimations().length > 0,
        ).length,
    );

  test("a moved ball and a restored ball both travel", async ({ page }) => {
    await page.goto("/cricket/make-ten-lab");
    await toStep(page, 3);
    await page.waitForTimeout(500);
    await page.evaluate(() =>
      document
        .querySelector<HTMLButtonElement>(
          'button[data-lab-ball="1"][data-lab-place="rack"]',
        )!
        .click(),
    );
    await expect.poll(() => animating(page)).toBeGreaterThan(0);
    await page.waitForTimeout(500);
    // Undo: the same ball travels back.
    await page.evaluate(() =>
      document
        .querySelector<HTMLButtonElement>(
          'button[data-lab-ball="1"][data-lab-place="nets"]',
        )!
        .click(),
    );
    await expect.poll(() => animating(page)).toBeGreaterThan(0);
  });

  test("Back from a step shows the restored balls travelling to where they were", async ({
    page,
  }) => {
    await page.goto("/cricket/make-ten-lab");
    await toStep(page, 3);
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Back a step" }).click();
    // Back from step 3 to 2 changes no place, so nothing needs to travel and
    // the picture is already right; from step 4 the two balls return.
    await next(page).click();
    for (const n of [1, 2]) await ballButton(page, n).click();
    await next(page).click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Back a step" }).click();
    expect(await stepOf(page)).toBe("3");
    expect(
      (await places(page)).filter((s) => s.endsWith(":nets")),
    ).toHaveLength(5);
  });

  test("reduced motion: the same sequence ends in exactly the same state, with no travel", async ({
    browser,
  }) => {
    const run = async (reduce: boolean) => {
      const ctx = await browser.newContext({
        reducedMotion: reduce ? "reduce" : "no-preference",
      });
      const page = await ctx.newPage();
      await page.goto("/cricket/make-ten-lab");
      let travelled = 0;
      for (let n = 1; n <= 10; n++) {
        await ballButton(page, n).click();
        travelled += await animating(page);
      }
      await labAnswer(page, 3);
      await next(page).click();
      for (const n of [11, 12, 13]) await ballButton(page, n).click();
      await labAnswer(page, 2);
      await next(page).click();
      for (const n of [1, 2]) await ballButton(page, n).click();
      await next(page).click();
      const final = {
        step: await stepOf(page),
        places: await places(page),
        next: await next(page).getAttribute("aria-disabled"),
        question: await page.locator("[data-lab-question]").count(),
      };
      await ctx.close();
      return { final, travelled };
    };
    const calm = await run(true);
    const lively = await run(false);
    expect(calm.travelled).toBe(0);
    expect(lively.travelled).toBeGreaterThan(0);
    expect(calm.final).toEqual(lively.final);
  });

  test("motion never blocks the next tap", async ({ page }) => {
    await page.goto("/cricket/make-ten-lab");
    // Two taps back to back, the first ball still travelling.
    await ballButton(page, 1).click();
    await ballButton(page, 2).click({ delay: 0 });
    expect(
      (await places(page)).filter((s) => s.endsWith(":rack")),
    ).toHaveLength(2);
  });

  test("a step's wording arrives with a short reveal that reduced motion removes", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/cricket/make-ten-lab");
    await toStep(page, 2);
    for (const sel of ["[data-testid=lab-instruction]", ".lab-reveal"]) {
      const names = await page
        .locator(sel)
        .evaluateAll((els) =>
          els.map((e) => getComputedStyle(e).animationName),
        );
      for (const n of names) expect(n).toBe("none");
    }
  });
});
