import { expect, test } from "@playwright/test";

/**
 * RC1: deployment headers, the liveness probe and the answer grid. The grid is
 * a presentation change only, so these tests also pin that it still offers
 * exactly 0 to 20, in order, with nothing pre-selected or highlighted.
 */
const ROUTES = [
  "/",
  "/welcome",
  "/cricket",
  "/block-builder",
  "/space-construction",
  "/basketball",
  "/soccer",
  "/assessment",
  "/demo-progress",
  "/api/health",
];

for (const route of ROUTES) {
  test(`${route}: hardening headers are present and the page is not indexable`, async ({
    request,
  }) => {
    const res = await request.get(route);
    const h = res.headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-robots-tag"]).toContain("noindex");
    expect(h["permissions-policy"]).toContain("camera=()");
    expect(h["x-powered-by"]).toBeUndefined();
    expect(h["referrer-policy"]).toBeTruthy();
  });
}

test("the practice API reply carries the hardening headers and is no-store", async ({
  request,
}) => {
  const res = await request.post("/api/practice/mission", {
    data: { action: "nonsense" },
  });
  const h = res.headers();
  expect(res.status()).toBe(400);
  expect(h["cache-control"]).toContain("no-store");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
});

test("the summary stays no-store with no-referrer", async ({ request }) => {
  const h = (await request.get("/demo-progress")).headers();
  expect(h["cache-control"]).toContain("no-store");
  expect(h["referrer-policy"]).toBe("no-referrer");
});

test("/api/health answers with no data and is never cached", async ({
  request,
}) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
  expect(res.headers()["cache-control"]).toContain("no-store");
});

for (const [width, height] of [
  [320, 640],
  [390, 844],
  [1024, 768],
] as const) {
  test(`answer grid at ${width}px: 0 to 20 in order, none selected, every target at least 44px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/cricket");
    await page.getByRole("button", { name: "Start practice" }).click();
    await page.getByRole("heading", { level: 2 }).first().waitFor();
    const radios = page.getByRole("radio");
    await expect(radios).toHaveCount(21);
    const labels = await radios.evaluateAll((els) =>
      els.map((e) => (e as HTMLInputElement).value),
    );
    expect(labels).toEqual(Array.from({ length: 21 }, (_, i) => String(i)));
    expect(
      await radios.evaluateAll((els) =>
        els.some((e) => (e as HTMLInputElement).checked),
      ),
    ).toBe(false);
    const boxes = await page.locator(".answer-chip").evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        return [r.width, r.height];
      }),
    );
    for (const [w, h] of boxes) {
      expect(w).toBeGreaterThanOrEqual(44);
      expect(h).toBeGreaterThanOrEqual(44);
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("the warm-up offer says plainly that Not now ends the practice", async ({
  page,
}) => {
  await page.goto("/cricket");
  await page.getByRole("button", { name: "Start practice" }).click();
  await page.getByRole("heading", { level: 2 }).first().waitFor();
  for (let n = 1; n <= 5; n++)
    await page
      .getByRole("button", { name: new RegExp(`^Ball ${n}, in the`) })
      .click();
  for (let i = 0; i < 4; i++) {
    await page
      .getByRole("radio", { name: "9", exact: true })
      .check({ force: true });
    await page.getByRole("button", { name: "Check my answer" }).click();
    await page.waitForTimeout(150);
  }
  await expect(
    page.getByRole("heading", { name: "Want a short warm-up first?" }),
  ).toBeVisible();
  await expect(
    page.getByText(/choose Not now, this practice ends/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(
    page.getByText("Let's try something a little easier next time"),
  ).toBeVisible();
});
