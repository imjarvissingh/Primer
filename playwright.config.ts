import { defineConfig, devices } from "@playwright/test";

// Override to verify a snapshot on a port nothing else is using (see docs/DEMO-RUNBOOK.md).
const PORT = Number(process.env.PRIMER_E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  // One worker on purpose. The server caps session starts at 120 per minute per
  // process and the suite starts many sessions; with 2-3 workers bursts exceed
  // the cap and tests fail with "Lots of people are trying this right now".
  // The production cap is NOT configurable and must not be raised for tests
  // (see docs/DECISIONS.md, issue #30). If the suite outgrows one worker, shard
  // it across separate server processes instead.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Optional, local only: PRIMER_E2E_CROSS_BROWSER=1 adds Firefox and WebKit for
    // the Cricket specs (the draft lab's layout, focus and motion). CI runs Chromium only.
    ...(process.env.PRIMER_E2E_CROSS_BROWSER === "1"
      ? [
          {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
            testMatch: /cricket-(academy|lab-interaction)\.spec\.ts/,
          },
          {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
            testMatch: /cricket-(academy|lab-interaction)\.spec\.ts/,
          },
        ]
      : []),
  ],
  // Serves the production build; run `npm run build` first (test:e2e does this).
  // A server that is already listening is NEVER reused unless PRIMER_E2E_REUSE=1:
  // it could be a stale build of older code. With it busy, Playwright fails
  // loudly ("already used") instead of silently testing the wrong code.
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: process.env.PRIMER_E2E_REUSE === "1",
    timeout: 60_000,
  },
});
