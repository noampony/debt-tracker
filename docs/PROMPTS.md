Hebrew Debt Tracker Web App — Codex Implementation Prompts

Use these prompts sequentially with Codex or another AI coding agent.

Each prompt is scoped to one implementation section. The agent must read the project documentation before making changes, implement the relevant tasks, update docs/TODO.md, run available checks, and report what changed.

⸻

General Agent Instructions

Every prompt below includes the same required operating rules:

* Read docs/SPECS.md before implementation.
* Read docs/TODO.md before implementation.
* Implement the requested section only, unless a dependency is required to make that section work.
* Follow the Definition of Done for every task in docs/TODO.md.
* Mark every completed TODO item by changing [ ] to [x] in docs/TODO.md.
* Do not mark a TODO as complete unless its Definition of Done is satisfied.
* Run relevant tests, linting, type checks, and build commands whenever possible.
* Validate the implementation manually where automated checks are not sufficient.
* Keep all code, filenames, comments, tests, and internal docs in English.
* Keep all user-facing UI strings in Hebrew.
* Preserve Hebrew RTL behavior.
* Avoid unsafe rendering of user-generated content.
* Do not introduce secrets or sensitive logs.
* At the end, summarize:
    * What was implemented.
    * Which TODOs were marked done.
    * Which commands were run.
    * Any remaining issues or skipped checks.

⸻

Prompt 1 — Project Foundation

You are implementing Section 1: Project Foundation for the Hebrew Debt Tracker web app.
Before making changes:
1. Read `docs/SPECS.md`.
2. Read `docs/TODO.md`.
3. Locate Section 1: Project Foundation in `docs/TODO.md`.
Implement all tasks in Section 1:
- 1.1 Initialize Application
- 1.2 Hebrew and RTL Foundation
- 1.3 Mobile-First Layout Shell
Requirements:
- Create or complete the web application project using a production-ready TypeScript frontend stack.
- Prefer React + TypeScript with either Next.js or Vite, unless the repository already has a stack selected.
- Configure scripts for development, build, linting, type checking, formatting, and tests.
- Set the root document language to Hebrew and direction to RTL.
- Add a centralized Hebrew UI string dictionary.
- Create a mobile-first layout shell that works well on narrow screens and is centered on desktop.
- Add basic visual primitives for buttons, cards, inputs, and page layout.
- Keep all source code and comments in English.
- Keep all visible UI text in Hebrew.
Definition of Done:
Use the exact Definition of Done entries in `docs/TODO.md` for Section 1. Do not mark any task complete until its Definition of Done is satisfied.
Validation:
- Run install if needed.
- Run the dev/build command if possible.
- Run linting if configured.
- Run type checking if configured.
- Run tests if configured.
- Manually inspect or reason through the root Hebrew RTL behavior and mobile-first layout.
After implementation:
- Update `docs/TODO.md` and mark completed Section 1 tasks with `[x]`.
- Leave incomplete tasks unchecked and add a short note explaining what remains.
- Provide a summary of changed files, completed TODOs, commands run, and any remaining issues.

⸻

Prompt 2 — Domain Model and Business Logic

You are implementing Section 2: Domain Model and Business Logic for the Hebrew Debt Tracker web app.
Before making changes:
1. Read `docs/SPECS.md`.
2. Read `docs/TODO.md`.
3. Locate Section 2: Domain Model and Business Logic in `docs/TODO.md`.
Implement all tasks in Section 2:
- 2.1 Define Core Types
- 2.2 Implement Money Utilities
- 2.3 Implement Date Utilities
- 2.4 Implement Balance Logic
- 2.5 Implement Reset Debt Logic
Requirements:
- Define the `Member`, `TransactionDirection`, and `Transaction` types exactly according to the spec unless the existing codebase requires a compatible equivalent.
- Store money as integer minor units, preferably agorot.
- Implement safe money parsing from user input.
- Implement ILS formatting using the Hebrew locale.
- Implement Hebrew date formatting.
- Implement signed transaction amount calculation.
- Implement per-member balance calculation.
- Implement aggregate summary calculation.
- Implement reset adjustment calculation.
- Reset logic must create a balancing transaction and must not delete history.
- Reset transaction title must be `איפוס חוב`.
- Keep all business logic framework-independent where practical.
Definition of Done:
Use the exact Definition of Done entries in `docs/TODO.md` for Section 2. Do not mark any task complete until its Definition of Done is satisfied.
Validation:
- Add or update unit tests for money utilities, date utilities, balance logic, sorting if applicable, and reset logic.
- Run the unit tests.
- Run type checking.
- Run linting if available.
- Ensure all tests pass before marking TODOs complete.
After implementation:
- Update `docs/TODO.md` and mark completed Section 2 tasks with `[x]`.
- Leave incomplete tasks unchecked and add a short note explaining what remains.
- Provide a summary of changed files, completed TODOs, commands run, and any remaining issues.

