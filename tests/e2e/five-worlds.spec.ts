import { expect, test, type Page } from "@playwright/test";

/**
 * Milestone 2: five playable worlds on one engine. Written independently of
 * src/themes so the test checks what a person actually sees and presses.
 */
const WORLDS = [
  {
    interest: /Cricket/,
    route: "/cricket",
    start: "Start practice",
    item: "Ball",
    done: "Practice can begin!",
  },
  {
    interest: /Building/,
    route: "/block-builder",
    start: "Start building",
    item: "Block",
    done: "The bridge is fixed!",
  },
  {
    interest: /Space/,
    route: "/space-construction",
    start: "Start the mission",
    item: "Module",
    done: "The station is ready!",
  },
  {
    interest: /Basketball/,
    route: "/basketball",
    start: "Start court practice",
    item: "Basketball",
    done: "The court is ready!",
  },
  {
    interest: /Soccer/,
    route: "/soccer",
    start: "Start training",
    item: "Soccer ball",
    done: "Training can start!",
  },
] as const;
type World = (typeof WORLDS)[number];

const RIGHT = [11, 12, 8, 8];
const pick = (page: Page, n: number) =>
  page.getByRole("radio", { name: String(n), exact: true });
const supply = (page: Page, w: World) =>
  page.getByRole("button", { name: new RegExp(`^${w.item} \\d+, in the`) });
const slots = (page: Page, kind: "built" | "empty") =>
  page.locator(`svg[data-scene] [data-slot="${kind}"]`);

async function choose(page: Page, interest: RegExp) {
  await page.getByRole("radio", { name: interest }).check();
  await page.getByRole("button", { name: /adventure preview/i }).click();
}

async function fromWelcome(page: Page, w: World) {
  await page.goto("/");
  await page
    .getByRole("link", { name: /choose what your child loves/ })
    .click();
  await page.getByRole("button", { name: "Choose an interest" }).click();
  await choose(page, w.interest);
  await page.getByRole("link", { name: /^Start the .* mission$/ }).click();
  await expect(page).toHaveURL(new RegExp(`${w.route}$`));
  await page.getByRole("button", { name: w.start }).click();
  await expect(supply(page, w)).toHaveCount(13);
}

async function placeFive(page: Page, w: World) {
  for (let n = 1; n <= 5; n++) {
    await page
      .getByRole("button", { name: new RegExp(`^${w.item} ${n}, in the`) })
      .click();
  }
  // Five placed, eight left to count; the picture mirrors the five.
  await expect(supply(page, w)).toHaveCount(8);
  await expect(slots(page, "built")).toHaveCount(5);
  await expect(slots(page, "empty")).toHaveCount(0);
}

async function submit(page: Page, n: number) {
  await expect(pick(page, n)).toBeEnabled();
  await pick(page, n).check({ force: true });
  await page.getByRole("button", { name: "Check my answer" }).click();
}

/** A wrong try, then the right answer, against the real server. */
async function finish(page: Page, w: World) {
  await submit(page, 9);
  await expect(page.getByText(/Not quite yet/)).toBeVisible();
  await submit(page, 8);
  const done = page.getByRole("heading", { name: w.done });
  await expect(done).toBeVisible();
  await expect(done).toBeFocused();
}

test("Home -> Welcome -> Cricket -> Play -> Finish -> Replay", async ({
  page,
}) => {
  const w = WORLDS[0];
  await fromWelcome(page, w);
  await placeFive(page, w);
  await finish(page, w);
  // Replay: a fresh session with all thirteen back and nothing placed.
  await page.getByRole("button", { name: "Start over" }).click();
  await page.getByRole("button", { name: w.start }).click();
  await expect(supply(page, w)).toHaveCount(13);
  await expect(slots(page, "built")).toHaveCount(0);
  await expect(pick(page, 8)).toBeDisabled();
  await placeFive(page, w);
  await finish(page, w);
});

test("Home -> Welcome -> Basketball -> Play -> Change interest", async ({
  page,
}) => {
  const w = WORLDS[3];
  await fromWelcome(page, w);
  await placeFive(page, w);
  // Leaving midway is allowed from the header; the finish screen has it too.
  await page.getByRole("link", { name: "Choose an interest" }).click();
  await expect(page).toHaveURL(/\/welcome$/);
  await page.getByRole("button", { name: "Choose an interest" }).click();
  await choose(page, /Soccer/);
  await page.getByRole("link", { name: /^Start the .* mission$/ }).click();
  await expect(page).toHaveURL(/\/soccer$/);
  await page.getByRole("button", { name: "Start training" }).click();
  await expect(supply(page, WORLDS[4])).toHaveCount(13);
  await expect(slots(page, "built")).toHaveCount(0);
});

