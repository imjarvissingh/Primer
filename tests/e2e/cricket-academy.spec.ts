import { expect, test, type Page } from "@playwright/test";
import { FORBIDDEN } from "./helpers";

const start = (p: Page) => p.getByRole("button", { name: "Start practice" });
const ball = (p: Page, n: number) =>
  p.getByRole("button", { name: new RegExp(`^Ball ${n}, in the basket`) });
const answer = async (p: Page, n: number) => {
  await p
    .locator("label")
    .filter({ has: p.getByRole("radio", { name: String(n), exact: true }) })
    .click();
  await p.getByRole("button", { name: "Check my answer" }).click();
};
const noOverflow = async (p: Page) =>
  expect(
    await p.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(0);

async function begin(p: Page) {
  await p.goto("/cricket");
  await start(p).click();
  await expect(
    p.getByRole("heading", { name: "Fill the practice nets" }),
  ).toBeVisible();
}

test.describe("Cricket introduction", () => {
  test("plays its story, can be skipped, and replays from the start", async ({
    page,
  }) => {
    await page.goto("/cricket");
    const intro = page.locator("[data-intro-beat]");
    await expect(intro).toHaveAttribute("data-intro-beat", "arrive");
    await expect(page.getByTestId("intro-caption")).toContainText(
      "Coach Bails",
    );
    // Autoplay advances on its own (beat length 3.8s).
    await expect(intro).toHaveAttribute("data-intro-beat", "station", {
      timeout: 8000,
    });
    await page.getByRole("button", { name: "Skip story" }).click();
    await expect(intro).toHaveAttribute("data-intro-beat", "job");
    await expect(intro).toHaveAttribute("data-intro-mode", "skipped");
    await page.getByRole("button", { name: "Replay story" }).click();
    await expect(intro).toHaveAttribute("data-intro-beat", "arrive");
    // Never blocks: the mission starts at any moment.
    await start(page).click();
    await expect(
      page.getByRole("heading", { name: "Fill the practice nets" }),
    ).toBeVisible();
  });

  test("with reduced motion it does not autoplay and steps with buttons", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/cricket");
    const intro = page.locator("[data-intro-beat]");
    await page.waitForTimeout(4500);
    await expect(intro).toHaveAttribute("data-intro-beat", "arrive");
    for (const beat of ["station", "nets", "job"]) {
      await page.getByRole("button", { name: "Next" }).click();
      await expect(intro).toHaveAttribute("data-intro-beat", beat);
    }
    await expect(
      page.getByRole("button", { name: "Replay story" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Pause story/ })).toHaveCount(
      0,
    );
  });

  test("the final story frame keeps all five target spots in view on a phone", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/cricket");
    for (let i = 0; i < 3; i++)
      await page.getByRole("button", { name: "Next" }).click();
    const stage = await page.locator(".cricket-intro-stage").boundingBox();
    const spots = page.locator(".intro-spot");
    await expect(spots).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      const r = (await spots.nth(i).boundingBox())!;
      expect(r.x).toBeGreaterThanOrEqual(stage!.x - 1);
      expect(r.x + r.width).toBeLessThanOrEqual(stage!.x + stage!.width + 1);
    }
  });

  test("keyboard can operate the story controls", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/cricket");
    const next = page.getByRole("button", { name: "Next" });
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-intro-beat]")).toHaveAttribute(
      "data-intro-beat",
      "station",
    );
  });
});