⸻

Prompt 3 — Persistence Layer

You are implementing Section 3: Persistence Layer for the Hebrew Debt Tracker web app.
Before making changes:
1. Read `docs/SPECS.md`.
2. Read `docs/TODO.md`.
3. Locate Section 3: Persistence Layer in `docs/TODO.md`.
Implement all tasks in Section 3:
- 3.1 Repository Interface
- 3.2 Local Persistence Implementation
Requirements:
- Create a repository abstraction for members and transactions.
- UI/domain code should depend on the repository interface, not directly on browser storage.
- Implement a local persistence repository using LocalStorage or IndexedDB.
- Members and transactions must persist across browser refreshes.
- Handle missing or malformed local data safely where practical.
- Use explicit namespaced storage keys.
- Include or support schema versioning.
- Do not log personal financial data.
- Do not store formatted money strings as the source of truth.
Definition of Done:
Use the exact Definition of Done entries in `docs/TODO.md` for Section 3. Do not mark any task complete until its Definition of Done is satisfied.
Validation:
- Add or update tests for repository behavior where practical.
- Verify data can be saved and loaded.
- Verify missing storage data does not crash the app.
- Run tests.
- Run type checking.
- Run linting if available.
After implementation:
- Update `docs/TODO.md` and mark completed Section 3 tasks with `[x]`.
- Leave incomplete tasks unchecked and add a short note explaining what remains.
- Provide a summary of changed files, completed TODOs, commands run, and any remaining issues.

⸻

Prompt 4 — Member Management

You are implementing Section 4: Member Management for the Hebrew Debt Tracker web app.
Before making changes:
1. Read `docs/SPECS.md`.
2. Read `docs/TODO.md`.
3. Locate Section 4: Member Management in `docs/TODO.md`.
Implement all tasks in Section 4:
- 4.1 Add Member
- 4.2 Member List
Requirements:
- Implement an add-member form.
- Required Hebrew UI strings include:
  - `הוספת איש קשר`
  - `שם`
  - `שמירה`
  - `ביטול`
  - `יש להזין שם`
- Reject empty or whitespace-only member names.
- Prevent or clearly warn on duplicate member names.
- Show all members on the main screen.
- Show each member's current balance meaning in Hebrew.
- Add member actions for adding a transaction and viewing details, even if later sections complete the target screens.
- Implement member sorting according to the TODO rules.
- Keep the UI mobile-friendly and RTL-correct.
Definition of Done:
Use the exact Definition of Done entries in `docs/TODO.md` for Section 4. Do not mark any task complete until its Definition of Done is satisfied.
Validation:
- Add or update component tests for the add-member form.
- Add or update tests for member sorting if sorting is implemented as a utility.
- Manually verify Hebrew UI and RTL behavior.
- Run tests.
- Run type checking.
- Run linting if available.
After implementation:
- Update `docs/TODO.md` and mark completed Section 4 tasks with `[x]`.
- Leave incomplete tasks unchecked and add a short note explaining what remains.
- Provide a summary of changed files, completed TODOs, commands run, and any remaining issues.

⸻

Prompt 5 — Transaction Creation

You are implementing Section 5: Transaction Creation for the Hebrew Debt Tracker web app.
Before making changes:
1. Read `docs/SPECS.md`.
2. Read `docs/TODO.md`.
3. Locate Section 5: Transaction Creation in `docs/TODO.md`.
Implement all tasks in Section 5:
- 5.1 Add Transaction Form
- 5.2 Fast Transaction UX
Requirements:
- Implement the primary fast transaction flow.
- Required fields:
  - Member
  - Amount
  - Direction
  - Title / reason
  - Date
  - Optional notes
- Required Hebrew labels include:
  - `תנועה חדשה`
  - `איש קשר`
  - `סכום`
  - `סוג התנועה`
  - `סיבה`
  - `תאריך`
  - `הערות`
  - `שמירה`
  - `ביטול`
