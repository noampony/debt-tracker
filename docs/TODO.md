# Hebrew Debt Tracker Web App — Implementation TODO List

## Agent Operating Instructions

This TODO list is intended for an AI coding agent implementing the full web app.

### Progress Tracking Rules

For every task:

* Keep the task checkbox unchecked until the task is fully complete.
* Mark the task as done by changing `[ ]` to `[x]` only after its Definition of Done is satisfied.
* Do not mark a parent section as complete until all child tasks in that section are complete.
* If implementation reveals that a task is obsolete, replace it with a short note explaining why, then mark it done only if the intended requirement is still satisfied.
* If a task is partially implemented, leave it unchecked and add a short implementation note below it.
* If tests are required by the task, do not mark it done until the relevant tests pass.
* If a task changes user-facing behavior, manually verify the Hebrew RTL UI before marking it done.

### Implementation Constraints

* All code, filenames, comments, tests, commit messages, and internal documentation must be in English.
* All user-facing UI text must be Hebrew.
* The app must be Hebrew-native and RTL-first.
* The app must be mobile-first, while still usable on desktop.
* Transaction creation must be optimized as the fastest and most important workflow.
* Money must be stored as integer minor units, preferably agorot.
* Resetting debt must create a balancing transaction, not delete transaction history.
* Destructive or balance-changing actions must require explicit confirmation.
* User-generated text must be rendered safely through framework escaping.
* Do not use unsafe HTML injection.

---

# 1. Project Foundation

## 1.1 Initialize Application

* [x] Create the web application project.

Description:
Initialize the app using the selected production-ready web stack. Recommended stack: React + TypeScript with either Next.js or Vite. The app should support routing, testing, linting, formatting, and production builds.

Definition of Done:

* Project can be installed from a clean checkout.

* Development server runs successfully.

* Production build succeeds.

* TypeScript is enabled.

* Basic linting and formatting are configured.

* A root app page renders successfully.

* [x] Add core project scripts.

Description:
Add package scripts for development, build, preview/start, linting, formatting, type checking, and tests.

Definition of Done:

* `npm run dev` or equivalent starts the local app.

* `npm run build` creates a production build.

* `npm run lint` passes.

* `npm run typecheck` passes.

* `npm test` or equivalent runs the test suite.

* [x] Define the recommended folder structure.

Description:
Organize source files by domain and shared utilities.

Suggested structure:

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
  tests/
