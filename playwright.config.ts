import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration.
 *
 * Uses a separate E2E SQLite database (prisma/e2e.db) so that E2E tests
 * do not touch the development or unit-test databases.
 *
 * Two web servers are started:
 *  1. The Express backend on port 3001 (with the E2E database).
 *  2. The Vite frontend dev server on port 5173 (proxies /api → 3001).
 *
 * Each test file registers a throw-away user so tests are data-isolated.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // sequential to avoid SQLite write conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    video: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  globalSetup: "./e2e/global-setup.ts",

  webServer: [
    {
      // Backend: Express + Prisma against the E2E database.
      // Environment variables are passed inline so subshells inherit them correctly.
      command:
        "DATABASE_URL=file:./prisma/e2e.db JWT_SECRET=e2e-test-jwt-secret PORT=3001 NODE_ENV=test npx tsx server/index.ts",
      url: "http://localhost:3001/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // Frontend: Vite dev server (proxies /api to port 3001)
      command: "npx vite",
      url: "http://localhost:5173/",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});