test.describe("Cricket play", () => {
  test("quantities stay consistent: 13 start, 5 used, undo restores, rapid taps", async ({
    page,
  }) => {
    await begin(page);
    const board = page.getByLabel("Scoreboard");
    await expect(board.locator('[data-board="start"]')).toHaveText("13");
    await expect(board.locator('[data-board="left"]')).not.toContainText("8");
    await expect(
      page.getByRole("button", { name: /^Ball \d+, in the basket/ }),
    ).toHaveCount(13);
    for (const n of [1, 2, 3]) await ball(page, n).click();
    await expect(board.locator('[data-board="used"]')).toContainText("3 of 5");
    // Undo: a moved ball goes back and the basket is whole again.
    await page.getByRole("button", { name: /^Ball 2, at the nets/ }).click();
    await expect(
      page.getByRole("button", { name: /^Ball \d+, in the basket/ }),
    ).toHaveCount(11);
    await expect(board.locator('[data-board="used"]')).toContainText("2 of 5");
    // Rapid taps on one ball never break the count.
    const b4 = ball(page, 4);
    await b4.dblclick();
    const moved = await page
      .getByRole("button", { name: /^Ball \d+, at the nets/ })
      .count();
    const inBasket = await page
      .getByRole("button", { name: /^Ball \d+, in the basket/ })
      .count();
    expect(moved + inBasket).toBe(13);
  });

  test("'Make a ten' regroups the same balls and keeps focus usable", async ({
    page,
  }) => {
    await begin(page);
    await page.getByRole("button", { name: "Make a ten" }).click();
    await expect(
      page.getByRole("group", { name: "Rack of ten" }).getByRole("button"),
    ).toHaveCount(10);
    await expect(
      page.getByRole("group", { name: "Extra balls" }).getByRole("button"),
    ).toHaveCount(3);
    await ball(page, 11).focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", { name: /^Ball 11, at the nets/ }),
    ).toBeVisible();
    // Focus lands on the next ball in the basket, not the page.
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(
      "BUTTON",
    );
  });

  test("a wrong answer never celebrates; a right one (server-confirmed) completes and shows the real result", async ({
    page,
  }) => {
    await begin(page);
    for (const n of [1, 2, 3, 4, 5]) await ball(page, n).click();
    await answer(page, 9);
    await expect(page.getByText("Not quite yet.")).toBeVisible();
    await expect(page.locator('.stage-scene[data-solved="true"]')).toHaveCount(
      0,
    );
    await expect(page.getByText("Practice can begin!")).toHaveCount(0);
    await answer(page, 8);
    await expect(page.getByText("Practice can begin!")).toBeVisible();
    await expect(page.locator('.stage-scene[data-solved="true"]')).toHaveCount(
      1,
    );
    await expect(page.locator('[data-aftermath="nets"] .item')).toHaveCount(5);
    await expect(page.locator('[data-aftermath="basket"] .item')).toHaveCount(
      8,
    );
    // Replay begins a fresh session: nothing carried over.
    await page.getByRole("button", { name: "Start over" }).click();
    await start(page).click();
    await expect(
      page.getByRole("button", { name: /^Ball \d+, in the basket/ }),
    ).toHaveCount(13);
    await expect(
      page.getByLabel("Scoreboard").locator('[data-board="used"]'),
    ).toContainText("0 of 5");
    await expect(page.locator("[data-aftermath]")).toHaveCount(0);
  });

  test("existing authorized hints still arrive and the page leaks no answer key", async ({
    page,
  }) => {
    await begin(page);
    for (const n of [1, 2, 3, 4, 5]) await ball(page, n).click();
    await answer(page, 9);
    await expect(page.getByText("Not quite yet.")).toBeVisible();
    await answer(page, 9);
    await expect(page.getByRole("heading", { name: "Hint 1" })).toBeVisible();
    const html = await page.content();
    for (const token of FORBIDDEN) expect(html.includes(token)).toBe(false);
  });
});