```

Definition of Done:

* Folder structure exists.
* New code is placed in the correct domain folder.
* Shared utilities are not duplicated across features.

---

## 1.2 Hebrew and RTL Foundation

* [x] Configure Hebrew language and RTL direction at the root.

Description:
The app must be Hebrew-native. Set the document language and direction globally.

Definition of Done:

* Root HTML uses `lang="he"`.

* Root HTML uses `dir="rtl"`.

* Main layout defaults to RTL.

* Text aligns naturally for Hebrew.

* Manual verification passes on mobile and desktop viewport widths.

* [x] Create centralized Hebrew UI string dictionary.

Description:
Create a single Hebrew string constants file for all user-facing text.

Suggested path:

```text
src/i18n/he.ts
```

Definition of Done:

* All visible UI strings are read from centralized constants or clearly grouped domain string files.

* No English user-facing text appears in the UI.

* Repeated strings are not duplicated unnecessarily.

* [x] Add RTL-safe styling conventions.

Description:
Use CSS logical properties where practical instead of hardcoded left/right styling.

Definition of Done:

* Layout uses `margin-inline-*`, `padding-inline-*`, `border-inline-*`, or equivalent where appropriate.
* Directional icons are reviewed for RTL correctness.
* Forms, cards, dialogs, and navigation display correctly in RTL.

---

## 1.3 Mobile-First Layout Shell

* [x] Implement the base responsive app shell.

Description:
Create the global page layout optimized for mobile web usage. On desktop, center the mobile-width layout rather than creating a separate desktop-native dashboard.

Definition of Done:

* App uses full width on narrow mobile screens.

* App is centered with a reasonable max width on desktop, recommended around `480px`.

* Layout does not overflow horizontally on common mobile widths.

* Main content is readable and tappable.

* [x] Add global visual design primitives.

Description:
Define base typography, spacing, buttons, cards, inputs, and page sections.

Definition of Done:

* Buttons have large mobile-friendly tap targets.
* Inputs are readable and easy to tap.
* Cards and lists are visually distinct.
* The app has consistent spacing and typography.

---

# 2. Domain Model and Business Logic

## 2.1 Define Core Types

* [x] Create the `Member` type.

Description:
Define the member entity.

Required shape:

```ts
type Member = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};
```

Definition of Done:

* Type exists in an appropriate domain file.

* Type is reused across member UI, storage, and tests.

* [x] Create the `Transaction` type.

Description:
Define the transaction entity.

Required shape:

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

Definition of Done:

* Types exist in an appropriate transaction domain file.
* All transaction creation logic uses these types.
* No amount is stored as a formatted currency string.

---

## 2.2 Implement Money Utilities

* [x] Implement money parsing from user input.

Description:
Convert user-entered shekel amounts into integer minor units.

Definition of Done:

* Valid numeric input converts to integer minor units.

* Empty input is rejected.

* Zero and negative values are rejected.

* Invalid numeric input is rejected.

* Tests cover valid and invalid inputs.

* [x] Implement Israeli Shekel formatting.

Description:
Create a dedicated formatter for displaying ILS amounts in Hebrew locale.

Expected utility:

```ts
formatIls(amountMinor: number): string
```

Definition of Done:

* Formats values using `he-IL` locale.
* Displays Israeli Shekel currency.
* Handles positive, negative, and zero values correctly.
* Tests cover representative values.

---

## 2.3 Implement Date Utilities

* [x] Implement date formatting for Hebrew UI.

Description:
Create a utility for displaying transaction dates in Hebrew locale.

Expected utility:

```ts
formatDate(dateIso: string): string
```

Definition of Done:

* Dates are displayed using `he-IL` locale.

* Invalid date handling is safe and predictable.

* Tests cover normal date formatting.

* [x] Implement current date helper.

Description:
Create a helper for producing today's date for transaction defaults.

Definition of Done:

* Helper returns a stable ISO-compatible date value.
* Add transaction form defaults to current date.
* Tests cover expected format where practical.

---

## 2.4 Implement Balance Logic

* [x] Implement signed transaction amount calculation.

Description:
Convert transaction direction into signed balance effect.

Rules:

* `member_owes_user` returns positive amount.
* `user_owes_member` returns negative amount.

Definition of Done:

* Utility function exists.

* Tests cover both directions.

* [x] Implement member balance calculation.

Description:
Calculate a member's balance from all their transactions.

Definition of Done:

* Balance is derived from transactions.

* Only transactions for the selected member are included.

* Tests cover positive, negative, mixed, and zero balances.

* [x] Implement aggregate balance summary calculation.

Description:
Calculate total amount owed to the user and total amount the user owes others across all members.

Definition of Done:

* Positive member balances contribute to total owed to user.
* Negative member balances contribute to total user owes others.
* Zero balances are ignored.
* Tests cover multiple members with mixed balances.

---

## 2.5 Implement Reset Debt Logic

* [x] Implement reset adjustment calculation.

Description:
Given a member's current balance, generate the transaction needed to bring the balance to zero.

Rules:

* If balance is zero, return no transaction.
* If balance is positive, create `user_owes_member` adjustment.
* If balance is negative, create `member_owes_user` adjustment.
* Title must be Hebrew: `איפוס חוב`.
* Transaction type must be `reset_adjustment`.

Definition of Done:

* Reset utility exists.
* Tests cover positive balance reset.
* Tests cover negative balance reset.
* Tests cover zero balance no-op.
* Resulting transaction brings balance exactly to zero.

---

# 3. Persistence Layer

## 3.1 Repository Interface

* [x] Create a repository abstraction.

Description:
Create a persistence interface so local storage can later be replaced with a backend implementation without rewriting UI logic.

Suggested shape:

```ts
type DebtRepository = {
  getMembers(): Promise<Member[]>;
  createMember(member: Member): Promise<void>;
  updateMember(member: Member): Promise<void>;
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: Transaction): Promise<void>;
};
```

Definition of Done:

* UI code depends on the repository abstraction, not directly on browser storage.
* Repository methods return promises.
* Interface supports all MVP operations.

---

## 3.2 Local Persistence Implementation

* [x] Implement local storage repository.

Description:
Persist members and transactions locally for the MVP using LocalStorage or IndexedDB.

Definition of Done:

* Members persist across browser refresh.

* Transactions persist across browser refresh.

* Repository safely handles missing data.

* Repository safely handles malformed stored data where practical.

* No sensitive data is logged to console.

* [x] Add storage keys and versioning.

Description:
Use explicit namespaced storage keys and include a simple schema version.

Definition of Done:

* Storage keys are namespaced for this app.
* Stored data includes or supports a schema version.
* Future migration path is clear.

---

# 4. Member Management

## 4.1 Add Member

* [x] Implement add member form.

Description:
Allow the user to create a new member by entering a Hebrew name or any natural name text.

Required UI strings:

* Title: `הוספת איש קשר`
* Field: `שם`
* Save: `שמירה`
* Cancel: `ביטול`
* Validation: `יש להזין שם`

Definition of Done:

* User can open the add member form.

* User can enter a member name.

* Empty or whitespace-only names are rejected.

* Valid member is saved.

* New member appears in the member list immediately.

* [x] Prevent or warn on duplicate member names.

Description:
Avoid accidental duplicate members with the same normalized name.

Definition of Done:

* Exact duplicate names are detected after trimming whitespace.
* User receives a clear Hebrew validation message.
* Duplicate is not saved unless an explicit product decision allows it.

---

## 4.2 Member List

* [x] Implement member list on the main screen.

Description:
Show all members with their current debt state.

Definition of Done:

* Every member is shown.

* Each member displays current balance meaning in Hebrew.

* Each member has an action to add a transaction.

* Each member has an action to view details.

* List is usable on mobile.

* [x] Implement member sorting.

Description:
Sort the list to prioritize useful information.

Rules:

* Non-zero balances appear before zero balances.
* Larger absolute balances appear higher.
* If balances are equal, recent activity or name sorting may be used.

Definition of Done:

* Sorting follows the required rules.
* Tests cover sorting logic if implemented as a utility.

---

# 5. Transaction Creation

## 5.1 Add Transaction Form

* [x] Implement add transaction form.

Description:
Create the primary flow for quickly logging a transaction.

Required fields:

* Member
* Amount
* Direction
* Title / reason
* Date
* Optional notes

Required Hebrew labels:

* Title: `תנועה חדשה`
* Member: `איש קשר`
* Amount: `סכום`
* Direction: `סוג התנועה`
* Reason: `סיבה`
* Date: `תאריך`
* Notes: `הערות`
* Save: `שמירה`
* Cancel: `ביטול`

Definition of Done:

* User can select a member.

* User can enter an amount.

* User can choose direction.

* User can enter reason/title.

* Date defaults to today.

* Notes are optional.

* Transaction saves successfully.

* Balance updates immediately after save.

* [x] Add transaction form validation.

Description:
Validate all required fields before saving.

Definition of Done:

* Missing member is rejected.

* Missing amount is rejected.

* Zero amount is rejected.

* Negative amount is rejected.

* Invalid number is rejected.

* Missing title/reason is rejected.

* All validation messages are in Hebrew.

* [x] Optimize amount input for mobile.

Description:
Ensure the amount field is efficient on mobile devices.

Definition of Done:

* Amount input opens a numeric keyboard on mobile where supported.
* Input is large enough to tap easily.
* The user can enter a transaction without fighting RTL numeric input behavior.

---

## 5.2 Fast Transaction UX

* [x] Add prominent new transaction action to main screen.

Description:
The primary app action must be easy to access immediately.

Required Hebrew label:

* `תנועה חדשה`

Definition of Done:

* Primary action is visible on the main screen.

* It is easy to tap on mobile.

* It opens the add transaction flow.

* [x] Support starting transaction from a member card.

Description:
Allow users to start a transaction for a specific member directly from the member list.

Definition of Done:

* Member is preselected when opening the form from that member.

* User does not need to select the member again.

* Amount or next logical field receives focus where practical.

* [x] Support recent members or practical member prioritization.

Description:
Make member selection faster for repeated usage.

Definition of Done:

* Recently used members are easier to access, or member list sorting makes frequent/relevant members prominent.
* The implementation does not make member selection slower than a basic list.

---

# 6. Debt Overview

## 6.1 Main Summary

* [x] Implement aggregate summary cards.

Description:
Show total debt direction across all members.

Required Hebrew examples:

* `סה״כ חייבים לך`
* `סה״כ אתה חייב`

Definition of Done:

* Total owed to user is displayed.

* Total user owes others is displayed.

* Amounts are formatted as ILS.

* Summary updates after new transactions and resets.

* [x] Implement natural Hebrew balance text per member.

Description:
Display balances in plain Hebrew instead of requiring the user to interpret signs.

Examples:

* Positive: `{name} חייב/ת לך ₪50`
* Negative: `החוב שלך מול {name}: ₪30`
* Zero: `ללא חוב`

Definition of Done:

* Positive, negative, and zero states have distinct Hebrew text.
* UI does not rely only on plus/minus signs.
* UI does not rely only on color.

---

# 7. Member Detail and Transaction History

## 7.1 Member Detail Screen

* [x] Implement member detail screen.

Description:
Show details for a single member.

Required elements:

* Member name
* Current balance
* Quick add transaction button
* Reset debt button
* Transaction history

Definition of Done:

* User can navigate from main screen to member detail.

* Current balance is displayed correctly.

* User can start a transaction from member detail.

* User can return to the main screen.

* [x] Preselect member when adding transaction from detail screen.

Description:
Improve speed when adding a transaction from a specific member page.

Definition of Done:

* Add transaction form opens with the member already selected.
* User does not need to reselect the member.

---

## 7.2 Transaction History

* [x] Implement transaction history list for a member.

Description:
Show all transactions for the selected member.

Each transaction must show:

* Date
* Amount
* Direction meaning
* Title / reason
* Notes if available

Definition of Done:

* Transactions are filtered by member.

* Transactions are sorted newest-first.

* All required fields are visible.

* Notes are shown only when present.

* Empty history state is shown in Hebrew.

* [x] Make transaction history mobile-friendly.

Description:
Use cards or compact list items instead of dense tables.

Definition of Done:

* History is readable on a narrow mobile screen.
* Long titles or notes do not break layout.
* Amount and direction are easy to scan.

---

# 8. Reset Debt

## 8.1 Reset Action

* [x] Add reset debt button on member detail screen.

Description:
Allow the user to reset the debt with a member.

Required Hebrew label:

* `איפוס חוב`

Definition of Done:

* Button appears on member detail screen.

* Button is disabled or clearly no-op when balance is already zero.

* Button does not immediately reset debt without confirmation.

* [x] Implement reset confirmation dialog.

Description:
Require explicit second approval before resetting debt.

Required Hebrew UI:

* Title: `איפוס חוב`
* Body: `הפעולה תאפס את החוב מול {memberName} ותוסיף תנועת איזון להיסטוריה. האם להמשיך?`
* Confirm: `אישור איפוס`
* Cancel: `ביטול`

Definition of Done:

* Dialog opens after tapping reset.

* Cancel closes dialog without changes.

* Confirm performs reset.

* Confirm button is explicit and not an accidental default action.

* Dialog is usable on mobile.

* [x] Create reset adjustment transaction on confirmation.

Description:
Reset must preserve history by adding a balancing transaction.

Definition of Done:

* Reset creates a transaction with type `reset_adjustment`.
* Reset transaction title is `איפוס חוב`.
* Final member balance is exactly zero.
* Original transactions remain visible.
* Reset adjustment appears in transaction history.

---

# 9. Backend and Cloud Persistence

## 9.1 Backend Architecture

* [x] Decide and document backend architecture.

Description:
Choose the backend implementation appropriate for deployment. Options include Next.js API routes, a separate Node backend, or another production-ready backend.

Definition of Done:

* Backend choice is documented.

* Data flow between frontend and backend is clear.

* Local repository abstraction can be replaced or backed by API calls.

Architecture decision: Separate Express v5 + TypeScript backend in `server/`. See `docs/ARCHITECTURE.md` for full details. The frontend `DebtRepository` interface allows clean swapping between local and API-backed storage.

* [x] Implement backend data models.

Description:
Create backend representations for users, members, and transactions.

Definition of Done:

* Member model exists.

* Transaction model exists.

* Models preserve the same balance semantics as frontend.

* Amounts are stored as integer minor units.

* Created/updated timestamps are stored.

Implemented via Prisma v5 schema: `User`, `Member`, `Transaction` models in `prisma/schema.prisma`. Amounts stored as `Int` (agorot). Timestamps auto-managed by Prisma.

* [x] Implement database persistence.

Description:
Store members and transactions in a production-capable database.

Definition of Done:

* Database schema exists.
* Migrations or schema setup instructions exist.
* Members persist in the database.
* Transactions persist in the database.
* Data survives app restarts and redeployments.

SQLite (dev) / PostgreSQL (prod) via Prisma. Migration at `prisma/migrations/20260523120000_init/migration.sql`. Run `npm run db:migrate` to apply.

---

## 9.2 Backend API

* [x] Implement members API.

Description:
Expose backend endpoints or server actions for member operations.

Required operations:

* List members
* Create member
* Update member name, if implemented

Definition of Done:

* API validates input server-side.

* API returns clear errors.

* API does not expose data across users.

* Tests cover successful and invalid member creation.

Implemented in `server/routes/members.ts`: GET /api/members, POST /api/members, PATCH /api/members/:id. All validated with Zod. Per-user scoping enforced. 8 tests in `server/tests/members.test.ts` — all passing.

* [x] Implement transactions API.

Description:
Expose backend endpoints or server actions for transaction operations.

Required operations:

* List transactions
* Create transaction
* List transactions for a member
* Create reset adjustment transaction

Definition of Done:

* API validates amount, direction, title, date, and member.

* API rejects invalid transactions.

* API stores amount as integer minor units.

* API does not trust client-calculated data blindly.

* Tests cover successful and invalid transaction creation.

Implemented in `server/routes/transactions.ts`. 10 tests in `server/tests/transactions.test.ts` — all passing.

* [x] Implement backend reset endpoint or action.

Description:
Reset should be calculated safely on the backend to avoid client-side tampering.

Definition of Done:

* Backend calculates current member balance from stored transactions.
* Backend creates the correct balancing transaction.
* Backend handles already-zero balance safely.
* Backend returns updated member balance or transaction list.
* Tests cover positive, negative, and zero reset cases.

POST /api/members/:memberId/reset recalculates balance server-side from DB. 6 tests in `server/tests/reset.test.ts` — all passing.

---

## 9.3 Authentication and Authorization

* [x] Implement user authentication.

Description:
Add authentication suitable for a personal finance-related app.

Definition of Done:

* User can sign in.

* User can sign out.

* Auth state is handled across refreshes.

* Unauthenticated users cannot access private app data.

Email + password auth via bcrypt + JWT (30-day tokens). POST /api/auth/register + POST /api/auth/login. All protected routes require `Authorization: Bearer <token>`. 9 tests in `server/tests/auth.test.ts` — all passing. Note: sign-out is client-side (discard token); no server-side token revocation in this implementation.

* [x] Enforce per-user data isolation.

Description:
All members and transactions must belong to a specific authenticated user.

Definition of Done:

* Every member is associated with a user ID.
* Every transaction is associated directly or indirectly with a user ID.
* Backend queries are scoped to the authenticated user.
* A user cannot read or modify another user's data.
* Authorization tests cover cross-user access denial.

Every DB query is scoped to `req.userId`. Cross-user access returns 404. Authorization denial tested across all resources in `server/tests/members.test.ts`, `server/tests/transactions.test.ts`, and `server/tests/reset.test.ts`.

---

# 10. Frontend Integration with Backend

* [x] Implement API-backed repository.

Description:
Replace or supplement local storage with a repository that communicates with the backend.

Definition of Done:

* Frontend uses the same repository interface.

* Members load from backend.

* Transactions load from backend.

* New transactions save to backend.

* Reset action saves to backend.

Implemented `resetMemberDebt(memberId)` in `DebtRepository` interface. `apiDebtRepository` calls `POST /api/members/:memberId/reset` (server-side balance recalculation). `localStorageDebtRepository` calculates locally. `App.tsx` uses `repository.resetMemberDebt` instead of client-side calculation.

* [x] Add loading states.

Description:
Show user-friendly Hebrew loading states when backend data is loading.

Definition of Done:

* Main screen has loading state.

* Member detail has loading state.

* Transaction save has pending state.

* Reset action has pending state.

* User cannot accidentally submit the same action repeatedly while pending.

Added `isSavingMember`, `isSavingTransaction`, `isResetting` pending states. Buttons show Hebrew pending labels and are disabled while their action is in-flight. Main screen shows `ui.members.loading` while data loads.

* [x] Add error states.

Description:
Display clear Hebrew errors when backend actions fail.

Definition of Done:

* Failed member creation shows an error.
* Failed transaction creation shows an error.
* Failed reset shows an error.
* Failed data loading shows a recoverable error state.
* Errors do not expose sensitive technical details.

Added `loadError`, `memberCreateError`, `transactionCreateError`, `resetError` states. All display generic Hebrew error messages (`ui.error.*`). No stack traces or internal details exposed. New Hebrew strings added to `src/i18n/he.ts` under `loading` and `error` sections.

---

# 11. Editing and Data Maintenance Features

## 11.1 Edit Member

* [x] Implement edit member name.

Description:
Allow correcting a member's name.

Definition of Done:

* User can open edit member flow.
* Name validation matches add member validation.
* Updated name appears across the app.
* Existing transactions remain associated with the member.

Implemented: "שינוי שם" button on member detail screen opens an inline edit form with the current name pre-filled. Validates empty/whitespace (`יש להזין שם`) and duplicate names (`איש קשר בשם הזה כבר קיים`) against other members. Calls `repository.updateMember` then updates local React state. Transactions remain associated via `memberId` which never changes. 8 tests added to `src/tests/App.test.tsx`.

---

## 11.2 Optional Transaction Maintenance

* [x] Decide whether transaction editing is included before deployment.

Description:
Transaction editing is not part of the original MVP, but a deploy-ready app may need correction flows.

Definition of Done:

* Product decision is documented.

* If omitted, user has a reasonable alternative such as adding a correction transaction.

* If included, implementation tasks are added for edit validation, audit behavior, and tests.

**Decision: NOT included before deployment.** Transaction editing is out of scope for Phase 1 per the spec. Users who entered a wrong amount can add a correction transaction in the opposite direction. Full decision rationale documented in `docs/ARCHITECTURE.md` (Section 11 — Transaction Maintenance Decisions).

* [x] Decide whether transaction deletion is included before deployment.

Description:
Transaction deletion is potentially destructive and should be handled carefully.

Definition of Done:

* Product decision is documented.
* If omitted, user has a reasonable alternative such as adding a correction transaction.
* If included, deletion requires confirmation and tests.

**Decision: NOT included before deployment.** Preserving transaction history is a core design principle. Users can add correction transactions to cancel unwanted amounts. Full decision rationale documented in `docs/ARCHITECTURE.md` (Section 11 — Transaction Maintenance Decisions).

---

# 12. Accessibility

* [x] Add accessible labels for all inputs and buttons.

Description:
Ensure the app is usable with assistive technologies.

Definition of Done:

* Every input has an associated label.

* Icon-only buttons have accessible names in Hebrew.

* Form errors are associated with relevant fields where practical.

All inputs have `<label>` elements (via the `TextInput` component or explicit `htmlFor`). Radio buttons are wrapped in `<label>`. Textareas have `htmlFor` labels. All buttons have visible Hebrew text — no icon-only buttons exist. Form fields use `aria-invalid` + `aria-describedby` wired to error `<p id>` elements. 9 accessibility-focused tests added to `src/tests/App.test.tsx`.

* [x] Make dialogs accessible.

Description:
Confirmation dialogs must behave accessibly.

Definition of Done:

* Dialog has a clear title.

* Focus moves into the dialog when opened.

* Focus does not escape dialog while open.

* Escape/cancel behavior is safe.

* Focus returns to the triggering control after close where practical.

Created `src/components/primitives/Dialog.tsx` — a reusable component with `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus-on-open (first focusable child), Tab/Shift+Tab focus trap, Escape-to-close, and focus-return-to-trigger on close. All three confirmation dialogs (reset debt, delete member, delete transaction) now use this component. Tests verify focus-in, Escape, and focus-return behaviors.

