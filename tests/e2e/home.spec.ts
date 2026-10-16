import { expect, test } from "@playwright/test";

test("homepage loads with the Primer heading", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle(/Primer/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Primer" }),
  ).toBeVisible();
  await expect(page.getByText("Block Builder")).toBeVisible();
  await expect(page.getByText("Space Construction")).toBeVisible();
});

for (const [name, width, height] of [
  ["mobile", 360, 740],
  ["tablet", 768, 1024],
  ["desktop", 1440, 900],
] as const) {
  test(`no horizontal overflow on ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("keyboard Tab reaches the demo link, does not trap focus, and page has a main landmark", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();
  // The only interactive elements are the four demo links; one more Tab leaves the page.
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Try The Broken Bridge" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Try The Space Station Mission" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Try the independent check" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "See the demo summary page" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
  expect(["BODY", "HTML"]).toContain(focusedTag);
});
