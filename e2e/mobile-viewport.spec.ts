import { test, expect } from "@playwright/test";
import { registerAndLogin, uniqueEmail, TEST_PASSWORD } from "./helpers";

/**
 * E2E – Mobile viewport
 *
 * Verifies that the app is usable on mobile dimensions:
 *  - App loads and shows Hebrew UI at 390 × 844 (iPhone 14 size).
 *  - The main transaction flow is completable.
 *  - No horizontal overflow is detected on the main screen.
 */
test.describe("Mobile viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("app loads and displays Hebrew UI on a mobile viewport", async ({ page }) => {
    const email = uniqueEmail("mobile-load");
    await registerAndLogin(page, email, TEST_PASSWORD);

    // Hebrew app title visible
    await expect(page.getByText("החזרתי?")).toBeVisible();

    // Primary action button is visible and tappable
    await expect(page.getByRole("button", { name: "תנועה חדשה" }).first()).toBeVisible();

    // No horizontal scrollbar – document scroll width should equal viewport width
    const overflows = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflows).toBe(false);
  });

  test("complete transaction flow is usable on mobile viewport with Hebrew UI", async ({ page }) => {
    const email = uniqueEmail("mobile-flow");
    await registerAndLogin(page, email, TEST_PASSWORD);

    // Add member via Hebrew form
    await page.getByRole("button", { name: "הוספת איש קשר" }).click();
    const addMemberForm = page.getByRole("form", { name: "הוספת איש קשר" });
    await expect(addMemberForm).toBeVisible();
    await page.getByLabel("שם").fill("עמית");
    await addMemberForm.getByRole("button", { name: "שמירה" }).click();
    await expect(page.getByRole("heading", { level: 3, name: "עמית" })).toBeVisible();

    // Add transaction via Hebrew form
    await page.getByRole("button", { name: "תנועה חדשה" }).first().click();
    const txForm = page.getByRole("form", { name: "תנועה חדשה" });
    await expect(txForm).toBeVisible();

    // Amount field should use a numeric input mode (mobile keyboard)
    const amountInput = page.getByLabel("סכום");
    await expect(amountInput).toHaveAttribute("inputmode", "decimal");

    // Select the member (not pre-selected when opening from main screen button)
    await page.getByLabel("איש קשר").selectOption({ label: "עמית" });
    await amountInput.fill("30");
    await page.getByLabel("הוא חייב לי").check();
    await page.getByLabel("סיבה").fill("ארוחת ערב");
    await txForm.getByRole("button", { name: "שמירה" }).click();

    // Balance updated with Hebrew text
    await expect(page.getByText(/עמית חייב/).first()).toBeVisible();

    // No horizontal overflow after interaction
    const overflowsAfter = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflowsAfter).toBe(false);
  });
});