- Date defaults to today.
- Amount input must be optimized for mobile numeric entry.
- Validate missing member, missing amount, zero amount, negative amount, invalid number, and missing title/reason.
- All validation messages must be in Hebrew.
- Add a prominent new transaction action on the main screen.
- Support starting a transaction from a member card with the member preselected.
- Support recent-member or practical member prioritization if possible.
- Balance must update immediately after saving.
- Keep the flow short and mobile-first.
Definition of Done:
Use the exact Definition of Done entries in `docs/TODO.md` for Section 5. Do not mark any task complete until its Definition of Done is satisfied.
Validation:
- Add or update component tests for the add-transaction form.
- Test validation errors.
- Test successful transaction creation.
- Manually verify fast mobile transaction flow.
- Run tests.
- Run type checking.
- Run linting if available.
After implementation:
- Update `docs/TODO.md` and mark completed Section 5 tasks with `[x]`.
- Leave incomplete tasks unchecked and add a short note explaining what remains.
- Provide a summary of changed files, completed TODOs, commands run, and any remaining issues.

⸻

Prompt 6 — Debt Overview

You are implementing Section 6: Debt Overview for the Hebrew Debt Tracker web app.
Before making changes:
1. Read `docs/SPECS.md`.
2. Read `docs/TODO.md`.
3. Locate Section 6: Debt Overview in `docs/TODO.md`.
Implement all tasks in Section 6:
- 6.1 Main Summary
Requirements:
- Implement aggregate summary cards on the main screen.
- Show total amount owed to the user.
- Show total amount the user owes others.
- Required Hebrew text includes:
  - `סה״כ חייבים לך`
  - `סה״כ אתה חייב`
- Display all money as formatted ILS.
- Implement natural Hebrew balance text per member.
- Do not rely only on color or plus/minus signs to convey debt direction.
- Summary must update after adding transactions and after reset if reset already exists.
Definition of Done:
Use the exact Definition of Done entries in `docs/TODO.md` for Section 6. Do not mark any task complete until its Definition of Done is satisfied.
Validation:
- Add or update tests for aggregate summary if not already covered.
- Add or update component tests for visible summary behavior where practical.
- Manually verify Hebrew text for positive, negative, and zero balances.
- Run tests.
- Run type checking.
- Run linting if available.
After implementation:
- Update `docs/TODO.md` and mark completed Section 6 tasks with `[x]`.
- Leave incomplete tasks unchecked and add a short note explaining what remains.
- Provide a summary of changed files, completed TODOs, commands run, and any remaining issues.

⸻

Prompt 7 — Member Detail and Transaction History

You are implementing Section 7: Member Detail and Transaction History for the Hebrew Debt Tracker web app.
Before making changes:
1. Read `docs/SPECS.md`.
2. Read `docs/TODO.md`.
3. Locate Section 7: Member Detail and Transaction History in `docs/TODO.md`.
Implement all tasks in Section 7:
- 7.1 Member Detail Screen
- 7.2 Transaction History
Requirements:
- Implement a member detail screen or route.
- Show member name.
- Show current balance.
- Show quick add transaction button.
- Show reset debt button if Section 8 is already implemented, otherwise prepare the UI placeholder/action integration cleanly.
- Show transaction history for the selected member.
- Transaction history must show:
  - Date
  - Amount
  - Direction meaning
  - Title / reason
  - Notes if available
- Sort transactions newest-first.
- Use mobile-friendly cards or compact list items, not dense desktop tables.
- Starting a transaction from member detail must preselect the member.
- Provide a clear Hebrew empty state when there are no transactions.
Definition of Done:
Use the exact Definition of Done entries in `docs/TODO.md` for Section 7. Do not mark any task complete until its Definition of Done is satisfied.
Validation:
- Add or update component tests for member detail behavior where practical.
- Verify transaction filtering by member.
- Verify newest-first sorting.
- Manually verify RTL and mobile layout.
- Run tests.
- Run type checking.
- Run linting if available.
After implementation:
- Update `docs/TODO.md` and mark completed Section 7 tasks with `[x]`.
- Leave incomplete tasks unchecked and add a short note explaining what remains.
- Provide a summary of changed files, completed TODOs, commands run, and any remaining issues.

⸻

Prompt 8 — Reset Debt