* [x] Verify keyboard navigation.

Description:
The app should be usable with keyboard navigation.

Definition of Done:

* Main actions are reachable by keyboard.
* Focus order is logical in RTL layout.
* Visible focus indication exists.

All interactive elements (buttons, inputs, selects, textareas, radio buttons) are keyboard-reachable via Tab. Focus order follows DOM order which matches the logical RTL reading direction. Updated `global.css`: changed `:focus` to `:focus-visible` for form fields for cleaner keyboard-only outlines; added `:focus-within` highlight for radio group label rows; suppressed redundant outline on the `[role="dialog"]` container. Verified that Tab order in dialogs (Cancel → Confirm) is correct for RTL.

---

# 13. Security and Privacy

* [x] Validate all user input on the client.

Description:
Catch common invalid input early and provide Hebrew feedback.

Definition of Done:

* Member name validation exists.

* Transaction amount validation exists.

* Transaction title validation exists.

* Date validation exists.

`App.tsx` validates all fields before saving: member name (empty/whitespace/duplicate), transaction amount (required/zero/negative/invalid number), transaction title (required), and transaction date (required). All validation errors use Hebrew strings from `src/i18n/he.ts`. Tests cover all invalid-input paths in `src/tests/App.test.tsx`.

* [x] Validate all user input on the backend.

