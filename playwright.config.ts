import { defineConfig, devices } from "@playwright/test";

// Override to verify a snapshot on a port nothing else is using (see docs/DEMO-RUNBOOK.md).
const PORT = Number(process.env.PRIMER_E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Serves the production build; run `npm run build` first (test:e2e does this).
  // A server that is already listening is NEVER reused unless PRIMER_E2E_REUSE=1:
  // it could be a stale build of older code. With it busy, Playwright fails
  // loudly ("already used") instead of silently testing the wrong code.
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    // The suite starts more sessions per minute than the production cap (120)
    // allows. Only this test server raises it; production code is unchanged.
    env: { PRIMER_START_LIMIT: "5000" },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: process.env.PRIMER_E2E_REUSE === "1",
    timeout: 60_000,
  },
});
