import { test, expect } from "@playwright/test";
import { registerAndLogin, uniqueEmail, TEST_PASSWORD } from "./helpers";

/**
 * E2E – Reset flow
 *
 * Verifies safe debt reset behavior:
 *  1. Reset button is disabled (and shows Hebrew label) when balance is zero.
 *  2. Reset requires confirmation – cancel does not change balance.
 *  3. Confirm resets debt to zero and reset adjustment is visible in history.
 */
test.describe("Reset flow", () => {
  test("reset button is disabled when balance is already zero", async ({ page }) => {
    const email = uniqueEmail("reset-zero");
    await registerAndLogin(page, email, TEST_PASSWORD);

    // Add member (no transactions → zero balance)
    await page.getByRole("button", { name: "הוספת איש קשר" }).click();
    await page.getByLabel("שם").fill("אפס");
    await page.getByRole("form", { name: "הוספת איש קשר" }).getByRole("button", { name: "שמירה" }).click();
    await expect(page.getByRole("heading", { level: 3, name: "אפס" })).toBeVisible();

    // Navigate to detail screen
    await page.getByRole("button", { name: "פרטים" }).click();

    // Reset button should be disabled and show a Hebrew helper message
    const resetButton = page.getByRole("button", { name: "איפוס חוב" });
    await expect(resetButton).toBeDisabled();
    await expect(page.getByText("אין חוב פתוח לאיפוס.")).toBeVisible();
  });

  test("reset requires confirmation – cancel does not change balance", async ({ page }) => {
    const email = uniqueEmail("reset-cancel");
    await registerAndLogin(page, email, TEST_PASSWORD);

    // Set up member with ₪75 balance (member owes user)
    await page.getByRole("button", { name: "הוספת איש קשר" }).click();
    await page.getByLabel("שם").fill("דני");
    await page.getByRole("form", { name: "הוספת איש קשר" }).getByRole("button", { name: "שמירה" }).click();
    await expect(page.getByRole("heading", { level: 3, name: "דני" })).toBeVisible();
    await page.getByRole("button", { name: "פרטים" }).click();
    await page.getByRole("button", { name: "תנועה חדשה" }).click();
    await page.getByLabel("סכום").fill("75");
    await page.getByLabel("הוא חייב לי").check();
    await page.getByLabel("סיבה").fill("ארוחה");
    await page.getByRole("form", { name: "תנועה חדשה" }).getByRole("button", { name: "שמירה" }).click();

    // Click the reset button – confirmation dialog must open
    const resetButton = page.getByRole("button", { name: "איפוס חוב" });
    await expect(resetButton).toBeEnabled();
    await resetButton.click();

    // Dialog appears with Hebrew title and confirmation body
    const dialog = page.getByRole("dialog", { name: "איפוס חוב" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/תאפס את החוב מול דני/)).toBeVisible();

    // Cancel should close dialog without changing balance
    await dialog.getByRole("button", { name: "ביטול" }).click();

    // Dialog gone, balance unchanged
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByText(/דני חייב לך/).first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "ארוחה" })).toBeVisible();
    // No reset transaction should have appeared
    await expect(page.getByRole("heading", { level: 3, name: "איפוס חוב" })).not.toBeVisible();
  });

  test("confirm reset zeros balance and preserves history", async ({ page }) => {
    const email = uniqueEmail("reset-confirm");
    await registerAndLogin(page, email, TEST_PASSWORD);

    // Set up member with ₪75 balance (member owes user)
    await page.getByRole("button", { name: "הוספת איש קשר" }).click();
    await page.getByLabel("שם").fill("דני");
    await page.getByRole("form", { name: "הוספת איש קשר" }).getByRole("button", { name: "שמירה" }).click();
    await expect(page.getByRole("heading", { level: 3, name: "דני" })).toBeVisible();
    await page.getByRole("button", { name: "פרטים" }).click();
    await page.getByRole("button", { name: "תנועה חדשה" }).click();
    await page.getByLabel("סכום").fill("75");
    await page.getByLabel("הוא חייב לי").check();
    await page.getByLabel("סיבה").fill("ארוחה");
    await page.getByRole("form", { name: "תנועה חדשה" }).getByRole("button", { name: "שמירה" }).click();

    // Confirm dialog is present with non-zero balance
    await expect(page.getByText(/דני חייב לך/).first()).toBeVisible();

    // Click reset and confirm
    await page.getByRole("button", { name: "איפוס חוב" }).click();
    const dialog = page.getByRole("dialog", { name: "איפוס חוב" });
    await expect(dialog).toBeVisible();
    // Use the explicit confirm button label
    await dialog.getByRole("button", { name: "אישור איפוס" }).click();

    // Dialog closes
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Balance is now zero – Hebrew zero-balance message
    await expect(page.getByText("אין חוב פתוח מול דני")).toBeVisible();

    // Original transaction is still in history (history preserved)
    await expect(page.getByRole("heading", { level: 3, name: "ארוחה" })).toBeVisible();

    // Reset adjustment transaction appears in history with Hebrew title
    await expect(page.getByRole("heading", { level: 3, name: "איפוס חוב" })).toBeVisible();
  });
});