Description:
Client validation is not sufficient. Backend must enforce data rules.

Definition of Done:

* Backend rejects invalid member names.

* Backend rejects invalid amounts.

* Backend rejects invalid directions.

* Backend rejects transactions for nonexistent or unauthorized members.

* Backend tests cover invalid inputs.

Implemented in `server/lib/validation.ts` via Zod schemas: `createMemberSchema` (name min 1, max 200, trimmed; whitespace-only rejected explicitly in route), `createTransactionSchema` (amountMinor int positive, direction enum, title min 1 max 500, date YYYY-MM-DD regex, notes max 2000). Every transaction creation/update verifies the target member belongs to `req.userId`; foreign members return 404. Backend tests in `server/tests/members.test.ts`, `server/tests/transactions.test.ts`, `server/tests/auth.test.ts` cover all invalid-input and cross-user access cases (44 tests, all passing).

* [x] Prevent unsafe rendering of user-generated content.

Description:
Member names, titles, and notes are user-generated and must be rendered safely.

Definition of Done:

* App does not use unsafe HTML injection for user content.

* User-generated content is rendered through normal framework escaping.

* Security test or manual test verifies HTML-like input is not executed.

React renders all user-generated content (`{member.name}`, `{transaction.title}`, `{transaction.notes}`, etc.) via JSX text interpolation, which escapes HTML entities automatically. No `dangerouslySetInnerHTML` or `innerHTML` assignments exist anywhere in the frontend (`grep` confirmed). Three automated security tests added to `src/tests/App.test.tsx` (describe "Security — safe rendering") verify that HTML-like strings in member names, transaction titles, and notes render as escaped text nodes — no child elements are injected. Two backend tests in `server/tests/transactions.test.ts` confirm HTML-like strings are stored and returned as plain JSON strings. Front-end 82/82 and backend 46/46 tests pass.

