import { expect, test, type Page, type Locator } from "@playwright/test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const API = "/api/practice/bridge";
const pileBlock = (page: Page, n: number) =>
  page.getByRole("button", { name: new RegExp(`^Block ${n}, in the pile`) });
const pick = (page: Page, n: number) =>
  page.getByRole("radio", { name: String(n), exact: true });
const check = (page: Page) =>
  page.getByRole("button", { name: "Check my answer" });

async function startMission(page: Page) {
  await page.goto("/block-builder");
  await page.getByRole("button", { name: "Start building" }).click();
  await expect(
    page.getByRole("heading", { name: "Fix the bridge" }),
  ).toBeVisible();
}
async function answer(page: Page, n: number) {
  // Wait out any in-flight request: controls are inert until the server replies.
  await expect(pick(page, n)).toBeEnabled();
  await pick(page, n).check({ force: true });
  await expect(check(page)).toHaveAttribute("aria-disabled", "false");
  await check(page).click();
}

test("full mission: blocks, wrong answer, hints, correct answer, completion, restart", async ({
  page,
}) => {
  await startMission(page);
  await expect(page.getByText(/The builder has 13 blocks/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Block \d+, in the pile/ }),
  ).toHaveCount(13);

  for (let n = 1; n <= 5; n++) await pileBlock(page, n).click();
  await expect(page.getByText("Blocks on the bridge: 5")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Block \d+, in the pile/ }),
  ).toHaveCount(8);
  // Un-tap one and tap it again.
  await page.getByRole("button", { name: /^Block 5, on the bridge/ }).click();
  await expect(page.getByText("Blocks on the bridge: 4")).toBeVisible();
  await pileBlock(page, 5).click();

  await answer(page, 9);
  await expect(page.getByText(/Not quite yet/)).toBeVisible();
  await answer(page, 9);
  await expect(page.getByText("Hint 1", { exact: true })).toBeVisible();
  await expect(page.getByText(/Draft demo hint/)).toBeVisible();
  await answer(page, 7);
  await expect(page.getByText("Hint 2", { exact: true })).toBeVisible();
  await answer(page, 8);

  const done = page.getByRole("heading", { name: "The bridge is fixed!" });
  await expect(done).toBeVisible();
  await expect(done).toBeFocused();
  await expect(page.getByText(/does not measure mastery/)).toBeVisible();

  await page.getByRole("button", { name: "Start over" }).click();
  await expect(
    page.getByRole("heading", { name: "The Broken Bridge" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start building" }).click();
  await expect(
    page.getByRole("button", { name: /^Block \d+, in the pile/ }),
  ).toHaveCount(13);
});

test("repeated wrong answers reach a calm stop, not a failure", async ({
  page,
}) => {
  await startMission(page);
  for (let i = 0; i < 4; i++) await answer(page, 3);
  await expect(
    page.getByRole("heading", { name: /a little easier/i }),
  ).toBeVisible();
  await expect(page.getByText(/fail|wrong/i)).toHaveCount(0);
});

test("stop for now ends the mission and can be restarted", async ({ page }) => {
  await startMission(page);
  await page.getByRole("button", { name: "Stop for now" }).click();
  await expect(
    page.getByRole("heading", { name: "Taking a break" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start over" }).click();
  await expect(
    page.getByRole("button", { name: "Start building" }),
  ).toBeVisible();
});

async function tabTo(page: Page, target: Locator) {
  for (let i = 0; i < 80; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("Could not reach the target with Tab");
}

test("keyboard-only journey from start to completion", async ({ page }) => {
  await page.goto("/block-builder");
  await tabTo(page, page.getByRole("button", { name: "Start building" }));
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Fix the bridge" }),
  ).toBeVisible();

  // Tapping a block with Space, then Enter, from the keyboard alone.
  await tabTo(page, pileBlock(page, 1));
  await page.keyboard.press("Space");
  await expect(page.getByText("Blocks on the bridge: 1")).toBeVisible();

  await tabTo(page, pick(page, 0));
  for (let i = 0; i < 8; i++) await page.keyboard.press("ArrowRight");
  await expect(pick(page, 8)).toBeChecked();
  await tabTo(page, check(page));
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "The bridge is fixed!" }),
  ).toBeFocused();
  await tabTo(page, page.getByRole("button", { name: "Start over" }));
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "The Broken Bridge" }),
  ).toBeVisible();
});