You are implementing Section 8: Reset Debt for the Hebrew Debt Tracker web app.
Before making changes:
1. Read `docs/SPECS.md`.
2. Read `docs/TODO.md`.
3. Locate Section 8: Reset Debt in `docs/TODO.md`.
Implement all tasks in Section 8:
- 8.1 Reset Action
Requirements:
- Add reset debt button on the member detail screen.
- Required Hebrew label: `איפוס חוב`.
- Reset must not happen immediately after one tap.
- Implement a confirmation dialog.
- Required Hebrew dialog text:
  - Title: `איפוס חוב`
  - Body: `הפעולה תאפס את החוב מול {memberName} ותוסיף תנועת איזון להיסטוריה. האם להמשיך?`
  - Confirm: `אישור איפוס`
  - Cancel: `ביטול`
- Cancel must close the dialog without changing anything.
- Confirm must create a reset adjustment transaction.
- Reset adjustment must have type `reset_adjustment`.
- Reset adjustment title must be `איפוס חוב`.
- Final member balance must be exactly zero.
- Original transactions must remain visible.
- Resetting an already-zero balance must be disabled or clearly handled as a no-op.
Definition of Done:
Use the exact Definition of Done entries in `docs/TODO.md` for Section 8. Do not mark any task complete until its Definition of Done is satisfied.
Validation:
- Add or update unit tests for reset logic if not already complete.
- Add or update component tests for the reset confirmation dialog.
- Test cancel path.
- Test confirm path.
- Manually verify dialog behavior on mobile and RTL.
- Run tests.
- Run type checking.
- Run linting if available.
After implementation:
- Update `docs/TODO.md` and mark completed Section 8 tasks with `[x]`.
- Leave incomplete tasks unchecked and add a short note explaining what remains.
- Provide a summary of changed files, completed TODOs, commands run, and any remaining issues.

⸻

Prompt 9 — Backend and Cloud Persistence

You are implementing Section 9: Backend and Cloud Persistence for the Hebrew Debt Tracker web app.
Before making changes:
1. Read `docs/SPECS.md`.
2. Read `docs/TODO.md`.
3. Locate Section 9: Backend and Cloud Persistence in `docs/TODO.md`.
Implement all tasks in Section 9:
- 9.1 Backend Architecture
- 9.2 Backend API
- 9.3 Authentication and Authorization
Requirements:
- Decide and document the backend architecture based on the existing app stack.
- If using Next.js, prefer server actions or API routes as appropriate.
- If using a separate backend, keep frontend integration clean through the repository abstraction.
- Implement production-capable database persistence.
- Add database schema/migrations or documented schema setup.
- Implement backend data models for users, members, and transactions.
- Store amounts as integer minor units.
- Implement members API.
- Implement transactions API.
- Implement backend reset endpoint/action where the server calculates the balancing transaction from stored transactions.
- Implement authentication.
- Enforce per-user data isolation.
- Server-side validation is mandatory.
- Backend must reject invalid input and unauthorized cross-user access.
- Do not trust client-calculated balances for security-sensitive operations.
- Do not log personal financial data.
Definition of Done:
Use the exact Definition of Done entries in `docs/TODO.md` for Section 9. Do not mark any task complete until its Definition of Done is satisfied.
Validation:
- Add or update backend tests for member creation.
- Add or update backend tests for transaction creation.
- Add or update backend tests for reset behavior.
- Add or update authorization tests for cross-user access denial.
- Run database migrations or schema validation if available.
- Run backend tests.
- Run full type checking.
- Run linting if available.
After implementation:
- Update `docs/TODO.md` and mark completed Section 9 tasks with `[x]`.
- Leave incomplete tasks unchecked and add a short note explaining what remains.
- Provide a summary of architecture decisions, changed files, completed TODOs, commands run, and any remaining issues.

⸻

Prompt 10 — Frontend Integration with Backend

