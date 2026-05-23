import { test, expect } from "@playwright/test";
import { registerAndLogin, uniqueEmail, TEST_PASSWORD } from "./helpers";

/**
 * E2E – Core happy path
 *
 * Covers the primary user workflow from an empty app:
 *  1. Open the app (shows Hebrew UI).
 *  2. Add a member.
 *  3. Add a transaction.
 *  4. Verify the updated balance on the main screen.
 *  5. Open the member detail screen.
 *  6. Verify the transaction appears in transaction history.
 *
 * Also verifies Hebrew UI labels throughout the flow.
 */
test.describe("Core happy path", () => {
  test("full flow: add member, add transaction, verify balance and history", async ({ page }) => {
    const email = uniqueEmail("happy-path");
    await registerAndLogin(page, email, TEST_PASSWORD);

    // ─── Step 1: App loads with Hebrew title ─────────────────────────────────
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Hebrew app title
    await expect(page.getByText("החזרתי?")).toBeVisible();

    // ─── Step 2: Add a member ─────────────────────────────────────────────────
    await page.getByRole("button", { name: "הוספת איש קשר" }).click();

    // Add member form appears with Hebrew labels
    const addMemberForm = page.getByRole("form", { name: "הוספת איש קשר" });
    await expect(addMemberForm).toBeVisible();
    await page.getByLabel("שם").fill("דני");
    await addMemberForm.getByRole("button", { name: "שמירה" }).click();

    // Member appears in the list
    await expect(page.getByRole("heading", { level: 3, name: "דני" })).toBeVisible();

    // ─── Step 3: Add a transaction for that member ────────────────────────────
    // Use the "new transaction" button on the member card to pre-select the member
    await page.getByRole("heading", { level: 3, name: "דני" }).locator("..").locator("..").getByRole("button", { name: "תנועה חדשה" }).click();

    // Transaction form opens with Hebrew labels and member pre-selected
    const txForm = page.getByRole("form", { name: "תנועה חדשה" });
    await expect(txForm).toBeVisible();
    await expect(page.getByLabel("סכום")).toBeVisible();

    // Fill in amount and reason
    await page.getByLabel("סכום").fill("100");
    // Direction: member owes user
    await page.getByLabel("הוא חייב לי").check();
    await page.getByLabel("סיבה").fill("ארוחת צהריים");

    await txForm.getByRole("button", { name: "שמירה" }).click();

    // ─── Step 4: Verify balance on main screen ────────────────────────────────
    // Balance text shows that member owes the user ₪100
    // Use .first() because the balance phrase may appear in both the balance panel and the member card
    await expect(page.getByText(/דני חייב לך/).first()).toBeVisible();

    // Aggregate summary shows the total owed to user
    await expect(page.getByText("סה״כ חייבים לך")).toBeVisible();

    // ─── Step 5: Open member detail screen ────────────────────────────────────
    await page.getByRole("button", { name: "פרטים" }).click();

    // Member name displayed as heading on detail screen
    await expect(page.getByRole("heading", { level: 2, name: "דני" })).toBeVisible();
    // Current balance section shown in Hebrew
    await expect(page.getByText("יתרה נוכחית")).toBeVisible();

    // ─── Step 6: Verify transaction appears in history ────────────────────────
    await expect(page.getByText("היסטוריית תנועות")).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "ארוחת צהריים" })).toBeVisible();
    // Direction is shown in Hebrew (first match covers both balance panel and transaction card)
    await expect(page.getByText(/דני חייב לך/).first()).toBeVisible();
  });

  test("adding another transaction updates the balance on the member detail screen", async ({ page }) => {
    const email = uniqueEmail("happy-path-detail");
    await registerAndLogin(page, email, TEST_PASSWORD);

    // Add a member
    await page.getByRole("button", { name: "הוספת איש קשר" }).click();
    await page.getByLabel("שם").fill("נועה");
    await page.getByRole("form", { name: "הוספת איש קשר" }).getByRole("button", { name: "שמירה" }).click();
    await expect(page.getByRole("heading", { level: 3, name: "נועה" })).toBeVisible();

    // Navigate to member detail
    await page.getByRole("button", { name: "פרטים" }).click();

    // Add transaction from detail screen
    await page.getByRole("button", { name: "תנועה חדשה" }).click();

    const txForm = page.getByRole("form", { name: "תנועה חדשה" });
    await expect(txForm).toBeVisible();

    await page.getByLabel("סכום").fill("50");
    await page.getByLabel("הוא חייב לי").check();
    await page.getByLabel("סיבה").fill("קפה");
    await txForm.getByRole("button", { name: "שמירה" }).click();

    // Balance updates immediately on detail screen
    await expect(page.getByText(/נועה חייב/).first()).toBeVisible();
    // Transaction appears in history
    await expect(page.getByRole("heading", { level: 3, name: "קפה" })).toBeVisible();
  });
});





