import { expect, test, type Page } from "@playwright/test";

const ASSESSMENT_API = "/api/assessment";
/** Answers for the four independent items, in order: 16-5, 19-7, 14-6, 17-9. */
const RIGHT = [11, 12, 8, 8];

const pick = (page: Page, n: number) =>
  page.getByRole("radio", { name: String(n), exact: true });

/** Plays one guided mission to completion: a wrong try first, then the right answer. */
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

async function answerCheck(page: Page) {
  for (const [i, v] of RIGHT.entries()) {
    await expect(
      page.getByRole("heading", { name: `Question ${i + 1} of 4` }),
    ).toBeFocused();
    await expect(pick(page, v)).toBeEnabled();
    await pick(page, v).check({ force: true });
    await page.getByRole("button", { name: "Save my answer" }).click();
  }
}

for (const [name, width, height] of [
  ["small mobile", 360, 740],
  ["tablet", 768, 1024],
  ["desktop", 1440, 900],
] as const) {
  test(`recording path on ${name}: home, both worlds, check, adult summary`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.getByRole("link", { name: "Try The Broken Bridge" }).click();
    await playMission(page, "Start building", "Block");
    await expect(
      page.getByRole("heading", { name: "The bridge is fixed!" }),
    ).toBeFocused();

    // Offered from the finish screen; a separate, new practice session.
    await page.getByRole("link", { name: "Space Construction" }).click();
    await playMission(page, "Start the mission", "Module");
    await expect(
      page.getByRole("heading", { name: "The station is ready!" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Independent check" }).click();
    await page.getByRole("button", { name: "Start" }).click();
    await answerCheck(page);
    await expect(page.getByRole("heading", { name: "All done" })).toBeVisible();
    await page.getByRole("link", { name: /Summary for a grown-up/ }).click();

    await expect(page.getByRole("note")).toContainText(
      "Synthetic demonstration data",
    );
    const counts = page.getByRole("definition");
    await expect(counts).toHaveText(["4", "4", "4", "0", "0"]);
    await expect(
      page.getByRole("heading", { name: "Mastery: not awarded" }),
    ).toBeVisible();
    // Practice never appears in the adult summary.
    await expect(
      page.getByText(/does not link a practice session/),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      /mastered|mastery achieved|has mastered|proficient/i,
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("the skip link is the first tab stop and moves focus to main", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("returning to a page through in-app navigation never resumes old state", async ({
  page,
}) => {
  await page.goto("/block-builder");
  await page.getByRole("button", { name: "Start building" }).click();
  await page.getByRole("button", { name: /^Block 1, / }).click();
  await page.getByRole("link", { name: "Back to Primer home" }).click();
  await page.getByRole("link", { name: "Try The Broken Bridge" }).click();
  await expect(
    page.getByRole("button", { name: "Start building" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Fix the bridge" }),
  ).toHaveCount(0);

  await page.getByRole("link", { name: "Back to Primer home" }).click();
  await page.getByRole("link", { name: "Try the independent check" }).click();
  await page.getByRole("button", { name: "Start" }).click();
  await expect(
    page.getByRole("heading", { name: "Question 1 of 4" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to Primer home" }).click();
  await page.getByRole("link", { name: "Try the independent check" }).click();
  await expect(
    page.getByRole("heading", { name: "Try some on your own" }),
  ).toBeVisible();
});

test.describe("failure and recovery", () => {
  test("a lost session mid-check explains itself and offers a clean start", async ({
    page,
  }) => {
    await page.goto("/assessment");
    await page.getByRole("button", { name: "Start" }).click();
    await page.route(`**${ASSESSMENT_API}`, (route) => {
      const body = route.request().postData() ?? "";
      return body.includes('"answer"')
        ? route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ ok: false, error: "session-not-found" }),
          })
        : route.continue();
    });
    await pick(page, 11).check({ force: true });
    await page.getByRole("button", { name: "Save my answer" }).click();
    await expect(page.getByText(/no longer available/)).toBeVisible();
    await page.unroute(`**${ASSESSMENT_API}`);
    await page.getByRole("button", { name: "Start" }).click();
    await expect(
      page.getByRole("heading", { name: "Question 1 of 4" }),
    ).toBeVisible();
  });

  test("a server error or dropped connection keeps the question and allows a retry", async ({
    page,
  }) => {
    await page.goto("/assessment");
    await page.getByRole("button", { name: "Start" }).click();
    const heading = page.getByRole("heading", { name: "Question 1 of 4" });
    await expect(heading).toBeVisible();

    await page.route(`**${ASSESSMENT_API}`, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, error: "server-error" }),
      }),
    );
    await pick(page, 11).check({ force: true });
    await page.getByRole("button", { name: "Save my answer" }).click();
    await expect(page.getByText(/could not reach/)).toBeVisible();
    await expect(heading).toBeVisible();

    await page.unroute(`**${ASSESSMENT_API}`);
    await page.route(`**${ASSESSMENT_API}`, (route) => route.abort());
    await page.getByRole("button", { name: "Save my answer" }).click();
    await expect(page.getByText(/could not reach/)).toBeVisible();

    await page.unroute(`**${ASSESSMENT_API}`);
    await page.getByRole("button", { name: "Save my answer" }).click();
    await expect(
      page.getByRole("heading", { name: "Question 2 of 4" }),
    ).toBeVisible();
  });

  test("refreshing during a check starts over rather than resuming or inventing progress", async ({
    page,
  }) => {
    await page.goto("/assessment");
    await page.getByRole("button", { name: "Start" }).click();
    await pick(page, 11).check({ force: true });
    await page.getByRole("button", { name: "Save my answer" }).click();
    await expect(
      page.getByRole("heading", { name: "Question 2 of 4" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Try some on your own" }),
    ).toBeVisible();
    await expect(page.getByText(/starts over/)).toBeVisible();
  });

  test("Start over mid-check begins a different session", async ({ page }) => {
    await page.goto("/assessment");
    const sessions: string[] = [];
    page.on("response", async (res) => {
      if (!res.url().endsWith(ASSESSMENT_API)) return;
      const body = (await res.json().catch(() => null)) as {
        sessionId?: string;
      } | null;
      if (body?.sessionId) sessions.push(body.sessionId);
    });
    await page.getByRole("button", { name: "Start" }).click();
    await expect(
      page.getByRole("heading", { name: /Question 1/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Start over" }).click();
    await page.getByRole("button", { name: "Start" }).click();
    await expect(
      page.getByRole("heading", { name: /Question 1/ }),
    ).toBeVisible();
    await expect.poll(() => sessions.length).toBe(2);
    expect(sessions[0]).not.toBe(sessions[1]);
  });

  test("a malformed or missing summary id shows recovery, never data", async ({
    page,
  }) => {
    for (const q of ["?session=not-a-session", "?session=", ""]) {
      await page.goto(`/demo-progress${q}`);
      await expect(
        page.getByRole("heading", { name: "No completed check to show" }),
      ).toBeVisible();
      await expect(page.getByRole("table")).toHaveCount(0);
      await expect(
        page.getByRole("link", { name: /independent check/i }),
      ).toBeVisible();
    }
  });

  test("a lost practice session explains why it returned to the start", async ({
    page,
  }) => {
    await page.goto("/block-builder");
    await page.getByRole("button", { name: "Start building" }).click();
    await page.route("**/api/practice/mission", (route) =>
      (route.request().postData() ?? "").includes('"attempt"')
        ? route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ ok: false, error: "session-not-found" }),
          })
        : route.continue(),
    );
    for (let n = 1; n <= 5; n++) {
      await page
        .getByRole("button", { name: new RegExp(`^Block ${n}, `) })
        .click();
    }
    await pick(page, 8).check({ force: true });
    await page.getByRole("button", { name: "Check my answer" }).click();
    await expect(page.getByText(/no longer available/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Start building" }),
    ).toBeVisible();
  });
});

test.describe("summary arithmetic and privacy headers", () => {
  const post = (
    request: import("@playwright/test").APIRequestContext,
    data: unknown,
  ) => request.post(ASSESSMENT_API, { data });

  for (const [label, plan] of [
    ["all answered", ["answer", "answer", "answer", "answer"]],
    ["mixed skip and answer", ["answer", "skip", "answer", "skip"]],
    ["stopped early", ["answer", "stop"]],
    ["stopped immediately", ["stop"]],
  ] as const) {
    test(`total = answered + skipped + not reached, correct <= answered (${label})`, async ({
      request,
    }) => {
      const s = await (await post(request, { action: "start" })).json();
      let seq = s.seq as number;
      for (const action of plan) {
        const body =
          action === "answer"
            ? { action, sessionId: s.sessionId, seq, answer: 11 }
            : { action, sessionId: s.sessionId, seq };
        seq = (await (await post(request, body)).json()).seq;
      }
      const sum = await (
        await post(request, { action: "summary", sessionId: s.sessionId })
      ).json();
      const c = sum.counts;
      expect(c.total).toBe(4);
      expect(c.answered + c.skipped + c.notReached).toBe(c.total);
      expect(c.correct).toBeLessThanOrEqual(c.answered);
      expect(sum.mastery.awarded).toBe(false);
      expect(sum.synthetic).toBe(true);
    });
  }

  test("session responses are never cacheable, and the summary page is private", async ({
    request,
  }) => {
    const res = await post(request, { action: "start" });
    expect(res.headers()["cache-control"]).toBe("no-store");
    const page = await request.get("/demo-progress");
    expect(page.headers()["referrer-policy"]).toBe("no-referrer");
    expect(page.headers()["x-robots-tag"]).toContain("noindex");
    expect(page.headers()["cache-control"]).toContain("no-store");
    expect(page.headers()["x-content-type-options"]).toBe("nosniff");
    expect(await page.text()).toMatch(/noindex/);
  });
});
