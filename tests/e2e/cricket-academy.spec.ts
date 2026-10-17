import { expect, test, type Page } from "@playwright/test";
import { FORBIDDEN } from "./helpers";

const start = (p: Page) => p.getByRole("button", { name: "Start practice" });
const ball = (p: Page, n: number) =>
  p.getByRole("button", { name: new RegExp(`^Ball ${n}, in the basket`) });
const answer = async (p: Page, n: number) => {
  await p
    .getByRole("radio", { name: String(n), exact: true })
    .check({ force: true });
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

test.describe("Draft make-ten lab", () => {
  test("a learner-driven four-step walk-through, local only", async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/")) requests.push(r.url());
    });
    await page.goto("/cricket/make-ten-lab");
    await expect(
      page.getByText(/no educator has reviewed|Draft activity/),
    ).toBeVisible();
    const lab = page.locator("[data-lab-step]");
    for (let n = 1; n <= 10; n++)
      await page
        .getByRole("button", { name: new RegExp(`^Ball ${n}, in the pile`) })
        .click();
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(lab).toHaveAttribute("data-lab-step", "2");
    // Balls that cannot act in this step are disabled, not silently inert.
    await expect(
      page.getByRole("button", { name: /^Ball 1, in the rack/ }),
    ).toBeDisabled();
    for (const n of [11, 12, 13])
      await page
        .getByRole("button", { name: new RegExp(`^Ball ${n}, in the pile`) })
        .click();
    await page.getByRole("button", { name: "3", exact: true }).click();
    await expect(page.getByTestId("lab-guess-feedback")).toContainText(
      "Look at the nets",
    );
    await page.getByRole("button", { name: "Try again" }).click();
    await page.getByRole("button", { name: "2", exact: true }).click();
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(lab).toHaveAttribute("data-lab-step", "3");
    for (const n of [1, 2])
      await page
        .getByRole("button", { name: new RegExp(`^Ball ${n}, in the rack`) })
        .click();
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(lab).toHaveAttribute("data-lab-step", "4");
    const left = page.getByRole("button", { name: /in the rack/ });
    const count = await left.count();
    expect(count).toBe(8);
    for (let i = 0; i < count; i++)
      await page.locator('[data-lab-place="rack"]').nth(i).click();
    await expect(page.getByTestId("lab-status")).toContainText("Counted: 8");
    await expect(page.getByTestId("lab-result")).toBeVisible();
    expect(requests).toEqual([]);
    await noOverflow(page);
  });
});