for (const [name, width, height] of [
  ["mobile", 360, 740],
  ["tablet", 768, 1024],
] as const) {
  test(`no horizontal overflow and big touch targets on ${name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    const overflow = () =>
      page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
    await page.goto("/block-builder");
    expect(await overflow()).toBeLessThanOrEqual(0);
    await page.getByRole("button", { name: "Start building" }).click();
    await expect(
      page.getByRole("heading", { name: "Fix the bridge" }),
    ).toBeVisible();
    for (let n = 1; n <= 5; n++) await pileBlock(page, n).click();
    await answer(page, 9);
    await expect(
      page.getByText("Not quite yet", { exact: false }),
    ).toBeVisible();
    expect(await overflow()).toBeLessThanOrEqual(0);

    for (const target of [
      pileBlock(page, 6),
      check(page),
      page.getByRole("button", { name: "Stop for now" }),
    ]) {
      const box = await target.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
    await answer(page, 8);
    await expect(
      page.getByRole("heading", { name: "The bridge is fixed!" }),
    ).toBeVisible();
    expect(await overflow()).toBeLessThanOrEqual(0);
  });
}

test("a double-click on Check my answer sends one attempt", async ({
  page,
}) => {
  await startMission(page);
  const attempts: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(API) && r.method() === "POST") {
      const body = r.postData() ?? "";
      if (body.includes('"attempt"')) attempts.push(body);
    }
  });
  await pick(page, 9).check({ force: true });
  await check(page).dblclick();
  await expect(page.getByText(/Not quite yet/)).toBeVisible();
  expect(attempts).toHaveLength(1);
});

// ---- Answer isolation and API behaviour -----------------------------------

const FORBIDDEN = [
  "expectedAnswer",
  "eligibleBank",
  "reviewStatus",
  "curriculumVersion",
  "contentVersion",
  "subtract-cross-ten",
  "subtract-take-away",
  "GUIDED_PRACTICE",
  "GP-0",
  "BL-0",
  "IN-0",
  "DL-0",
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const f = path.join(dir, n);
    return statSync(f).isDirectory() ? walk(f) : [f];
  });
}

test("browser-visible payloads contain no answer keys or bank content", async ({
  page,
}) => {
  const bodies: string[] = [];
  page.on("response", async (res) => {
    const type = res.headers()["content-type"] ?? "";
    if (/json|html|javascript|text/.test(type)) {
      bodies.push(`${res.url()}\n${await res.text().catch(() => "")}`);
    }
  });
  await startMission(page);
  for (let i = 0; i < 4; i++) await answer(page, i === 3 ? 8 : 3);
  await expect(
    page.getByRole("heading", { name: "The bridge is fixed!" }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");

  expect(bodies.length).toBeGreaterThan(3);
  for (const body of bodies) {
    for (const token of FORBIDDEN) {
      expect(
        body.includes(token),
        `"${token}" found in ${body.slice(0, 80)}`,
      ).toBe(false);
    }
  }
  // Static client bundles on disk (what any browser can download).
  const staticDir = path.resolve(".next/static");
  const chunks = walk(staticDir).filter((f) => f.endsWith(".js"));
  expect(chunks.length).toBeGreaterThan(0);
  for (const file of chunks) {
    const text = readFileSync(file, "utf8");
    for (const token of FORBIDDEN) {
      expect(
        text.includes(token),
        `"${token}" in ${path.relative(".", file)}`,
      ).toBe(false);
    }
  }
});

test("API responses expose only whitelisted fields", async ({ request }) => {
  const start = await request.post(API, {
    data: { action: "start", missionId: "broken-bridge" },
  });
  const s = await start.json();
  expect(Object.keys(s).sort()).toEqual([
    "challenge",
    "ok",
    "seq",
    "sessionId",
  ]);
  expect(Object.keys(s.challenge).sort()).toEqual([
    "maxAnswer",
    "missionId",
    "start",
    "takeAway",
  ]);
  const wrong = await request.post(API, {
    data: { action: "attempt", sessionId: s.sessionId, seq: 0, answer: 1 },
  });
  expect(Object.keys(await wrong.json()).sort()).toEqual([
    "feedback",
    "ok",
    "seq",
    "sessionStatus",
  ]);
});

test("invalid, duplicate and out-of-order requests are handled safely", async ({
  request,
}) => {
  const post = (data: unknown) => request.post(API, { data });
  const s = await (
    await post({ action: "start", missionId: "broken-bridge" })
  ).json();
  const id = s.sessionId as string;

  // Reserved assessment items cannot be requested, by name or as extra fields.
  expect((await post({ action: "start", missionId: "IN-01" })).status()).toBe(
    400,
  );
  expect(
    (
      await post({
        action: "start",
        missionId: "broken-bridge",
        itemId: "DL-01",
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await post({
        action: "attempt",
        sessionId: id,
        seq: 0,
        answer: 8,
        expectedAnswer: 1,
      })
    ).status(),
  ).toBe(400);
  // Oversized and malformed bodies.
  expect(
    (
      await request.post(API, {
        headers: { "content-type": "application/json" },
        data: "x".repeat(4000),
      })
    ).status(),
  ).toBe(413);
  expect(
    (
      await request.post(API, {
        headers: { "content-type": "application/json" },
        data: "{nope",
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await post({
        action: "attempt",
        sessionId: "not-a-uuid",
        seq: 0,
        answer: 8,
      })
    ).status(),
  ).toBe(400);
  // Unknown (e.g. expired or after restart) session.
  const ghost = await post({
    action: "skip",
    sessionId: "123e4567-e89b-42d3-a456-426614174000",
    seq: 0,
  });
  expect(ghost.status()).toBe(404);

  // A string "8" is never scored as correct.
  const bad = await (
    await post({ action: "attempt", sessionId: id, seq: 0, answer: "8" })
  ).json();
  expect(bad.feedback).toEqual({ kind: "ask-again" });
  expect(bad.sessionStatus).toBe("open");
  // Replaying seq 0 is stale.
  expect(
    (
      await post({ action: "attempt", sessionId: id, seq: 0, answer: 8 })
    ).status(),
  ).toBe(409);
  // The correct answer at the right seq finishes it; a repeat is refused.
  const ok = await (
    await post({ action: "attempt", sessionId: id, seq: 1, answer: 8 })
  ).json();
  expect(ok.feedback).toEqual({ kind: "correct" });
  expect(
    (
      await post({ action: "attempt", sessionId: id, seq: 2, answer: 8 })
    ).status(),
  ).toBe(409);
});