You are implementing Section 10: Frontend Integration with Backend for the Hebrew Debt Tracker web app.
Before making changes:
1. Read `docs/SPECS.md`.
2. Read `docs/TODO.md`.
3. Locate Section 10: Frontend Integration with Backend in `docs/TODO.md`.
Implement all tasks in Section 10:
- API-backed repository
- Loading states
- Error states
Requirements:
- Implement an API-backed repository that uses the same repository interface as the local implementation.
- Frontend should load members and transactions from the backend.
- New members must save to the backend.
- New transactions must save to the backend.
- Reset action must save through the backend reset endpoint/action.
- Add Hebrew loading states for the main screen, member detail, transaction save, and reset action.
- Add Hebrew error states for failed member creation, failed transaction creation, failed reset, and failed data loading.
- Prevent accidental duplicate submissions while requests are pending.
- Do not expose sensitive backend details or stack traces in UI errors.
- Preserve the mobile-first Hebrew RTL UX.
Definition of Done:
Use the exact Definition of Done entries in `docs/TODO.md` for Section 10. Do not mark any task complete until its Definition of Done is satisfied.
Validation:
- Add or update frontend integration tests where practical.
- Mock failed API calls and verify Hebrew error states.
- Verify loading states manually or via tests.
- Run tests.
- Run type checking.
- Run linting if available.
- Run build if backend integration affects production build.
After implementation:
- Update `docs/TODO.md` and mark completed Section 10 tasks with `[x]`.
- Leave incomplete tasks unchecked and add a short note explaining what remains.
- Provide a summary of changed files, completed TODOs, commands run, and any remaining issues.

⸻

Prompt 11 — Editing and Data Maintenance Features

You are implementing Section 11: Editing and Data Maintenance Features for the Hebrew Debt Tracker web app.
Before making changes:
1. Read `docs/SPECS.md`.
2. Read `docs/TODO.md`.
3. Locate Section 11: Editing and Data Maintenance Features in `docs/TODO.md`.
Implement all tasks in Section 11:
- 11.1 Edit Member
- 11.2 Optional Transaction Maintenance decisions
Requirements:
- Implement edit member name.
- Validate edited member names using the same rules as add member.
- Existing transactions must remain associated with the member after renaming.
- Decide whether transaction editing is included before deployment.
- Decide whether transaction deletion is included before deployment.
- Document both decisions in the appropriate project documentation.
- If transaction editing is implemented, add validation, audit behavior, and tests.
- If transaction deletion is implemented, require confirmation and add tests.
- If either feature is omitted, document the intended alternative, such as adding a correction transaction.
Definition of Done:
Use the exact Definition of Done entries in `docs/TODO.md` for Section 11. Do not mark any task complete until its Definition of Done is satisfied.
Validation:
- Add or update tests for editing member names.
- Verify edited names appear across the app.
- Verify transactions remain associated after rename.
- Add tests for transaction edit/delete only if implemented.
- Run tests.
- Run type checking.
- Run linting if available.
After implementation:
- Update `docs/TODO.md` and mark completed Section 11 tasks with `[x]`.
- Leave incomplete tasks unchecked and add a short note explaining what remains.
- Provide a summary of product decisions, changed files, completed TODOs, commands run, and any remaining issues.

⸻

Prompt 12 — Accessibility

You are implementing Section 12: Accessibility for the Hebrew Debt Tracker web app.
Before making changes:
1. Read `docs/SPECS.md`.
2. Read `docs/TODO.md`.
3. Locate Section 12: Accessibility in `docs/TODO.md`.
Implement all tasks in Section 12:
- Accessible labels for all inputs and buttons
- Accessible dialogs
- Keyboard navigation verification
Requirements:
- Every input must have an associated label.
- Icon-only buttons must have accessible Hebrew names.
- Form errors should be associated with relevant fields where practical.
- Confirmation dialogs must have a clear title.
- Focus must move into dialogs when opened.
- Focus should not escape dialogs while open.
- Escape/cancel behavior must be safe.
- Focus should return to the triggering control after dialog close where practical.
- Keyboard navigation order must be logical in RTL layout.
- Visible focus indication must exist.
Definition of Done:
Use the exact Definition of Done entries in `docs/TODO.md` for Section 12. Do not mark any task complete until its Definition of Done is satisfied.
Validation:
- Add or update accessibility-focused component tests where practical.
- Manually verify keyboard navigation.
- Manually verify reset dialog focus behavior.
- Run available accessibility checks if the project has them.
- Run tests.
- Run type checking.
- Run linting if available.
After implementation:
- Update `docs/TODO.md` and mark completed Section 12 tasks with `[x]`.
- Leave incomplete tasks unchecked and add a short note explaining what remains.
- Provide a summary of changed files, completed TODOs, commands run, accessibility checks performed, and any remaining issues.

⸻

Prompt 13 — Security and Privacy

