import { expect, test, type Locator, type Page } from "@playwright/test";
import { FORBIDDEN } from "./helpers";

const API = "/api/assessment";
/** Answers for the four independent items, in order: 16-5, 19-7, 14-6, 17-9. */
const RIGHT = [11, 12, 8, 8];

const pick = (page: Page, n: number) =>
  page.getByRole("radio", { name: String(n), exact: true });
const save = (page: Page) =>
  page.getByRole("button", { name: "Save my answer" });
const heading = (page: Page, n: number) =>
  page.getByRole("heading", { name: `Question ${n} of 4` });

async function startCheck(page: Page) {
  await page.goto("/assessment");
  await page.getByRole("button", { name: "Start" }).click();
  await expect(heading(page, 1)).toBeVisible();
}
/** Answers the current question and waits for the next heading (or the end). */
async function answer(page: Page, n: number) {
  await expect(pick(page, n)).toBeEnabled();
  await pick(page, n).check({ force: true });
  await expect(save(page)).toHaveAttribute("aria-disabled", "false");
  await save(page).click();
}
async function tabTo(page: Page, target: Locator) {
  for (let i = 0; i < 80; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("Could not reach the target with Tab");
}
const NO_FEEDBACK =
  /correct|incorrect|wrong|well done|great job|not quite|try again|hint/i;

test("full check: four questions, no feedback, then the adult summary matches the server", async ({
  page,
}) => {
  const bodies: string[] = [];
  page.on("response", async (res) => {
    if (
      res.url().includes(API) ||
      /text\/html|javascript/.test(res.headers()["content-type"] ?? "")
    ) {
      bodies.push(`${res.url()}\n${await res.text().catch(() => "")}`);
    }
  });
  await startCheck(page);
  // One question at a time.
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(1);
  await expect(
    page.getByText("Start with 16. Take away 5. How many are left?"),
  ).toBeVisible();

  const answers = [11, 3, 8, 0]; // right, wrong, right, wrong
  for (const [i, value] of answers.entries()) {
    await expect(heading(page, i + 1)).toBeVisible();
    await expect(heading(page, i + 1)).toBeFocused();
    await answer(page, value);
    if (i < 3) {
      await expect(heading(page, i + 2)).toBeVisible();
      await expect(page.getByText("Your answer is saved.")).toBeVisible();
      // Nothing about correctness, from either a right or a wrong answer.
      await expect(page.locator("main")).not.toContainText(NO_FEEDBACK);
    }
  }
  await expect(page.getByRole("heading", { name: "All done" })).toBeVisible();
  await expect(page.locator("main")).not.toContainText(NO_FEEDBACK);

  await page.getByRole("link", { name: /Summary for a grown-up/ }).click();
  await expect(page).toHaveURL(/\/demo-progress\?session=/);
  await expect(page.getByRole("note")).toContainText(
    "Synthetic demonstration data",
  );
  const count = (label: string) =>
    page
      .getByText(label, { exact: true })
      .locator("xpath=following-sibling::dd[1]");
  await expect(count("Questions in the check")).toHaveText("4");
  await expect(count("Answered independently")).toHaveText("4");
  await expect(count("Correct in this short check")).toHaveText("2");
  await expect(count("Skipped")).toHaveText("0");
  const rows = page.getByRole("table").getByRole("row");
  await expect(rows).toHaveCount(5);
  await expect(rows.nth(1)).toContainText("16 − 5");
  await expect(rows.nth(1)).toContainText("Correct");
  await expect(rows.nth(2)).toContainText("Not correct this time");
  await expect(
    page.getByRole("heading", { name: "Mastery: not awarded" }),
  ).toBeVisible();
  await expect(page.getByText(/Needs more evidence/).first()).toBeVisible();
  await expect(page.locator("main:visible")).not.toContainText(
    /mastered|proficient/i,
  );

  // Nothing the browser ever received contains answer keys or bank internals.
  expect(bodies.length).toBeGreaterThan(5);
  for (const body of bodies) {
    for (const token of FORBIDDEN) {
      expect(body.includes(token), `"${token}" in ${body.slice(0, 60)}`).toBe(
        false,
      );
    }
  }
});

test("a perfect score still awards no mastery", async ({ page }) => {
  await startCheck(page);
  for (const [i, v] of RIGHT.entries()) {
    await answer(page, v);
    if (i < 3) await expect(heading(page, i + 2)).toBeVisible();
  }
  await page.getByRole("link", { name: /Summary for a grown-up/ }).click();
  await expect(
    page
      .getByText("Correct in this short check", { exact: true })
      .locator("xpath=following-sibling::dd[1]"),
  ).toHaveText("4");
  await expect(
    page.getByRole("heading", { name: "Mastery: not awarded" }),
  ).toBeVisible();
  await expect(page.locator("main:visible")).not.toContainText(/mastered/i);
});

test("skip and stop are reflected honestly in the summary", async ({
  page,
}) => {
  await startCheck(page);
  await page.getByRole("button", { name: "Skip this question" }).click();
  await expect(heading(page, 2)).toBeVisible();
  await answer(page, 12);
  await expect(heading(page, 3)).toBeVisible();
  await page.getByRole("button", { name: "Stop for now" }).click();
  await expect(
    page.getByRole("heading", { name: "Stopped for now" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Summary for a grown-up/ }).click();
  const rows = page.getByRole("table").getByRole("row");
  await expect(rows.nth(1)).toContainText("Skipped");
  await expect(rows.nth(2)).toContainText("Correct");
  await expect(rows.nth(3)).toContainText("Not reached");
  await expect(rows.nth(4)).toContainText("Not reached");
  await expect(
    page
      .getByText("Skipped", { exact: true })
      .locator("xpath=following-sibling::dd[1]"),
  ).toHaveText("1");
});

test("keyboard-only journey from start to the summary", async ({ page }) => {
  await page.goto("/assessment");
  await tabTo(page, page.getByRole("button", { name: "Start" }));
  await page.keyboard.press("Enter");
  for (const [i, v] of RIGHT.entries()) {
    await expect(heading(page, i + 1)).toBeFocused();
    await tabTo(page, pick(page, 0));
    for (let k = 0; k < v; k++) await page.keyboard.press("ArrowRight");
    await expect(pick(page, v)).toBeChecked();
    await tabTo(page, save(page));
    await page.keyboard.press("Enter");
  }
  await expect(page.getByRole("heading", { name: "All done" })).toBeFocused();
  await tabTo(page, page.getByRole("link", { name: /Summary for a grown-up/ }));
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Mastery: not awarded" }),
  ).toBeVisible();
});

for (const [name, width, height] of [
  // 320px is the WCAG 1.4.10 reflow width (Phase 8D audit: the summary overflowed here).
  ["very small mobile", 320, 640],
  ["small mobile", 360, 740],
  ["tablet", 768, 1024],
  ["desktop", 1440, 900],
] as const) {
  test(`no horizontal overflow and big touch targets on ${name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    const overflow = () =>
      page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
    await page.goto("/assessment");
    expect(await overflow()).toBeLessThanOrEqual(0);
    await page.getByRole("button", { name: "Start" }).click();
    await expect(heading(page, 1)).toBeVisible();
    expect(await overflow()).toBeLessThanOrEqual(0);
    for (const t of [
      save(page),
      page.getByRole("button", { name: "Skip this question" }),
      pick(page, 3).locator("xpath=.."),
    ]) {
      const box = await t.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
    for (const [i, v] of RIGHT.entries()) {
      await answer(page, v);
      if (i < 3) await expect(heading(page, i + 2)).toBeVisible();
    }
    await page.getByRole("link", { name: /Summary for a grown-up/ }).click();
    await expect(page.getByRole("table")).toBeVisible();
    expect(await overflow()).toBeLessThanOrEqual(0);
  });
}

test("a double-click on Save my answer sends one answer", async ({ page }) => {
  await startCheck(page);
  const sent: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(API) && (r.postData() ?? "").includes('"answer"'))
      sent.push(r.postData() ?? "");
  });
  await pick(page, 11).check({ force: true });
  await save(page).dblclick();
  await expect(heading(page, 2)).toBeVisible();
  expect(sent).toHaveLength(1);
});

test("the summary page shows no data without a session, and never sample data", async ({
  page,
}) => {
  await page.goto("/demo-progress");
  await expect(
    page.getByRole("heading", { name: "No completed check to show" }),
  ).toBeVisible();
  await expect(page.getByRole("note")).toContainText(
    "Synthetic demonstration data",
  );
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByText("Questions in the check")).toHaveCount(0);
});

test("the summary refuses an unfinished or unknown session", async ({
  page,
  request,
}) => {
  const s = await (
    await request.post(API, { data: { action: "start" } })
  ).json();
  await page.goto(`/demo-progress?session=${s.sessionId}`);
  await expect(page.getByText(/not finished yet/)).toBeVisible();
  await page.goto(
    "/demo-progress?session=123e4567-e89b-42d3-a456-426614174000",
  );
  await expect(page.getByText(/may have expired/)).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});

test("the API enforces one scored answer, sequence checks and bounded input", async ({
  request,
}) => {
  const post = (data: unknown) => request.post(API, { data });
  const s = await (await post({ action: "start" })).json();
  const id = s.sessionId as string;
  expect(Object.keys(s).sort()).toEqual(["ok", "question", "seq", "sessionId"]);
  expect(Object.keys(s.question).sort()).toEqual([
    "maxAnswer",
    "position",
    "start",
    "takeAway",
    "total",
  ]);

  // Nothing can pick items, banks, scores or hints.
  for (const extra of [
    { itemId: "IN-01" },
    { bank: "delayed" },
    { phase: "baseline" },
    { hint: 1 },
  ]) {
    expect((await post({ action: "start", ...extra })).status()).toBe(400);
  }
  expect(
    (
      await post({
        action: "answer",
        sessionId: id,
        seq: 0,
        answer: 11,
        correct: true,
      })
    ).status(),
  ).toBe(400);
  expect((await post({ action: "summary", sessionId: id })).status()).toBe(409); // not finished
  expect((await post({ action: "summary", sessionId: "nope" })).status()).toBe(
    400,
  );
  expect(
    (
      await post({
        action: "summary",
        sessionId: "123e4567-e89b-42d3-a456-426614174000",
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await request.post(API, {
        headers: { "content-type": "application/json" },
        data: "x".repeat(4000),
      })
    ).status(),
  ).toBe(413);

  // Unreadable answer is not scored and asks again on the same question.
  const bad = await (
    await post({ action: "answer", sessionId: id, seq: 0, answer: "11" })
  ).json();
  expect(bad).toMatchObject({ ack: "ask-again", status: "in-progress" });
  expect(bad.question.position).toBe(1);

  // Right and wrong answers get the same reply shape; a replay is stale.
  const first = await post({
    action: "answer",
    sessionId: id,
    seq: 1,
    answer: 11,
  });
  const firstBody = await first.json();
  expect(Object.keys(firstBody).sort()).toEqual([
    "ack",
    "ok",
    "question",
    "seq",
    "status",
  ]);
  expect(firstBody.ack).toBe("recorded");
  expect(
    (
      await post({ action: "answer", sessionId: id, seq: 1, answer: 3 })
    ).status(),
  ).toBe(409);

  const t = await (await post({ action: "start" })).json();
  const wrong = await (
    await post({ action: "answer", sessionId: t.sessionId, seq: 0, answer: 3 })
  ).json();
  expect(wrong).toEqual({ ...firstBody, seq: wrong.seq });

  // Finish the first session; further events are refused and the summary is complete.
  let seq = firstBody.seq as number;
  for (const v of [12, 8, 8]) {
    const r = await (
      await post({ action: "answer", sessionId: id, seq, answer: v })
    ).json();
    seq = r.seq;
  }
  expect(
    (await post({ action: "answer", sessionId: id, seq, answer: 1 })).status(),
  ).toBe(409);
  const sum = await (await post({ action: "summary", sessionId: id })).json();
  expect(sum.counts).toEqual({
    total: 4,
    answered: 4,
    correct: 4,
    skipped: 0,
    notReached: 0,
  });
  expect(sum.mastery).toEqual({
    awarded: false,
    state: "emerging",
    policy: "draft-unapproved",
  });
  expect(JSON.stringify(sum)).not.toMatch(/IN-0|expectedAnswer|"answer"/);
});

test("the independent check has no ten-frames, warm-up or support, and the API refuses them", async ({
  page,
  request,
}) => {
  await startCheck(page);
  await answer(page, 0);
  await expect(heading(page, 2)).toBeVisible();
  await expect(page.locator("[data-cell], figure.ten-frames")).toHaveCount(0);
  await expect(page.getByText(/warm-up|ten-frame|take these/i)).toHaveCount(0);

  const res = await request.post(API, {
    data: {
      action: "support",
      sessionId: "123e4567-e89b-42d3-a456-426614174000",
      seq: 0,
      choice: "start",
    },
  });
  expect(res.status()).toBe(400);
});