test("Home -> Welcome -> Soccer -> Play -> Assessment -> Summary", async ({
  page,
}) => {
  const w = WORLDS[4];
  await fromWelcome(page, w);
  await placeFive(page, w);
  await finish(page, w);
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
  await expect(
    page.getByRole("heading", { name: "Mastery: not awarded" }),
  ).toBeVisible();
  // Guided practice in a ball world never appears in the independent summary.
  await expect(
    page.getByText(/does not link a practice session/),
  ).toBeVisible();
});

for (const w of WORLDS) {
  test(`${w.route}: five placements unlock the answer, taking one back locks it, the server scores`, async ({
    page,
  }) => {
    await page.goto(w.route);
    await page.getByRole("button", { name: w.start }).click();
    await expect(supply(page, w)).toHaveCount(13);
    await expect(pick(page, 8)).toBeDisabled();
    for (let n = 1; n <= 4; n++) {
      await page
        .getByRole("button", { name: new RegExp(`^${w.item} ${n}, in the`) })
        .click();
    }
    await expect(pick(page, 8)).toBeDisabled();
    await page
      .getByRole("button", { name: new RegExp(`^${w.item} 5, in the`) })
      .click();
    await expect(pick(page, 8)).toBeEnabled();
    // Reversible: return one, and the picture and the count follow.
    await page
      .getByRole("button", { name: new RegExp(`^${w.item} 5, (on|at) the`) })
      .click();
    await expect(slots(page, "built")).toHaveCount(4);
    await expect(pick(page, 8)).toBeDisabled();
    await page
      .getByRole("button", { name: new RegExp(`^${w.item} 5, in the`) })
      .click();
    // The scene never states the remainder before the learner answers.
    // Neither digits nor words state the remainder before the learner answers.
    await expect(page.locator("main")).not.toContainText(
      /\b(8|eight)\b(\s+\w+){0,3}\s+(left|remain|remaining|still)\b|\b(there are|you have|leaves?)\s+(8|eight)\b/i,
    );
    // The only place the answer is decided is the server.
    const scored = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/practice/mission") &&
        (r.request().postData() ?? "").includes('"attempt"'),
    );
    await submit(page, 8);
    const body = await (await scored).text();
    await expect(page.getByRole("heading", { name: w.done })).toBeVisible();
    expect(body).not.toMatch(/expectedAnswer|"answer":\s*8/);
  });
}

test("Surprise me reaches a real mission for every interest (deterministic)", async ({
  page,
}) => {
  const expected = [
    { n: "Cricket", href: "/cricket" },
    { n: "Building", href: "/block-builder" },
    { n: "Space", href: "/space-construction" },
    { n: "Basketball", href: "/basketball" },
    { n: "Soccer", href: "/soccer" },
  ];
  for (const [i, e] of expected.entries()) {
    await page.addInitScript(`Math.random = () => ${(i + 0.5) / 5};`);
    await page.goto("/welcome");
    await page.getByRole("button", { name: "Choose an interest" }).click();
    await page.getByRole("radio", { name: /Surprise me/ }).check();
    await page.getByRole("button", { name: /adventure preview/i }).click();
    await expect(page.getByTestId("surprise-note")).toContainText(e.n);
    const start = page.getByRole("link", { name: /^Start the .* mission$/ });
    await expect(start).toHaveAttribute("href", e.href);
    await start.click();
    await expect(page).toHaveURL(new RegExp(`${e.href}$`));
    await expect(page.getByRole("button", { name: /^Start / })).toBeVisible();
  }
});

test("no primary control is a dead end: every world links back to interests and home", async ({
  page,
}) => {
  for (const w of WORLDS) {
    await page.goto(w.route);
    await expect(
      page.getByRole("link", { name: "Choose an interest" }),
    ).toHaveAttribute("href", "/welcome");
    await expect(
      page.getByRole("link", { name: "Back to Primer home" }),
    ).toHaveAttribute("href", "/");
  }
});

test("a lost session mid-mission in a new world explains itself and offers a fresh start", async ({
  page,
}) => {
  const w = WORLDS[2 + 1]; // basketball
  await page.goto(w.route);
  await page.getByRole("button", { name: w.start }).click();
  await placeFive(page, w);
  await page.route("**/api/practice/mission", (route) =>
    (route.request().postData() ?? "").includes('"attempt"')
      ? route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ ok: false, error: "session-not-found" }),
        })
      : route.continue(),
  );
  await submit(page, 8);
  await expect(page.getByText(/no longer available/)).toBeVisible();
  await expect(page.getByRole("button", { name: w.start })).toBeVisible();
});

