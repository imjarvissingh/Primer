import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 8E: help the learner asks for (neutral feedback, Hint 1, Hint 2, the
 * warm-up offer) must land in view, be focused once and be announced once, on
 * narrow phones where it used to render below the fold.
 */
const WORLDS = [
  { route: "/block-builder", start: "Start building", item: "Block" },
  { route: "/space-construction", start: "Start the mission", item: "Module" },
] as const;
const VIEWPORTS = [
  [320, 640],
  [360, 740],
  [390, 844],
  [768, 1024],
  [1440, 900],
] as const;

async function toMission(page: Page, w: (typeof WORLDS)[number]) {
  await page.goto(w.route);
  await page.getByRole("button", { name: w.start }).click();
  await page.getByRole("heading", { level: 2 }).first().waitFor();
  for (let n = 1; n <= 5; n++)
    await page
      .getByRole("button", { name: new RegExp(`^${w.item} ${n}, in the`) })
      .click();
}
async function wrong(page: Page) {
  const radio = page.getByRole("radio", { name: "9", exact: true });
  await expect(radio).toBeEnabled();
  await radio.check({ force: true });
  await page.getByRole("button", { name: "Check my answer" }).click();
}
/** Where an element sits against the visible viewport right now. */
const inView = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      top: r.top,
      bottom: r.bottom,
      vh: window.innerHeight,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
    };
  }, selector);

for (const w of WORLDS) {
  for (const [width, height] of VIEWPORTS) {
    for (const motion of ["no-preference", "reduce"] as const) {
      test(`${w.route} ${width}px (${motion}): neutral feedback, Hint 1, Hint 2 and the offer are focused and in view`, async ({
        page,
      }) => {
        await page.emulateMedia({ reducedMotion: motion });
        await page.setViewportSize({ width, height });
        await toMission(page, w);

        const stages = [/Not quite yet/, "Hint 1", "Hint 2"] as const;
        for (const stage of stages) {
          await wrong(page);
          const region = page.locator("#feedback-panel");
          await expect(region).toBeFocused();
          await expect(region).toContainText(stage);
          // Scrolling is applied with focus; wait for it, then check position.
          await expect
            .poll(async () => {
              const r = await inView(page, "#feedback-panel");
              return r !== null && r.top >= 0 && r.top < r.vh - 40;
            })
            .toBe(true);
          const r = (await inView(page, "#feedback-panel"))!;
          expect(r.overflowX).toBeLessThanOrEqual(0);
          // The words (heading or first line) are fully on screen; a tall
          // ten-frame may continue below.
          const first = await region
            .locator("h3, p")
            .first()
            .evaluate((el) => el.getBoundingClientRect().bottom);
          expect(first).toBeLessThanOrEqual(r.vh);
          // Announced once: not a live region, and the words appear once.
          await expect(
            page.locator('[role="status"] #feedback-panel'),
          ).toHaveCount(0);
          await expect(page.locator("#feedback-panel")).toHaveCount(1);
          if (stage !== stages[0])
            await expect(
              page.getByText(stage as string, { exact: true }),
            ).toHaveCount(1);
        }

        await wrong(page); // fourth wrong attempt: the warm-up offer
        const offer = page.getByRole("heading", { name: /warm-up first/i });
        await expect(offer).toBeFocused();
        await expect(page.locator("#feedback-panel")).toHaveCount(0);
        await expect
          .poll(async () => (await offer.boundingBox())!.y)
          .toBeGreaterThanOrEqual(0);
        const yes = page.getByRole("button", { name: "Try the warm-up" });
        const box = (await yes.boundingBox())!;
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.y + box.height).toBeLessThanOrEqual(height);
        await page.keyboard.press("Tab");
        await expect(yes).toBeFocused();
      });
    }
  }

  test(`${w.route}: keyboard users land on the hint and can carry on from it`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await toMission(page, w);
    await wrong(page);
    await wrong(page);
    const region = page.locator("#feedback-panel");
    await expect(region).toBeFocused();
    await expect(region).toContainText("Hint 1");
    // Focus is on real, visible content: not a hidden or removed element.
    expect(await region.isVisible()).toBe(true);
    // The region is named by its title and described by the hint text.
    await expect(region).toHaveAccessibleName("Hint 1");
    await expect(region).toHaveAccessibleDescription(/take 3/i);
    // Shift+Tab goes back to the controls above; the page is not trapped.
    await page.keyboard.press("Shift+Tab");
    await expect(
      page.getByRole("button", { name: "Check my answer" }),
    ).toBeFocused();
    // The hint stays after focus leaves it.
    await expect(region).toContainText("Hint 1");
  });
}
