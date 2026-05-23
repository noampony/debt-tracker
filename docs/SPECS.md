# Hebrew Debt Tracker Web App — Product Specification

## 1. Product Overview

### 1.1 Goal

Build a mobile-first Hebrew web app that helps a single user track informal debts with friends and family.

The user can:

* Add people they exchange money with as "members" (not really adding them, just creating an entity of them in the system).
* Log debt-related transactions quickly.
* See who owes them money and whom they owe money to.
* View transaction history per member.
* Reset a member's debt after explicit confirmation (pressing OK button).

### 1.2 Core Product Principle

The app is optimized for fast transaction entry.

The most common user flow is:

1. Open the app.
2. Select a member.
3. Enter amount and reason.
4. Save transaction.
5. Close the app.

Viewing history and debt summaries are secondary flows.

### 1.3 Language and Directionality

The user interface must be Hebrew-native:

* All UI labels, buttons, messages, empty states, validation errors, and dialogs must be in Hebrew.
* Layout direction must be Right-To-Left using `dir="rtl"`.
* Hebrew input and output should be supported naturally.
* The implementation artifacts, code, comments, TODOs, prompts, variable names, and documentation remain in English.

---

## 2. Target Users

### 2.1 Primary User

A Hebrew-speaking individual who frequently lends or borrows small or medium amounts of money from friends and family.

### 2.2 Usage Context

Typical usage happens on mobile, often immediately after a real-world event such as:

* Paying for someone at a restaurant.
* Borrowing cash.
* Splitting a shared expense.
* Repaying an existing debt.
* Recording a manual adjustment.

---

## 3. Core Concepts

### 3.1 Member

A person the user has financial transactions with.

Examples:

* Friend
* Family member
* Roommate
* Coworker

A member has a name and a debt balance derived from their transaction history.

### 3.2 Transaction

A transaction changes the debt balance between the user and a member.

Each transaction includes:

* Member
* Date
* Amount
* Direction
* Title / reason (user can pick reason from a common reasons list, or enter a custom reason)
* Optional notes

### 3.3 Debt Balance Semantics

Use one consistent internal balance convention (in hebrew):

```text
positive balance: member owes the user
negative balance: user owes the member
zero balance: no open debt
```

Examples:

* `+50`: the member owes the user 50.
* `-30`: the user owes the member 30.
* `0`: settled.

The UI must explain this in Hebrew using natural phrasing, not raw plus/minus terminology only.

Suggested Hebrew display examples:

* Positive: `דני חייב לך ₪50`
* Negative: `אתה חייב לדני ₪30`
* Zero: `אין חוב פתוח מול דני`

---

## 4. Functional Requirements

## 4.1 Member Management

### 4.1.1 Add Member

The user can add a new member.

Required fields:

* Name

Optional future fields:

* Phone number
* Notes
* Avatar / initials

Validation:

* Name is required.
* Name must not be empty after trimming whitespace.
* Duplicate names should be prevented.

Suggested Hebrew UI:

* Page / modal title: `הוספת איש קשר`
* Name field: `שם`
* Save button: `שמירה`
* Cancel button: `ביטול`
* Validation: `יש להזין שם`

### 4.1.2 Edit Member

The user can edit a member's name.

Phase 1 may omit this if needed, but the data model should not prevent it.

### 4.1.3 Delete Member

Deleting a member is not required for the first implementation.

If implemented later, deletion must require confirmation because it may remove transaction history.

---

## 4.2 Transaction Management

### 4.2.1 Add Transaction

The user can add a transaction for a member.

Required fields:

* Member
* Amount
* Direction
* Title / reason (user can pick reason from a common reasons list, or enter a custom reason)
* Date

Optional fields:

* Notes

Default values:

* Date defaults to the current date.
* The last selected member may be remembered locally to speed up repeated entry.
* Direction may default to the user's most common previous direction, or no default if this creates risk of mistakes.

Validation:

* Amount is required.
* Amount must be greater than zero.
* Amount must be numeric.
* Title / reason is required or strongly recommended. For Phase 1, make it required to keep history understandable.
* Member is required.