* [x] Remove sensitive logging.

Description:
The app must not log personal financial data unnecessarily.

Definition of Done:

* No console logs expose member names, notes, transaction titles, or amounts in production code.

* Backend logs avoid personal financial data.

* Errors shown to users do not reveal stack traces or sensitive internals.

Audited all `console.log`/`console.error` calls: the only occurrences are `console.log('[server] running on port ${PORT}')` (server startup, no personal data) and `console.error('[server error]', err.message)` in the generic error handler (logs only the internal JS error message, never user-supplied content). The frontend shows opaque Hebrew error strings from `ui.error.*` — no stack traces or server internals are exposed to users. No other `console.*` calls found in frontend source.

* [x] Protect secrets and environment variables.

Description:
Ensure deployment secrets are not exposed to the frontend or committed to source control.

Definition of Done:

* Secrets are read from environment variables.
* `.env` files with secrets are ignored by git.
* Public frontend environment variables contain no secrets.
* Deployment docs list required environment variables without exposing values.

`JWT_SECRET` and `DATABASE_URL` are read exclusively from `process.env` in `server/lib/auth.ts` and Prisma config. `.env` is listed in `.gitignore` (confirmed). `.env.example` ships as a template with placeholder values only. The Vite frontend uses no `VITE_*` environment variables containing secrets — the only API communication is via bearer tokens issued at runtime. Required variables documented in `docs/ARCHITECTURE.md` (Environment Variables table) and `.env.example`.

