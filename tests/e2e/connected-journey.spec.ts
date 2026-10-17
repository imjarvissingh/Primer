import { expect, test, type Page } from "@playwright/test";

/** Independent-check answers in order: 16-5, 19-7, 14-6, 17-9. */
const RIGHT = [11, 12, 8, 8];

const pick = (page: Page, n: number) =>
  page.getByRole("radio", { name: String(n), exact: true });

async function chooseInterest(page: Page, title: RegExp) {
  await page.getByRole("radio", { name: title }).check();
  await page.getByRole("button", { name: /adventure preview/i }).click();
}

/** One wrong try, then the right answer, against the real server. */
async function playMission(page: Page, start: string, item: string) {
  await page.getByRole("button", { name: start }).click();
  for (let n = 1; n <= 5; n++) {
    await page
      .getByRole("button", { name: new RegExp(`^${item} ${n}, `) })
      .click();
  }
  for (const [value, last] of [
    [9, false],
    [8, true],
  ] as const) {
    await expect(pick(page, value)).toBeEnabled();
    await pick(page, value).check({ force: true });
    await page.getByRole("button", { name: "Check my answer" }).click();
    if (!last) await expect(page.getByText(/Not quite yet/)).toBeVisible();
  }
}

for (const [name, width, height] of [
  ["small mobile", 360, 740],
  ["desktop", 1440, 900],
] as const) {
  test(`connected journey on ${name}: home, welcome, Building, Space, check, summary, home`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page
      .getByRole("link", { name: /choose what your child loves/ })
      .click();
    await expect(page).toHaveURL(/\/welcome$/);
    await page.getByRole("button", { name: "Choose an interest" }).click();

    // Building -> real server-backed mission.
    await chooseInterest(page, /Building/);
    await page
      .getByRole("link", { name: "Start the building mission" })
      .click();
    await expect(page).toHaveURL(/\/block-builder$/);
    await playMission(page, "Start building", "Block");
    await expect(
      page.getByRole("heading", { name: "The bridge is fixed!" }),
    ).toBeFocused();

    // Change interest from the finish screen -> Space.
    await page.getByRole("link", { name: "Change interest" }).click();
    await expect(page).toHaveURL(/\/welcome$/);
    await page.getByRole("button", { name: "Choose an interest" }).click();
    await chooseInterest(page, /Space/);
    await page.getByRole("link", { name: "Start the space mission" }).click();
    await expect(page).toHaveURL(/\/space-construction$/);
    await playMission(page, "Start the mission", "Module");
    await expect(
      page.getByRole("heading", { name: "The station is ready!" }),
    ).toBeVisible();

    // Separate independent check -> adult summary.
    await page.getByRole("link", { name: "Independent check" }).click();
    await page.getByRole("button", { name: "Start" }).click();
    for (const [i, v] of RIGHT.entries()) {
      await expect(
        page.getByRole("heading", { name: `Question ${i + 1} of 4` }),
      ).toBeFocused();
      await pick(page, v).check({ force: true });
      await page.getByRole("button", { name: "Save my answer" }).click();
    }
    await page.getByRole("link", { name: /Summary for a grown-up/ }).click();
    await expect(page.getByRole("note")).toContainText(
      "Synthetic demonstration data",
    );
    await expect(page.getByRole("definition")).toHaveText([
      "4",
      "4",
      "4",
      "0",
      "0",
    ]);

    // Reload keeps the short-lived summary; navigation back is never a dead end.
    await page.reload();
    await expect(page.getByRole("note")).toContainText(
      "Synthetic demonstration data",
    );
    await page.getByRole("link", { name: "Choose an interest" }).click();
    await expect(page).toHaveURL(/\/welcome$/);
    await page.getByRole("link", { name: "Back to Primer home" }).click();
    await expect(page).toHaveURL(/\/$/);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("a missing or invalid summary session explains itself and offers a way on", async ({
  page,
}) => {
  for (const url of [
    "/demo-progress",
    "/demo-progress?session=not-a-session",
  ]) {
    await page.goto(url);
    await expect(page.getByRole("main")).toContainText(/check/i);
    await expect(
      page.getByRole("link", { name: /independent check/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Choose an interest" }),
    ).toBeVisible();
    // No results of any kind are shown in place of a missing session.
    await expect(page.getByRole("definition")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /Mastery/ })).toHaveCount(0);
  }
});

test("leaving a mission midway and returning starts clean, with a way back to interests", async ({
  page,
}) => {
  await page.goto("/block-builder");
  await page.getByRole("button", { name: "Start building" }).click();
  await page.getByRole("button", { name: /^Block 1, / }).click();
  await page.getByRole("link", { name: "Choose an interest" }).click();
  await expect(page).toHaveURL(/\/welcome$/);
  await page.goBack();
  await expect(
    page.getByRole("button", { name: "Start building" }),
  ).toBeVisible();
});

test.describe("focus after in-app navigation (issue #29)", () => {
  test("moves to the new page heading after a keyboard link activation, not on a hard load", async ({
    page,
  }) => {
    await page.goto("/");
    // A hard load leaves focus alone: the skip link must still be the first Tab stop.
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(
      "BODY",
    );
    await page
      .getByRole("link", { name: /choose what your child loves/ })
      .focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/welcome$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /what your child loves/i }),
    ).toBeFocused();

    // Same from a mission page, and the next Tab moves on from the heading.
    await page.goto("/block-builder");
    await page.getByRole("link", { name: "Choose an interest" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/welcome$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Choose an interest" }),
    ).toBeFocused();
  });

  test("ordinary updates inside a page do not steal focus", async ({
    page,
  }) => {
    await page.goto("/welcome");
    await page.getByRole("button", { name: "Choose an interest" }).click();
    await page.getByRole("radio", { name: /Building/ }).check();
    await expect(page.getByRole("radio", { name: /Building/ })).toBeFocused();
  });
});