Direction options:

1. Member owes user more money.
2. User owes member more money.

Suggested Hebrew labels:

* `הוא חייב לי`
* `אני חייב לו`

Amount display:

* Use Israeli Shekel by default: `₪`.
* Store amounts as numeric values, not formatted strings.

### 4.2.2 Fast Transaction Flow

The add transaction flow must be accessible from the primary screen with minimal taps.

Required UX behavior:

* A prominent primary action button is always visible on the main screen.
* The add transaction form should be short and optimized for one-handed mobile use.
* Amount input should open the numeric keyboard on mobile.
* The user should be able to save immediately after entering member, amount, direction, and title.

Suggested flow:

1. Tap `תנועה חדשה`.
2. Select member from searchable list or recent members.
3. Enter amount.
4. Choose direction.
5. Pick / Enter short reason.
6. Tap `שמירה`.

Optimization:

* If the user starts from a member card, preselect that member.
* Show recent members near the top.
* Avoid requiring transaction notes.

### 4.2.3 Transaction History Per Member

The user can view all transactions for a specific member.

Each transaction row/card must show:

* Date
* Amount
* Direction / meaning
* Title / reason
* Notes if available

Recommended display:

* Newest transactions first.
* Use color or visual distinction for positive vs negative balance changes, but do not rely on color alone.
* Amount should be prominent.
* Title should be easy to scan.

Suggested Hebrew labels:

* `היסטוריית עסקאות`
* `תאריך`
* `סכום`
* `סיבה`
* `הערות`

### 4.2.4 Edit Transaction

Editing transactions is not required for Phase 1.

If implemented later:

* Editing should update the member balance automatically.
* The history should make clear that the transaction was edited, or the app should maintain an audit-friendly updated timestamp.

### 4.2.5 Delete Transaction

Deleting transactions is not required for Phase 1.

If implemented later:

* Deletion must require confirmation.
* Consider soft-delete rather than permanent deletion.

---

## 4.3 Debt Summary

### 4.3.1 Main Debt Overview

The user can view all members and their current debt balances.

Each member card/list item should show:

* Member name
* Current balance in natural Hebrew
* Amount
* Quick action to add transaction for that member
* Link/action to view member details

Sorting:

* Members with non-zero balances should appear before settled members.
* Larger absolute balances should appear higher.
* Recently used members may also be prioritized for fast logging.

Suggested Hebrew states:

* `חייבים לך`
* `אתה חייב`
* `ללא חוב`

### 4.3.2 Aggregate Summary

The main screen should show a compact total summary:

* Total amount owed to the user.
* Total amount the user owes others.

Suggested Hebrew:

* `סה״כ חייבים לך: ₪120`
* `סה״כ אתה חייב: ₪80`

Optional net summary:

* `מאזן כולל: ₪40 לטובתך`

---

## 4.4 Reset Debt

### 4.4.1 Reset Member Debt

The user can reset a member's debt to zero.

This action should not delete historical transactions by default. Instead, it should create a balancing transaction that brings the member balance to zero.

Reason:

* Preserves auditability.
* Keeps history understandable.
* Prevents destructive data loss.

Example:

* Current balance with Dani is `+50`.
* Reset creates transaction `-50` titled `איפוס חוב`.
* New balance becomes `0`.

### 4.4.2 Confirmation Requirement

Reset debt requires second approval.

Minimum implementation:

* User taps reset button.
* Confirmation dialog opens.
* User must tap an explicit confirmation button such as `אישור איפוס`.

Suggested Hebrew dialog:

* Title: `איפוס חוב`
* Body: `הפעולה תאפס את החוב מול {memberName} ותוסיף עסקת איזון להיסטוריה. האם להמשיך?`
* Confirm button: `אישור איפוס`
* Cancel button: `ביטול`

Safety requirement:

* The confirmation button should not be the default accidental action.
* The dialog should clearly state that the action affects the balance.

---

## 5. Non-Functional Requirements

## 5.1 Mobile-First Design

The app must be optimized for mobile web usage.

Requirements:

* Responsive layout starting from narrow screens.
* Large tap targets, minimum 44px height where practical.
* Primary actions reachable without precise tapping.
* Avoid dense desktop-style tables on mobile.
* Use cards/lists for transaction and member views.
* Keep forms short.

Desktop behavior:

* The same mobile-oriented layout may be centered with a max-width container.
* Desktop does not need a native dashboard layout.

Recommended layout:

```text
body
  max-width: 480px on desktop
  full width on mobile
  centered horizontally on large screens
```

## 5.2 RTL and Hebrew Support

Technical requirements:

* Root HTML element should include `lang="he"` and `dir="rtl"`.
* All UI text must be Hebrew.
* Text alignment should default to right.
* Form inputs should support Hebrew text naturally.
* Numeric fields should remain usable and readable in RTL layout.
* Icons that imply direction must be reviewed for RTL correctness.

Implementation notes:

* Avoid hardcoded `left` and `right` CSS where logical properties can be used.
* Prefer CSS logical properties: `margin-inline-start`, `padding-inline-end`, etc.
* Check that modal, drawer, toast, and navigation components behave correctly in RTL.

## 5.3 Accessibility

Requirements:

* Buttons must have accessible names in Hebrew.
* Inputs must have labels.
* Confirmation dialogs must trap focus while open.
* Error messages must be readable by screen readers where possible.
* Do not rely on color alone for debt direction.

## 5.4 Data Integrity

Requirements:

* Balances must be derived from transactions, or transaction updates must keep balances consistent.
* Amounts must be stored as integer minor units if possible, e.g. agorot, to avoid floating point issues.
* For a simple shekel-only app, storing whole shekels as integers is acceptable if decimal support is intentionally omitted.

Recommended approach:

* Store amount in agorot as integer: `amountMinor`.
* Display as shekels using localized formatting.

## 5.5 Security and Privacy

The app stores personal financial information, even if informal.

Requirements:

* Do not expose user data in logs.
* Validate all input on the client and, if a backend exists, on the server as well.
* Escape rendered user-generated text.
* Avoid `dangerouslySetInnerHTML` or equivalent unsafe rendering.
* If authentication is added, protect all user data by user ID.
* Do not store secrets in frontend code.

For local-only MVP:

* Use browser local storage or IndexedDB only if the product explicitly accepts local-device persistence.
* Inform the user if data is stored only on the current device.

For cloud-backed version:

* Use authenticated per-user storage.
* Enforce authorization server-side.
* Use HTTPS only.

---

## 6. Data Model

## 6.1 Member

```ts
type Member = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};
```

## 6.2 Transaction

```ts
type TransactionDirection = "member_owes_user" | "user_owes_member";

type Transaction = {
  id: string;
  memberId: string;
  amountMinor: number;
  direction: TransactionDirection;
  title: string;
  notes?: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  type: "manual" | "reset_adjustment";
};
```

## 6.3 Balance Calculation

```ts
function getSignedAmount(transaction: Transaction): number {
  if (transaction.direction === "member_owes_user") {
    return transaction.amountMinor;
  }
  return -transaction.amountMinor;
}
```

Member balance:

```ts
balanceMinor = sum(getSignedAmount(transaction) for member transactions)
```

Interpretation:

* `balanceMinor > 0`: member owes user.
* `balanceMinor < 0`: user owes member.
* `balanceMinor === 0`: settled.

## 6.4 Reset Adjustment Calculation

If current member balance is `balanceMinor`:

* If balance is `0`, no reset transaction is needed.
* If balance is positive, create a `user_owes_member` transaction with the same absolute amount.
* If balance is negative, create a `member_owes_user` transaction with the same absolute amount.

```ts
function createResetTransaction(memberId: string, balanceMinor: number): Transaction | null {
  if (balanceMinor === 0) return null;
  return {
    id: generateId(),
    memberId,
    amountMinor: Math.abs(balanceMinor),
    direction: balanceMinor > 0 ? "user_owes_member" : "member_owes_user",
    title: "איפוס חוב",
    notes: undefined,
    transactionDate: todayAsIsoDate(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: "reset_adjustment",
  };
}
```