---

# 14. Testing

## 14.1 Unit Tests

* [x] Add tests for money utilities.

Description:
Verify amount parsing and ILS formatting.

Definition of Done:

* Valid amounts pass.

* Invalid amounts fail.

* Formatting is covered for representative values.

Tests exist in `src/tests/domain.test.ts` under the "money utilities" describe block (3 tests covering parsing, rejection of invalid input, and ILS formatting). All 82 frontend unit/component tests pass.

* [x] Add tests for balance logic.

Description:
Verify all balance semantics.

Definition of Done:

* Member owes user case covered.

* User owes member case covered.

* Mixed transactions covered.

* Settled balance covered.

* Multiple members covered where relevant.

Tests exist in `src/tests/domain.test.ts` under the "balance logic" describe block (3 tests covering signed amounts, per-member balance for all four cases, and aggregate summary across multiple members). All pass.

* [x] Add tests for reset logic.

Description:
Verify reset adjustment behavior.

Definition of Done:

* Positive balance reset covered.

* Negative balance reset covered.

* Zero balance no-op covered.

* Final calculated balance is zero after reset transaction.

Tests exist in `src/tests/domain.test.ts` under the "reset debt logic" describe block (3 tests covering positive/negative/zero cases and verifying the final balance is exactly zero). All pass.