/** Waits until nothing is animating, so sizes and states are final, not mid-motion. */
const settled = (page: Page) =>
  page.waitForFunction(() => document.getAnimations().length === 0);

for (const w of WORLDS) {
  test.describe(`${w.route}: countable objects and a guide that reacts`, () => {
    test("thirteen drawn objects, no numerals, five move and stay recognisably the same objects", async ({
      page,
    }) => {
      await page.goto(w.route);
      await page.getByRole("button", { name: w.start }).click();
      await expect(supply(page, w)).toHaveCount(13);
      await settled(page);
      const objects = supply(page, w);
      for (let i = 0; i < 13; i++) {
        const b = objects.nth(i);
        await expect(b.locator("svg.item-art")).toHaveCount(1);
        expect((await b.textContent())?.trim()).toBe("");
      }
      const drawing = await objects.first().locator("svg.item-art").innerHTML();
      await placeFive(page, w);
      await settled(page);
      // Eight left to count, five moved, five empty places left in the tray.
      await expect(page.locator(".tray .item-slot")).toHaveCount(5);
      const moved = page.getByRole("button", {
        name: new RegExp(`^${w.item} \\d+, (on|at) the`),
      });
      await expect(moved).toHaveCount(5);
      for (let i = 0; i < 5; i++) {
        await expect(moved.nth(i).locator(".item-check")).toHaveCount(1);
        expect(await moved.nth(i).locator("svg.item-art").innerHTML()).toBe(
          drawing,
        );
      }
    });

    test("every object is a comfortable touch target at 320px once settled", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(w.route);
      await page.getByRole("button", { name: w.start }).click();
      await expect(supply(page, w)).toHaveCount(13);
      await settled(page);
      await placeFive(page, w);
      await settled(page);
      const sizes = await page.evaluate(() =>
        [...document.querySelectorAll("button.item")].map((b) => {
          const r = b.getBoundingClientRect();
          return Math.min(r.width, r.height);
        }),
      );
      expect(sizes).toHaveLength(13);
      expect(Math.min(...sizes)).toBeGreaterThanOrEqual(44);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
      ).toBeLessThanOrEqual(0);
    });

    test("the guide welcomes, works along, encourages after a wrong answer, and celebrates only a right one", async ({
      page,
    }) => {
      await page.goto(w.route);
      const mood = page.locator(".guide-strip");
      await expect(mood).toHaveAttribute("data-guide-mood", "welcome");
      await page.getByRole("button", { name: w.start }).click();
      await expect(supply(page, w)).toHaveCount(13);
      await expect(mood).toHaveAttribute("data-guide-mood", "welcome");
      await placeFive(page, w);
      await expect(mood).toHaveAttribute("data-guide-mood", "working");
      await submit(page, 9);
      await expect(page.getByText(/Not quite yet/)).toBeVisible();
      await expect(mood).toHaveAttribute("data-guide-mood", "again");
      // No praise after a wrong answer.
      await expect(page.getByTestId("guide-line")).not.toContainText(
        /great|good job|smart|clever|well done|perfect/i,
      );
      await submit(page, 8);
      await expect(page.getByRole("heading", { name: w.done })).toBeVisible();
      await expect(mood).toHaveAttribute("data-guide-mood", "done");
      // The world stays on screen at the end, finished.
      await expect(page.locator(".stage-scene")).toHaveAttribute(
        "data-complete",
        "true",
      );
    });

    test("works from the keyboard alone, and with reduced motion nothing animates", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(w.route);
      await page.getByRole("button", { name: w.start }).click();
      await expect(supply(page, w)).toHaveCount(13);
      // Focus the first object once, then only press keys: focus must follow
      // each moved object on to the next one in the tray.
      await page
        .getByRole("button", { name: new RegExp(`^${w.item} 1, in the`) })
        .focus();
      for (let n = 1; n <= 5; n++) {
        await page.keyboard.press(n % 2 === 0 ? "Space" : "Enter");
      }
      await expect(supply(page, w)).toHaveCount(8);
      await expect(slots(page, "built")).toHaveCount(5);
      expect(await page.evaluate(() => document.getAnimations().length)).toBe(
        0,
      );
      await page.getByRole("radio", { name: "8", exact: true }).focus();
      await page.keyboard.press("Space");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("heading", { name: w.done })).toBeVisible();
    });
  });
}
