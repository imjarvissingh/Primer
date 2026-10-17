import { expect, test, type Page } from "@playwright/test";

/** Day 1: parent welcome -> interest selection -> adventure preview. */
const INTERESTS = [
  ["Cricket", "Cricket Academy", "practice balls", false],
  ["Building", "Block Builder", "blocks", true],
  ["Space", "Space Explorer", "repair modules", true],
  ["Basketball", "Basketball Challenge", "basketballs", false],
  ["Soccer", "Soccer Quest", "soccer balls", false],
] as const;
const WIDTHS = [320, 390, 768, 1440] as const;

const overflowX = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const chooser = async (page: Page) => {
  await page.goto("/welcome");
  await page.getByRole("button", { name: "Choose an interest" }).click();
};
const preview = (page: Page) =>
  page.getByRole("button", { name: /adventure preview/i });

test("the welcome route loads, is not indexed, and shows the disclosures", async ({
  page,
}) => {
  const response = await page.goto("/welcome");
  expect(response?.ok()).toBe(true);
  await expect(
    page.locator('meta[name="robots"][content*="noindex"]'),
  ).toHaveCount(1);
  await expect(page.getByTestId("disclosures")).toContainText(
    "qualified educator",
  );
  await expect(page.getByTestId("draft-banner")).toBeVisible();
});

test("walks through all five interests with changing previews and constant arithmetic", async ({
  page,
}) => {
  await chooser(page);
  for (const [title, world, noun, hasMission] of INTERESTS) {
    await page.getByRole("radio", { name: new RegExp(title) }).check();
    await expect(
      page.getByRole("radio", { name: new RegExp(title) }),
    ).toBeChecked();
    await preview(page).click();
    await expect(
      page.getByRole("heading", { level: 1, name: world }),
    ).toBeFocused();
    await expect(page.getByTestId("story")).toContainText(noun);
    await expect(page.getByTestId("number-sentence")).toHaveText("13 − 5 = ?");
    await expect(page.getByTestId("availability")).toContainText(
      hasMission ? "mission is ready to play" : "not playable yet",
    );
    expect(
      await page.getByRole("link", { name: /^Start the .* mission$/ }).count(),
    ).toBe(hasMission ? 1 : 0);
    await page.getByRole("button", { name: "Change interest" }).click();
  }
});

test("keyboard alone: tab to the options, arrow to change, continue with Enter", async ({
  page,
}) => {
  await page.goto("/welcome");
  await page.keyboard.press("Tab"); // skip link
  await page.keyboard.press("Tab"); // Back to Primer home
  await page.keyboard.press("Tab"); // Choose an interest
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await expect(page.getByRole("radio", { name: /Cricket/ })).toBeChecked();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio", { name: /Building/ })).toBeChecked();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio", { name: /Space/ })).toBeChecked();
  const focused = await page.evaluate(() => document.activeElement?.id ?? "");
  expect(focused).toBe("interest-space");
});

test("Surprise me picks a real interest and says so", async ({ page }) => {
  await chooser(page);
  await page.getByRole("radio", { name: /Surprise me/ }).check();
  await preview(page).click();
  await expect(page.getByTestId("surprise-note")).toContainText(
    "Primer picked",
  );
  await expect(page.getByTestId("number-sentence")).toHaveText("13 − 5 = ?");
});

test("makes no requests beyond the page itself and stores nothing", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.hostname !== "localhost") external.push(r.url());
    if (u.pathname.startsWith("/api")) external.push(r.url());
  });
  await chooser(page);
  await page.getByRole("radio", { name: /Soccer/ }).check();
  await preview(page).click();
  expect(external).toEqual([]);
  const stored = await page.evaluate(() => ({
    cookie: document.cookie,
    local: localStorage.length,
    session: sessionStorage.length,
  }));
  expect(stored).toEqual({ cookie: "", local: 0, session: 0 });
});

test("the homepage keeps its heading and links to interest choice", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Primer" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /choose what your child loves/ }),
  ).toHaveAttribute("href", "/welcome");
});

for (const width of WIDTHS) {
  for (const scale of [100, 200] as const) {
    test(`no sideways scroll at ${width}px, text ${scale}%, on every step`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/welcome");
      await page.evaluate((p) => {
        document.documentElement.style.fontSize = `${p}%`;
      }, scale);
      expect(await overflowX(page), "intro").toBeLessThanOrEqual(1);
      await page.getByRole("button", { name: "Choose an interest" }).click();
      expect(await overflowX(page), "choose").toBeLessThanOrEqual(1);
      for (const [title, world] of INTERESTS) {
        await page.getByRole("radio", { name: new RegExp(title) }).check();
        await preview(page).click();
        await expect(
          page.getByRole("heading", { level: 1, name: world }),
        ).toBeVisible();
        expect(await overflowX(page), `preview ${title}`).toBeLessThanOrEqual(
          1,
        );
        await page.getByRole("button", { name: "Change interest" }).click();
      }
    });
  }
}

test("reduced motion: nothing animates and every step still works", async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await chooser(page);
  const animated = await page.evaluate(
    () =>
      document.getAnimations().filter((a) => a.playState === "running").length,
  );
  expect(animated).toBe(0);
  await page.getByRole("radio", { name: /Space/ }).check();
  await preview(page).click();
  await expect(page.getByTestId("story")).toContainText("modules");
  await context.close();
});

test("touch targets: every option card is large", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await chooser(page);
  for (const radio of await page.getByRole("radio").all()) {
    const box = await radio.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});