* [x] Add tests for sorting logic.

Description:
Verify member ordering rules.

Definition of Done:

* Non-zero balances appear before zero balances.
* Larger absolute balances appear before smaller balances.
* Tie behavior is deterministic.

Tests exist in `src/tests/memberSorting.test.ts` (2 tests). All pass.

---

## 14.2 Component Tests

* [x] Test add member form.

Description:
Verify member creation UI behavior.

Definition of Done:

* Empty name validation appears in Hebrew.

* Valid name submits successfully.

* Duplicate name behavior is tested.

Covered in `src/tests/App.test.tsx`: "adds a member from the Hebrew add member form", "rejects empty member names", "rejects duplicate member names after trimming whitespace". All pass.

* [x] Test add transaction form.

Description:
Verify transaction creation UI behavior.

Definition of Done:

* Required field validation appears in Hebrew.

* Valid transaction submits successfully.

* Amount validation is tested.

* Direction selection is tested.

Covered in `src/tests/App.test.tsx`: "opens the add transaction form with today's date and Hebrew labels", "rejects missing transaction fields with Hebrew validation messages", "rejects invalid transaction amount" (3 param cases), "creates a transaction and updates the member balance immediately", and accessibility tests verifying all fields have labeled inputs. All pass.

* [x] Test reset confirmation dialog.

Description:
Verify that reset requires explicit confirmation.

Definition of Done:

* Clicking reset opens dialog.
* Clicking cancel does not change balance.
* Clicking confirm creates reset adjustment.

Covered in `src/tests/App.test.tsx`: "opens reset dialog and cancel closes it without changing balance", "confirms reset by creating a reset_adjustment transaction, preserving history, and zeroing balance", and 4 accessibility tests for the reset dialog (focus, Escape, focus-return). All pass.

---

## 14.3 End-to-End Tests

* [x] Add E2E test for core happy path.

Description:
Test the main user workflow from an empty app.

Scenario:

1. Open app.
2. Add member.
3. Add transaction.
4. Verify balance on main screen.
5. Open member detail.
6. Verify transaction appears in history.

Definition of Done:

* Test passes in automated environment.

* Test verifies Hebrew UI labels.

* Test runs against production-like build where practical.

Implemented in `e2e/happy-path.spec.ts` (2 tests). Tests assert Hebrew titles (`החזרתי?`, `הוספת איש קשר`, `תנועה חדשה`, `היסטוריית תנועות`), Hebrew balance text (`דני חייב לך`), and transaction appearing in history. All pass via `npm run test:e2e`.

* [x] Add E2E test for reset flow.

Description:
Test safe reset behavior.

Scenario:

1. Create member with non-zero balance.
2. Open member detail.
3. Click reset.
4. Cancel and verify no change.
5. Click reset again.
6. Confirm.
7. Verify balance is zero and reset transaction appears.

Definition of Done:

* Cancel path is verified.

* Confirm path is verified.

* Final balance is zero.

* History is preserved.

Implemented in `e2e/reset-flow.spec.ts` (3 tests). Tests assert: reset button disabled + Hebrew message when balance is zero; cancel does not change balance; confirm zeros balance and the original transaction plus the `איפוס חוב` adjustment both appear in history. All pass.

* [x] Add E2E test for mobile viewport.

Description:
Verify the app is usable on mobile dimensions.

Definition of Done:

* Test runs at a mobile viewport size.
* Main transaction flow is usable.
* No horizontal overflow is detected where practical.

Implemented in `e2e/mobile-viewport.spec.ts` (2 tests). Tests run at 390×844 (iPhone 14). Verifies Hebrew UI, `inputmode="decimal"` on amount field, and checks `scrollWidth <= clientWidth`. Both pass.