test.describe("Cricket responsive", () => {
  for (const w of [320, 390, 768, 1024, 1440]) {
    test(`no sideways scroll at ${w}px (intro, play, finale)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: w, height: 800 });
      await page.goto("/cricket");
      await noOverflow(page);
      await start(page).click();
      await expect(
        page.getByRole("heading", { name: "Fill the practice nets" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Make a ten" }).click();
      await noOverflow(page);
      for (const n of [1, 2, 3, 4, 5]) await ball(page, n).click();
      await answer(page, 8);
      await expect(page.getByText("Practice can begin!")).toBeVisible();
      await noOverflow(page);
    });
  }
});

const labBall = (p: Page, n: number, where: string) =>
  p.getByRole("button", { name: new RegExp(`^Ball ${n}, ${where}`) });
const labAnswer = async (p: Page, n: number) => {
  await p
    .locator("label")
    .filter({ has: p.getByRole("radio", { name: String(n), exact: true }) })
    .click();
  await p.getByRole("button", { name: "Check", exact: true }).click();
};
const next = (p: Page) => p.getByRole("button", { name: "Next step" });

/**
 * Walk the lesson with right answers. Steps 1 and 2 stop after their moves
 * (question open, not answered); step 3 stops on arrival; step 4 on arrival.
 */
async function labTo(p: Page, step: 1 | 2 | 3 | 4) {
  const lab = p.locator("[data-lab-step]");
  for (let n = 1; n <= 10; n++) await labBall(p, n, "outside the rack").click();
  if (step === 1) return;
  await labAnswer(p, 3);
  await next(p).click();
  await expect(lab).toHaveAttribute("data-lab-step", "2");
  for (const n of [11, 12, 13]) await labBall(p, n, "outside the rack").click();
  if (step === 2) return;
  await labAnswer(p, 2);
  await next(p).click();
  await expect(lab).toHaveAttribute("data-lab-step", "3");
  if (step === 3) return;
  for (const n of [1, 2]) await labBall(p, n, "in the rack").click();
  await next(p).click();
  await expect(lab).toHaveAttribute("data-lab-step", "4");
}

test.describe("Draft make-ten lab", () => {
  test("five learner-driven steps, every number from the learner, local only", async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/")) requests.push(r.url());
    });
    await page.goto("/cricket/make-ten-lab");
    await expect(page.getByText(/no educator has reviewed/)).toBeVisible();
    const lab = page.locator("[data-lab-step]");
    const feedback = page.getByTestId("lab-feedback");

    // Step 1: no question and no Next until the ten is made.
    await expect(page.getByText("To go on, fill the rack.")).toBeVisible();
    for (let n = 1; n <= 9; n++)
      await labBall(page, n, "outside the rack").click();
    await expect(page.locator("[data-lab-question]")).toHaveCount(0);
    await labBall(page, 10, "outside the rack").click();
    // A full rack: the three outside cannot be added; they can be marked to count.
    await labBall(page, 11, "outside the rack").click();
    await expect(page.locator("[data-lab-place='rack']")).toHaveCount(10);
    await expect(labBall(page, 11, "outside the rack")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await labAnswer(page, 10);
    await expect(feedback).toContainText("10 is how many are in the rack");
    await expect(next(page)).toHaveAttribute("aria-disabled", "true");
    await expect(
      page.getByText("To go on, answer the question."),
    ).toBeVisible();
    await labAnswer(page, 3);
    await expect(feedback).toContainText("Yes. 13 is 10 and 3.");
    await expect(page.getByTestId("lab-bond")).toBeVisible();
    await next(page).click();
    await expect(lab).toHaveAttribute("data-lab-step", "2");

    // Step 2: only the extras move; then "how many more?".
    await expect(labBall(page, 1, "in the rack")).toBeDisabled();
    for (const n of [11, 12, 13])
      await labBall(page, n, "outside the rack").click();
    await labAnswer(page, 5);
    await expect(feedback).toContainText("5 is how many Coach Bails needs");
    await labAnswer(page, 2);
    await expect(feedback).toContainText("Yes. 5 is 3 and 2.");
    await next(page).click();

    // Step 3: two from the ten; never a third.
    // The number to take is the learner's own from step 2; it is not repeated.
    await expect(page.getByTestId("lab-instruction")).toContainText(
      "Take that many balls from the rack",
    );
    await expect(page.getByTestId("lab-instruction")).not.toContainText("2");
    await expect(page.getByText("At the nets: 3 of 5")).toBeVisible();
    await labBall(page, 1, "in the rack").click();
    await labBall(page, 2, "in the rack").click();
    await expect(labBall(page, 3, "in the rack")).toBeDisabled();
    await next(page).click();
    await expect(lab).toHaveAttribute("data-lab-step", "4");

    // Step 4: the result is not on the page until the learner says it.
    await expect(page.getByTestId("lab-result")).toHaveCount(0);
    await expect(page.locator("[data-lab-place='rack']")).toHaveCount(8);
    await labBall(page, 3, "in the rack").click();
    await expect(labBall(page, 3, "in the rack")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await labAnswer(page, 5);
    await expect(feedback).toContainText("5 is how many went to the nets");
    await expect(page.getByTestId("lab-result")).toHaveCount(0);
    await labAnswer(page, 8);
    await expect(page.getByTestId("lab-result")).toContainText(
      "You took the 3 extras, then 2 more from the ten. 13 take away 5 leaves 8.",
    );
    await next(page).click();

    // Step 5: a new, unguided problem; no rack, no strategy words.
    await expect(lab).toHaveAttribute("data-lab-step", "5");
    await expect(page.getByTestId("lab-instruction")).toContainText("11 balls");
    await expect(page.getByLabel("Rack (holds 10)")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /outside the rack/ }),
    ).toHaveCount(0);
    for (let n = 1; n <= 4; n++)
      await labBall(page, n, "with Coach Bails").click();
    await labAnswer(page, 4);
    await expect(feedback).toContainText("does not match yet");
    await expect(feedback).not.toContainText(/ten|extra/);
    await labAnswer(page, 7);
    await expect(feedback).toContainText("end of this draft activity");

    expect(requests).toEqual([]);
    await noOverflow(page);
  });

  test("Back returns to the previous step as it was; Start again resets", async ({
    page,
  }) => {
    await page.goto("/cricket/make-ten-lab");
    const lab = page.locator("[data-lab-step]");
    await labTo(page, 3);
    await page.getByRole("button", { name: "Back a step" }).click();
    await expect(lab).toHaveAttribute("data-lab-step", "2");
    await expect(page.locator("[data-lab-place='nets']")).toHaveCount(3);
    await expect(page.getByRole("heading", { level: 2 })).toBeFocused();
    // The restored step shows the learner's own (right) answer, not a blank picker.
    await expect(page.getByText("Your answer: 2")).toBeVisible();
    await expect(page.getByTestId("lab-feedback")).toContainText(
      "Yes. 5 is 3 and 2.",
    );
    await page.getByRole("button", { name: "Start again" }).click();
    await expect(lab).toHaveAttribute("data-lab-step", "1");
    await expect(page.locator("[data-lab-place='pile']")).toHaveCount(13);
    await expect(page.getByRole("button", { name: "Back a step" })).toHaveCount(
      0,
    );
  });

  test("works by keyboard alone, and focus stays with the objects", async ({
    page,
  }) => {
    await page.goto("/cricket/make-ten-lab");
    await labBall(page, 1, "outside the rack").focus();
    for (let k = 0; k < 10; k++) await page.keyboard.press("Enter");
    await expect(page.locator("[data-lab-place='rack']")).toHaveCount(10);
    // The question opened and took focus.
    await expect(
      page.getByRole("radio", { name: "0", exact: true }),
    ).toBeFocused();
    // Arrow keys choose a number, as for any radio group.
    for (let k = 0; k < 3; k++) await page.keyboard.press("ArrowRight");
    await expect(
      page.getByRole("radio", { name: "3", exact: true }),
    ).toBeChecked();
    await page
      .getByRole("button", { name: "Check", exact: true })
      .press("Enter");
    await expect(page.getByTestId("lab-feedback")).toContainText("Yes.");
    await next(page).press("Enter");
    await expect(page.getByRole("heading", { level: 2 })).toBeFocused();
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(
      "Start with the extras",
    );
  });

  /** Press a ball and report whether the moved ball is animating right after. */
  const movedBallAnimates = (p: Page) =>
    p.evaluate(() => {
      document
        .querySelector<HTMLButtonElement>('button[data-lab-place="pile"]')!
        .click();
      return new Promise<boolean>((done) =>
        requestAnimationFrame(() =>
          done(
            [
              ...document.querySelectorAll('button[data-lab-place="rack"]'),
            ].some((b) => b.getAnimations().length > 0),
          ),
        ),
      );
    });

  test("motion: a moved ball travels to its new place", async ({ page }) => {
    await page.goto("/cricket/make-ten-lab");
    expect(await movedBallAnimates(page)).toBe(true);
  });

  test("reduced motion: same steps, no travel and no reveal animation", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/cricket/make-ten-lab");
    expect(await movedBallAnimates(page)).toBe(false);
    for (let n = 2; n <= 10; n++)
      await labBall(page, n, "outside the rack").click();
    await labAnswer(page, 3);
    const bond = page.getByTestId("lab-bond");
    await expect(bond).toBeVisible();
    expect(
      await bond.evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("none");
  });

  test("the lab never touches the server and the mission is unchanged", async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/")) requests.push(r.url());
    });
    await page.goto("/cricket/make-ten-lab");
    await labTo(page, 4);
    await labAnswer(page, 8);
    expect(requests).toEqual([]);
    const html = await page.content();
    for (const token of FORBIDDEN) expect(html.includes(token)).toBe(false);
  });

  for (const w of [320, 390, 768, 1024, 1440]) {
    test(`no sideways scroll at ${w}px through every step`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: w, height: 800 });
      await page.goto("/cricket/make-ten-lab");
      await noOverflow(page);
      await labTo(page, 2);
      await noOverflow(page);
      await labAnswer(page, 2);
      await noOverflow(page);
      await next(page).click();
      for (const n of [1, 2]) await labBall(page, n, "in the rack").click();
      await next(page).click();
      await labAnswer(page, 8);
      await noOverflow(page);
      await next(page).click();
      await noOverflow(page);
    });
  }

  test("200% text at 320px: usable and no sideways scroll", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/cricket/make-ten-lab");
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await noOverflow(page);
    await labTo(page, 4);
    await labAnswer(page, 8);
    await expect(page.getByTestId("lab-result")).toBeVisible();
    await noOverflow(page);
  });
});
