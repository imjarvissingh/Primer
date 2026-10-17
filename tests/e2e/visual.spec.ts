import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
  "/block-builder",
  "/space-construction",
  "/cricket",
  "/basketball",
  "/soccer",
  "/welcome",
  "/assessment",
  "/demo-progress",
];

for (const [name, width, height] of [
  ["mobile", 360, 740],
  ["tablet", 768, 1024],
  ["desktop", 1440, 900],
] as const) {
  test(`every page fits the ${name} viewport with no horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    for (const route of ROUTES) {
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, route).toBeLessThanOrEqual(0);
    }
  });
}

test("mission intros show a construction goal", async ({ page }) => {
  await page.goto("/block-builder");
  await expect(page.getByText(/Your goal: fill the gap/)).toBeVisible();
  await page.goto("/space-construction");
  await expect(
    page.getByText(/Your goal: add the missing modules/),
  ).toBeVisible();
  await page.goto("/cricket");
  await expect(
    page.getByText(/Your goal: put the practice balls/),
  ).toBeVisible();
  await page.goto("/basketball");
  await expect(page.getByText(/Your goal: put the basketballs/)).toBeVisible();
  await page.goto("/soccer");
  await expect(page.getByText(/Your goal: put the soccer balls/)).toBeVisible();
});

test("reduced motion removes entrance and placement animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/block-builder");
  const name = await page
    .locator("div.scene-enter")
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(name).toBe("none");
});

test("the check's question screen shows progress but no correctness language", async ({
  page,
}) => {
  await page.goto("/assessment");
  await page.getByRole("button", { name: "Start" }).click();
  await expect(
    page.getByRole("heading", { name: "Question 1 of 4" }),
  ).toBeVisible();
  await expect(page.getByText(/correct|wrong|hint|right/i)).toHaveCount(0);
});