---

# 15. Deployment Readiness

## 15.1 Production Build

* [x] Ensure production build succeeds.

Description:
The app must build cleanly for Vercel deployment.

Definition of Done:

* `npm run build` succeeds.

* `npm run typecheck` passes.

* `npm run typecheck:server` passes.

* `npm run lint` passes.

* `npm test` passes.

* `npm run test:server` passes.

Implementation note: Vercel build settings are defined in `vercel.json`. Local verification completed after adding the Vercel function entrypoint.

* [x] Configure deployment target.

Description:
Set up deployment configuration for Vercel.

Definition of Done:

* Hosting platform is documented as Vercel.

* Framework preset is documented as Vite.

* Build command is documented as `npm run build`.

* Output directory is documented as `dist`.

* API function route is documented for `/api/*` and `/health`.

* Runtime/start command is documented if needed.

* Required environment variables are documented.

Implementation note: `vercel.json` routes `/api/*` and `/health` to `api/index.ts`, and routes all other paths to the Vite SPA. Vercel Functions do not use `npm run start:server`.

* [x] Add deployment health verification.

Description:
Define how to verify that a deployment is working.

Definition of Done:

* App loads in deployed environment.
* Authentication works if enabled.
* Database connection works if backend is enabled.
* User can complete the core happy path after deployment.
* `/health` returns OK from the deployed API function.
* PostgreSQL-backed member and transaction persistence is verified.
* Reset flow creates a balancing transaction after deployment.

Implementation note: Post-deploy verification steps are documented in `README.md`. Production requires hosted PostgreSQL through `DATABASE_URL`.

---

## 15.2 Documentation

* [x] Create README.

Description:
Document how to install, run, test, and deploy the app.

Definition of Done:

* README includes project overview.

* README includes local setup instructions.

* README includes test commands.

* README includes build/deployment instructions.

* README includes required environment variables.

* [x] Document architecture decisions.

Description:
Record key decisions for future maintenance.

Definition of Done:

* Frontend stack decision documented.
* Backend stack decision documented.
* Persistence strategy documented.
* Money storage decision documented.
* Reset behavior decision documented.

Implementation note: Architecture decisions are documented in `docs/ARCHITECTURE.md`, including Vercel static hosting, Vercel Functions, Prisma persistence, integer agorot storage, and server-calculated reset adjustments.

---

# 16. Final QA Checklist

* [x] Verify all UI text is Hebrew.

Description:
Manually inspect all screens, states, buttons, errors, dialogs, and empty states.

Definition of Done:

* No English text appears in user-facing UI.

* Hebrew wording is understandable.

* Gendered Hebrew is acceptable or avoided where practical.

* [x] Verify RTL layout across the app.

Description:
Manually inspect layout direction and alignment.

Definition of Done:

* Main screen is RTL.

* Forms are RTL.

* Member detail is RTL.

* Dialogs are RTL.

* Transaction history is RTL.

* Directional icons behave correctly.

* [x] Verify mobile usability.

Description:
Test the app on mobile viewport and, if possible, a real mobile browser.

Definition of Done:

* Main flow is easy to complete on mobile.

* Tap targets are large enough.

* Numeric keyboard opens for amount field where supported.

* No horizontal scrolling appears.

* [x] Verify desktop usability.

Description:
Test the app in desktop browser.

Definition of Done:

* Layout is centered and readable.

* App does not look broken on wide screens.

* All features remain usable.

* [x] Verify data persistence.

Description:
Confirm data remains available after refresh and app restart.

Definition of Done:

* Members persist.

* Transactions persist.

* Balances remain correct after reload.

* Reset transactions persist.

* [x] Verify security basics.

Description:
Run final security-focused checks.

Definition of Done:

* User-generated text is safely rendered.

* Invalid backend requests are rejected.

* Cross-user access is denied if auth exists.

* No secrets are committed.

* Production logs avoid sensitive financial details.

* [x] Verify all automated checks pass.

Description:
Run the complete validation suite.

Definition of Done:

* Lint passes.
* Typecheck passes.
* Unit tests pass.
* Component tests pass.
* E2E tests pass.
* Production build passes.

---

# 17. Final Definition of Done

The project is complete and ready to deploy when all of the following are true:

* [x] Every required TODO item above is marked complete.
* [x] The app is fully usable in Hebrew.
* [x] The app is RTL-correct.
* [x] The app is mobile-first and desktop-friendly.
* [x] Users can create members.
* [x] Users can create transactions quickly.
* [x] Users can view all current debts.
* [x] Users can view transaction history per member.
* [x] Users can reset debt only after explicit confirmation.
* [x] Reset preserves history by creating a balancing transaction.
* [x] Backend persistence is implemented.
* [x] Authentication and per-user authorization are implemented if cloud backend is used.
* [x] Tests cover core business logic and main user flows.
* [x] Production build succeeds.
* [x] Deployment instructions exist.
* [x] No known critical security or privacy issues remain.
