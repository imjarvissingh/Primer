import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 8F (A11Y-11): larger text must never make the page scroll sideways.
 *
 * Technique: the root font size is raised to 200% (every rem-based size follows
 * it, as with a browser's default-font-size setting). That is NOT the same as
 * browser zoom, which also shrinks the CSS viewport, so the matrix also covers
 * narrow viewports (320 px is a 1280 px screen at 400% zoom).
 */
const WORLDS = [
  { route: "/block-builder", start: "Start building", item: "Block" },
  { route: "/space-construction", start: "Start the mission", item: "Module" },
] as const;
const WIDTHS = [320, 360, 390, 768, 1440] as const;
const SCALES = [100, 200] as const;

async function setScale(page: Page, percent: number) {
  await page.evaluate((p) => {
    document.documentElement.style.fontSize = `${p}%`;
  }, percent);
}
/** Page-level sideways overflow in CSS px (rounding tolerance: 1 px). */
const overflowX = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
async function expectNoOverflow(page: Page, label: string) {
  expect(await overflowX(page), label).toBeLessThanOrEqual(1);
}
/** The scene frame must sit inside the viewport, not just be clipped by it. */
async function expectSceneContained(page: Page) {
  const box = await page.locator("div.scene-enter").first().boundingBox();
  const vw = await page.evaluate(() => window.innerWidth);
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(vw + 1);
}
const supply = (page: Page, w: (typeof WORLDS)[number], n: number) =>
  page.getByRole("button", {
    name: new RegExp(`^${w.item} ${n}, in the`),
  });
async function answer(page: Page, n: number) {
  const radio = page.getByRole("radio", { name: String(n), exact: true });
  await expect(radio).toBeEnabled();
  await radio.check({ force: true });
  await page.getByRole("button", { name: "Check my answer" }).click();
}

for (const w of WORLDS) {
  for (const width of WIDTHS) {
    for (const scale of SCALES) {
      test(`${w.route} at ${width}px, text ${scale}%: no sideways page scroll in any mission state`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 760 });
        await page.goto(w.route);
        await setScale(page, scale);
        await expectNoOverflow(page, "intro");
        await expectSceneContained(page);

        await page.getByRole("button", { name: w.start }).click();
        await page.getByRole("heading", { level: 2 }).first().waitFor();
        await expectNoOverflow(page, "playing, nothing built");
        await expectSceneContained(page);

        await supply(page, w, 1).click();
        await supply(page, w, 2).click();
        await expectNoOverflow(page, "partial construction");
        for (let n = 3; n <= 5; n++) await supply(page, w, n).click();
        await expectNoOverflow(page, "full construction");

        // A wrong answer, three times: feedback, Hint 1, Hint 2, then the offer.
        for (const stage of [/Not quite yet/, "Hint 1", "Hint 2"] as const) {
          await answer(page, 9);
          await expect(page.locator("#feedback-panel")).toContainText(stage);
          await expectNoOverflow(page, String(stage));
        }
        await answer(page, 9);
        await expect(
          page.getByRole("heading", { name: /warm-up first/i }),
        ).toBeVisible();
        await expectNoOverflow(page, "warm-up offer");
        await page.getByRole("button", { name: /try the warm-up/i }).click();
        await expect(
          page.getByRole("button", { name: "Check my answer" }),
        ).toBeVisible();
        await expectNoOverflow(page, "warm-up activity");
      });
    }
  }
}

test("homepage and the other pages do not scroll sideways at 200% text", async ({
  page,
}) => {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 760 });
    for (const route of ["/", "/assessment", "/demo-progress"]) {
      await page.goto(route);
      await setScale(page, 200);
      await expectNoOverflow(page, `${route} at ${width}px`);
    }
  }
});

for (const w of WORLDS) {
  test(`${w.route}: at 200% text and 390px the mission still works end to end`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await page.goto(w.route);
    await setScale(page, 200);
    const start = page.getByRole("button", { name: w.start });
    await expect(start).toBeVisible();
    await start.click();
    await page.getByRole("heading", { level: 2 }).first().waitFor();

    const built = () => page.locator('svg[data-scene] [data-slot="built"]');
    // Selecting and returning resources moves the artwork's progress with them.
    await supply(page, w, 1).click();
    await supply(page, w, 2).click();
    await expect(built()).toHaveCount(2);
    await page.getByRole("button", { name: /^Block 2, |^Module 2, / }).click();
    await expect(built()).toHaveCount(1);
    for (let n = 2; n <= 5; n++) await supply(page, w, n).click();
    await expect(built()).toHaveCount(5);

    // Controls are on screen and large enough to touch (48 css px at 100%).
    const checkBtn = page.getByRole("button", { name: "Check my answer" });
    await checkBtn.scrollIntoViewIfNeeded();
    const cb = (await checkBtn.boundingBox())!;
    expect(cb.x).toBeGreaterThanOrEqual(0);
    expect(cb.x + cb.width).toBeLessThanOrEqual(391);
    expect(cb.height).toBeGreaterThanOrEqual(44);

    // Feedback is discoverable: it takes focus and is visible.
    await answer(page, 9);
    const region = page.locator("#feedback-panel");
    await expect(region).toBeFocused();
    await expect(region).toBeInViewport();

    await page.getByRole("button", { name: "Start over" }).click();
    await expect(page.getByRole("button", { name: w.start })).toBeVisible();
    await expectNoOverflow(page, "after start over");
  });
}

// Font metrics differ by OS (CI's Linux fonts are wider than a Mac's), so the
// tightest case is also checked with a deliberately wide face.
for (const w of WORLDS) {
  test(`${w.route}: a wide font at 320px and 200% text still has no sideways scroll`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    for (const route of ["/", w.route]) {
      await page.goto(route);
      await page.addStyleTag({
        content:
          "body{font-family:Verdana,'DejaVu Sans',sans-serif !important}",
      });
      await setScale(page, 200);
      await expectNoOverflow(page, `${route} wide font`);
    }
    await page.getByRole("button", { name: w.start }).click();
    await page.getByRole("heading", { level: 2 }).first().waitFor();
    await expectNoOverflow(page, "playing, wide font");
  });
}