You are implementing Section 13: Security and Privacy for the Hebrew Debt Tracker web app.
Before making changes:
1. Read `docs/SPECS.md`.
2. Read `docs/TODO.md`.
3. Locate Section 13: Security and Privacy in `docs/TODO.md`.
Implement all tasks in Section 13:
- Client-side validation
- Backend validation
- Safe rendering of user-generated content
- Sensitive logging removal
- Secret and environment variable protection
Requirements:
- Validate member names, transaction amounts, transaction titles, directions, dates, and member IDs.
- Client validation must provide Hebrew feedback.
- Backend validation must enforce all data rules independently of the client.
- Backend must reject transactions for nonexistent or unauthorized members.
- User-generated member names, transaction titles, and notes must be rendered safely.
- Do not use unsafe HTML injection.
- Remove production console logs or backend logs containing personal financial data.
- Ensure secrets are read from environment variables.
- Ensure `.env` files containing secrets are ignored by git.
- Ensure public frontend environment variables do not contain secrets.
- Document required environment variables without exposing values.
Definition of Done:
Use the exact Definition of Done entries in `docs/TODO.md` for Section 13. Do not mark any task complete until its Definition of Done is satisfied.
Validation:
- Add or update validation tests.
- Add or update authorization/security tests where backend exists.
- Manually test HTML-like user input and verify it is not executed.
- Search for unsafe rendering APIs and sensitive logs.
- Run tests.
- Run type checking.
- Run linting if available.
- Run build if environment handling changed.
After implementation:
- Update `docs/TODO.md` and mark completed Section 13 tasks with `[x]`.
- Leave incomplete tasks unchecked and add a short note explaining what remains.
- Provide a security-focused summary of changed files, completed TODOs, commands run, and any remaining risks.

⸻

Prompt 14 — Testing

You are implementing Section 14: Testing for the Hebrew Debt Tracker web app.
Before making changes:
1. Read `docs/SPECS.md`.
2. Read `docs/TODO.md`.
3. Locate Section 14: Testing in `docs/TODO.md`.
Implement all tasks in Section 14:
- 14.1 Unit Tests
- 14.2 Component Tests
- 14.3 End-to-End Tests
Requirements:
- Add or complete unit tests for:
  - Money utilities
  - Balance logic
  - Reset logic
  - Sorting logic
- Add or complete component tests for:
  - Add member form
  - Add transaction form
  - Reset confirmation dialog
- Add or complete E2E tests for:
  - Core happy path
  - Reset flow
  - Mobile viewport behavior
- Tests must verify Hebrew UI labels where relevant.
- Tests must verify that reset requires confirmation.
- Tests must verify that reset preserves history.
- Tests must be runnable through documented commands.
Definition of Done:
Use the exact Definition of Done entries in `docs/TODO.md` for Section 14. Do not mark any task complete until its Definition of Done is satisfied.
Validation:
- Run all unit tests.
- Run all component tests.
- Run all E2E tests if the environment supports it.
- Run type checking.
- Run linting if available.
- Run production build if practical.
- If an E2E environment is unavailable, document exactly why and what was still validated.
After implementation:
- Update `docs/TODO.md` and mark completed Section 14 tasks with `[x]`.
- Leave incomplete tasks unchecked and add a short note explaining what remains.
- Provide a summary of tests added, completed TODOs, commands run, and any skipped checks.

⸻

Prompt 15 — Deployment Readiness

You are implementing Section 15: Deployment Readiness for the Hebrew Debt Tracker web app.
Before making changes:
1. Read `docs/SPECS.md`.
2. Read `docs/TODO.md`.
3. Locate Section 15: Deployment Readiness in `docs/TODO.md`.
Implement all tasks in Section 15:
- 15.1 Production Build
- 15.2 Documentation
Requirements:
- Ensure production build succeeds.
- Ensure linting, type checking, and tests pass.
- Configure the selected deployment target.
- Document hosting platform, build command, runtime/start command, and required environment variables.
- Add deployment health verification instructions.
- Create or update README.
- Document architecture decisions:
  - Frontend stack
  - Backend stack
  - Persistence strategy
  - Money storage decision
  - Reset behavior decision