---

## 7. Screens and UX Flows

## 7.1 Main Screen: Debt Overview

Purpose:

* Provide current debt status.
* Enable fast transaction creation.

Required elements:

* App title in Hebrew.
* Aggregate summary.
* Primary `new transaction` button.
* Member list with balances.
* Add member action.

Suggested Hebrew UI:

* App title: `חובות בין חברים`
* Primary action: `עסקה חדשה`
* Add member: `הוספת איש קשר`
* Empty state: `עוד אין אנשי קשר. הוסף איש קשר כדי להתחיל.`

Member card actions:

* `הוסף עסקה`
* `צפייה בפרטים`

## 7.2 Add Transaction Screen / Modal

Purpose:

* Fast transaction logging.

Required fields:

* Member selector
* Amount
* Direction
* Title / reason
* Date
* Notes optional

Suggested Hebrew UI:

* Title: `עסקה חדשה`
* Member: `איש קשר`
* Amount: `סכום`
* Direction: `סוג העסקה`
* Reason: `סיבה`
* Date: `תאריך`
* Notes: `הערות`
* Save: `שמירה`
* Cancel: `ביטול`

Mobile behavior:

* Amount field should be focused quickly if member is preselected.
* Numeric keyboard should open for amount.
* Save button should be sticky at bottom if the form scrolls.

## 7.3 Member Detail Screen

Purpose:

* Show balance and transaction history for one member.

Required elements:

* Member name
* Current balance
* Quick add transaction button
* Reset debt button
* Transaction history list

Suggested Hebrew UI:

* `מצב חוב נוכחי`
* `היסטוריית עסקאות`
* `עסקה חדשה`
* `איפוס חוב`

## 7.4 Add Member Screen / Modal

Purpose:

* Add a new member quickly.

Fields:

* Name

Suggested Hebrew UI:

* Title: `הוספת איש קשר`
* Field: `שם`
* Save: `שמירה`
* Cancel: `ביטול`

## 7.5 Reset Confirmation Dialog

Purpose:

* Prevent accidental reset.

Required behavior:

* Open only after tapping reset.
* Require explicit confirmation.
* Cancel should be easy and safe.

Suggested Hebrew UI:

* Title: `איפוס חוב`
* Body: `הפעולה תאפס את החוב מול {memberName} ותוסיף עסקת איזון להיסטוריה. האם להמשיך?`
* Confirm: `אישור איפוס`
* Cancel: `ביטול`

---

## 8. Phase Plan

# Phase 0 — Project Foundation

Goal:
Create the base app structure and technical conventions.

Deliverables:

* Web app project initialized.
* Mobile-first layout shell.
* Hebrew RTL configuration.
* Basic routing or screen-state structure.
* Shared UI components foundation.
* Basic local persistence decision implemented or stubbed.

Acceptance criteria:

* App opens on mobile and desktop browsers.
* Root document uses Hebrew language and RTL direction.
* Main layout is usable on a narrow mobile viewport.
* All visible placeholder UI is Hebrew.

Implementation notes:

* Keep code identifiers in English.
* Keep UI strings centralized where possible.
* Add a small Hebrew string dictionary even for MVP to avoid scattered literals.

---

# Phase 1 — Local MVP: Members and Fast Transactions

Goal:
Allow the user to add members and log transactions quickly.

Deliverables:

* Add member flow.
* Member list.
* Add transaction flow.
* Transaction persistence.
* Balance calculation.
* Basic main debt overview.

Required features:

* Create member.
* Create transaction.
* Select member during transaction creation.
* Store date, amount, direction, title, and notes.
* Show current balance per member.
* Show aggregate total owed to user and owed by user.

Acceptance criteria:

* User can add a member with a Hebrew name.
* User can add a transaction for that member.
* Balance updates immediately after saving.
* Positive and negative balances are displayed with correct Hebrew phrasing.
* User can complete a transaction quickly on mobile.

Out of scope for Phase 1:

* Authentication.
* Cloud sync.
* Editing transactions.
* Deleting transactions.
* Multiple users.

