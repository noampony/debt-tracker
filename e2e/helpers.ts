import type { Page } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

/**
 * Register a new user and then log in, leaving the page on the main app screen.
 *
 * @param page  - Playwright page object
 * @param email - Unique email for this test session
 * @param password - Password for this test user
 */
export async function registerAndLogin(page: Page, email: string, password: string): Promise<void> {
  await page.goto(BASE_URL);

  // Switch to register mode by clicking the toggle link
  await page.getByRole("button", { name: "אין לך חשבון? הרשמה" }).click();

  // Fill in credentials
  await page.getByLabel("כתובת מייל").fill(email);
  await page.getByLabel("סיסמה").fill(password);

  // Submit the register form (exact match to avoid matching the toggle button)
  await page.getByRole("button", { name: "הרשמה", exact: true }).click();

  // Wait for the main app shell to appear (app title heading)
  await page.waitForSelector("h1");
}

/**
 * Generate a unique email based on the current timestamp and a label suffix,
 * to ensure test isolation when multiple tests register users.
 */
export function uniqueEmail(label: string): string {
  return `e2e-${label}-${Date.now()}@test.local`;
}

/** Standard test password (meets the 8-char minimum). */
export const TEST_PASSWORD = "Test1234!";