- Do not expose secret values in documentation.
Definition of Done:
Use the exact Definition of Done entries in `docs/TODO.md` for Section 15. Do not mark any task complete until its Definition of Done is satisfied.
Validation:
- Run production build.
- Run linting.
- Run type checking.
- Run tests.
- Verify README instructions are accurate.
- Verify deployment configuration does not expose secrets.
After implementation:
- Update `docs/TODO.md` and mark completed Section 15 tasks with `[x]`.
- Leave incomplete tasks unchecked and add a short note explaining what remains.
- Provide a summary of deployment setup, changed files, completed TODOs, commands run, and any remaining deployment risks.

⸻

Prompt 16 — Final QA Checklist

You are implementing Section 16: Final QA Checklist for the Hebrew Debt Tracker web app.
Before making changes:
1. Read `docs/SPECS.md`.
2. Read `docs/TODO.md`.
3. Locate Section 16: Final QA Checklist in `docs/TODO.md`.
Complete the final QA checklist.
Requirements:
- Verify all UI text is Hebrew.
- Verify RTL layout across the app.
- Verify mobile usability.
- Verify desktop usability.
- Verify data persistence.
- Verify security basics.
- Verify all automated checks pass.
- Fix any issues found during QA.
- Do not mark QA tasks complete unless actually verified.
Specific checks:
- No English text appears in user-facing UI.
- Main screen, forms, member detail, dialogs, and history are RTL-correct.
- Main flow works on mobile viewport.
- Desktop layout is centered and usable.
- Members, transactions, balances, and reset transactions persist after reload.
- User-generated HTML-like text is not executed.
- Invalid backend requests are rejected if backend exists.
- Cross-user access is denied if auth exists.
- No secrets are committed.
- Lint, typecheck, tests, E2E tests, and production build pass where available.
Definition of Done:
Use the exact Definition of Done entries in `docs/TODO.md` for Section 16. Do not mark any task complete until its Definition of Done is satisfied.
Validation:
- Run all available automated checks.
- Perform manual QA for Hebrew, RTL, mobile, desktop, persistence, and security basics.
- Fix issues found during validation.
After implementation:
- Update `docs/TODO.md` and mark completed Section 16 tasks with `[x]`.
- Leave incomplete tasks unchecked and add a short note explaining what remains.
- Provide a QA report with completed checks, commands run, fixed issues, and any remaining risks.

⸻

Prompt 17 — Final Definition of Done and Release Readiness

You are completing Section 17: Final Definition of Done and Release Readiness for the Hebrew Debt Tracker web app.
Before making changes:
1. Read `docs/SPECS.md`.
2. Read the full `docs/TODO.md`.
3. Locate Section 17: Final Definition of Done in `docs/TODO.md`.
4. Review every unchecked TODO item in the entire file, not only Section 17.
Your job is to make the project release-ready.
Requirements:
- Review the entire TODO list and identify any remaining unchecked tasks.
- Implement any missing required functionality needed for release readiness.
- Do not mark a final Definition of Done item complete unless the underlying feature and validation are complete.
- Verify that the app is fully usable in Hebrew.
- Verify that the app is RTL-correct.
- Verify that the app is mobile-first and desktop-friendly.
- Verify that users can:
  - Create members.
  - Create transactions quickly.
  - View all current debts.
  - View transaction history per member.
  - Reset debt only after explicit confirmation.
- Verify that reset preserves history by creating a balancing transaction.
- Verify backend persistence is implemented.
- Verify authentication and per-user authorization are implemented if cloud backend is used.
- Verify tests cover core business logic and main user flows.
- Verify production build succeeds.
- Verify deployment instructions exist.
- Verify no known critical security or privacy issues remain.
Definition of Done:
Use the exact Definition of Done entries in `docs/TODO.md` for Section 17 and any remaining unchecked tasks in earlier sections. Do not mark any task complete until its Definition of Done is satisfied.
Validation:
- Run the full automated validation suite:
  - Lint
  - Typecheck
  - Unit tests
  - Component tests
  - E2E tests
  - Production build
- Manually validate Hebrew UI, RTL layout, mobile flow, desktop layout, reset flow, persistence, and security basics.
- Fix any release-blocking issue found.
After implementation:
- Update `docs/TODO.md` and mark completed tasks with `[x]`.
- Leave incomplete tasks unchecked and add a short note explaining what remains.
- Provide a release-readiness report including:
  - Remaining unchecked TODOs, if any.
  - Commands run and results.
  - Manual QA performed.
  - Known risks.
  - Whether the app is ready to deploy.