---

# Phase 2 — Member Detail and Transaction History

Goal:
Enable clear inspection of a member's transaction history.

Deliverables:

* Member detail screen.
* Transaction list per member.
* Current balance display on member detail.
* Quick transaction creation from member detail.

Required features:

* Open member details from main screen.
* View all transactions for selected member.
* Show date, amount, direction, title, and notes.
* Sort transactions newest-first.
* Preselect member when adding a transaction from member detail.

Acceptance criteria:

* User can inspect how a member's balance was calculated.
* Notes are visible when present.
* Transaction direction is understandable in Hebrew.
* Main screen and detail screen remain mobile-friendly.

---

# Phase 3 — Reset Debt Safely

Goal:
Allow the user to settle a debt without destroying history.

Deliverables:

* Reset debt action on member detail screen.
* Confirmation dialog.
* Reset adjustment transaction creation.
* Zero-balance state.

Required features:

* Reset button visible for a member.
* Confirmation required before reset.
* Reset creates a balancing transaction titled `איפוס חוב`.
* Historical transactions remain visible.

Acceptance criteria:

* Reset cannot happen with a single accidental tap.
* After reset, member balance is exactly zero.
* Transaction history shows the reset adjustment.
* Resetting an already-zero balance is disabled or shows a clear no-op message.

---

# Phase 4 — UX Optimization for Fast Logging

Goal:
Reduce friction for the most common workflow.

Deliverables:

* Recent members prioritization.
* Improved mobile form behavior.
* Sticky save action where useful.
* Better empty states and validation messages.
* Optional remembered last member.

Possible features:

* Recent members section in transaction form.
* Searchable member selector.
* Quick amount input.
* Predefined common reasons, if useful.
* Tap member card to start transaction.

Acceptance criteria:

* User can start a new transaction from the main screen in one tap.
* User can start a member-specific transaction from a member card or detail screen.
* Form validation is clear and in Hebrew.
* The app feels optimized for repeated quick use.

---

# Phase 5 — Data Hardening and Optional Cloud Backend

Goal:
Prepare the app for durable personal use beyond local-only storage.

Deliverables depend on selected architecture.

If local-only:

* Export / import backup.
* Clear data warning.
* Local persistence reliability improvements.

If cloud-backed:

* Authentication.
* User-specific data isolation.
* Server-side validation.
* Secure database schema.
* Backup and migration strategy.

Acceptance criteria:

* User data survives normal browser refreshes and app restarts.
* Data ownership boundaries are clear.
* Sensitive information is not leaked through logs or public endpoints.

---

# Phase 6 — Polish and Production Readiness

Goal:
Improve reliability, accessibility, and release quality.

Deliverables:

* Full RTL review.
* Accessibility pass.
* Error handling.
* Loading states.
* Basic test coverage.
* Deployment configuration.

Acceptance criteria:

* App works on current mobile Chrome and Safari.
* App works acceptably on desktop browsers.
* Keyboard navigation is usable.
* Confirmation dialogs are accessible.
* No obvious Hebrew/RTL layout bugs remain.
* Core balance logic is covered by tests.

---

## 9. Suggested Test Cases

## 9.1 Balance Calculation

### Case 1: Member owes user

Transactions:

* Member owes user ₪100

Expected balance:

* `+100`
* UI: member owes user ₪100

### Case 2: User owes member

Transactions:

* User owes member ₪40

Expected balance:

* `-40`
* UI: user owes member ₪40

### Case 3: Mixed transactions

Transactions:

* Member owes user ₪100
* User owes member ₪30

Expected balance:

* `+70`

### Case 4: Settled balance

Transactions:

* Member owes user ₪100
* User owes member ₪100

Expected balance:

* `0`

### Case 5: Reset positive balance

Current balance:

* `+75`

Reset transaction:

* Direction: `user_owes_member`
* Amount: `75`
* Title: `איפוס חוב`

Expected final balance:

* `0`

### Case 6: Reset negative balance

Current balance:

* `-75`

Reset transaction:

* Direction: `member_owes_user`
* Amount: `75`
* Title: `איפוס חוב`

Expected final balance:

* `0`

---

## 10. Hebrew UI String Guidelines

### 10.1 Tone

Use simple, direct Hebrew.

Avoid overly formal accounting language unless needed.

Prefer:

* `עסקה חדשה`
* `שמירה`
* `איפוס חוב`
* `חייבים לך`
* `אתה חייב`

Avoid ambiguous phrases where possible.

### 10.2 Gendered Hebrew

Hebrew has gendered wording. The app should avoid unnecessary gender-specific phrasing where possible.

Potential issue:

* `אני חייב` is masculine.

Possible neutral alternatives:

* `החוב שלך`
* `חוב לצד השני`
* `חייבים לך`
* `ללא חוב`

For Phase 1, acceptable practical labels:

* `חייבים לי`
* `אני חייב/ת`

### 10.3 UI String Dictionary Example

```ts
export const he = {
  appTitle: "חובות בין חברים",
  newTransaction: "עסקה חדשה",
  addMember: "הוספת איש קשר",
  save: "שמירה",
  cancel: "ביטול",
  amount: "סכום",
  reason: "סיבה",
  notes: "הערות",
  date: "תאריך",
  resetDebt: "איפוס חוב",
  confirmReset: "אישור איפוס",
  noOpenDebt: "ללא חוב",
};
```

---

## 11. Recommended Technical Approach

The exact stack can be chosen later. The following assumptions are suitable for an AI coding agent.

### 11.1 Frontend

Recommended options:

* React + TypeScript
* Next.js or Vite
* Mobile-first CSS
* Component library only if it supports RTL well

### 11.2 Persistence for MVP

For the first implementation, use one of:

* LocalStorage for very simple MVP.
* IndexedDB for more durable structured local storage.

Recommended MVP choice:

* LocalStorage is acceptable for the first prototype.
* Wrap storage access behind a repository interface so it can later be replaced.

Example repository concept:

```ts
type DebtRepository = {
  getMembers(): Promise<Member[]>;
  createMember(member: Member): Promise<void>;
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: Transaction): Promise<void>;
};
```

### 11.3 Suggested Folder Structure

```text
src/
  app/
  components/
  features/
    members/
    transactions/
    balances/
  lib/
    dates.ts
    money.ts
    ids.ts
  storage/
    debtRepository.ts
    localStorageDebtRepository.ts
  i18n/
    he.ts
  styles/
```

### 11.4 Money Formatting

Use a dedicated formatter.

```ts
export function formatIls(amountMinor: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
  }).format(amountMinor / 100);
}
```

### 11.5 Date Formatting

Use Hebrew locale for display.

```ts
export function formatDate(dateIso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateIso));
}
```

---

## 12. AI Coding Agent Instructions

When implementing this app, follow these rules:

1. Keep all source code, identifiers, comments, and tests in English.
2. Keep all user-facing UI strings in Hebrew.
3. Centralize Hebrew UI strings in a dictionary or constants file.
4. Implement the app mobile-first.
5. Set `lang="he"` and `dir="rtl"` at the root.
6. Use logical CSS properties where possible instead of physical left/right properties.
7. Store money as integers, preferably minor units.
8. Derive balances from transactions or ensure transaction writes cannot desynchronize balances.
9. Do not delete history when resetting debt; create a reset adjustment transaction.
10. Require explicit confirmation before reset.
11. Add tests for balance calculation and reset calculation.
12. Escape all user-generated text through normal framework rendering.
13. Do not use unsafe HTML injection.
14. Optimize transaction creation over reporting features.

---

## 13. Initial Definition of Done

The app is considered MVP-complete when:

* A Hebrew-speaking user can use the app without seeing English UI text.
* The app works correctly in RTL layout.
* The user can add members.
* The user can add debt transactions quickly.
* The user can see current balances for all members.
* The user can open a member and view transaction history.
* The user can reset a member's debt only after confirmation.
* Reset creates a balancing transaction instead of deleting history.
* Balance calculation has automated test coverage.
* The app is usable on mobile web.
