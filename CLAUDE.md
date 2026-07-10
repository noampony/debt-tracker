# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (run in two separate terminals)
npm run dev:server   # Express API with hot-reload on :3001
npm run dev          # Vite frontend on :5173, proxies /api → :3001

# Type checking
npm run typecheck         # frontend (src/)
npm run typecheck:server  # backend (server/)

# Linting & formatting
npm run lint
npm run format         # check
npm run format:write   # fix

# Tests
npm test                          # frontend unit tests (vitest + jsdom)
npm run test:server               # backend integration tests (vitest + supertest)
npm run test:e2e                  # Playwright end-to-end tests

# Database
npm run db:migrate    # apply pending Prisma migrations
npm run db:generate   # regenerate Prisma client after schema change

# Build
npm run build         # prisma generate + tsc + vite build → dist/
```

### Running a single test

```bash
# Frontend — pass a filename pattern
npx vitest run src/tests/domain.test.ts

# Backend — pass a filename pattern
npx vitest run --config vitest.server.config.ts server/tests/auth.test.ts
```

## Environment Setup

Three separate PostgreSQL databases are expected:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Local dev and production |
| `TEST_DATABASE_URL` | Backend integration tests (rows are deleted) |
| `E2E_DATABASE_URL` | Playwright tests; falls back to `TEST_DATABASE_URL` |

`JWT_SECRET` is required for all API work. See `.env.example`.

## Architecture

### Dual-entry Express app

The same Express application lives in two entry points:
- **`server/index.ts`** — calls `app.listen()` for local development with `tsx watch`
- **`api/index.ts`** — exports `createApp()` without listening, used as a Vercel Function

The app factory is **`server/lib/app.ts`**. Routes are in `server/routes/`.

### Frontend has no client-side router

Navigation between the member list and member detail view is done purely through React state (`selectedMemberId` in `src/app/App.tsx`). There is no routing library. All application state lives in the `App` component.

### `DebtRepository` interface

`src/storage/debtRepository.ts` defines the repository contract the `App` component depends on. Two implementations exist:
- **`apiDebtRepository.ts`** — used in production; wraps `fetch` calls with JWT auth; auto-calls `logout` on 401
- **`localStorageDebtRepository.ts`** — legacy fallback; exists for isolated frontend tests

`AuthGate` (`src/app/AuthGate.tsx`) wires auth state to the repository: it creates an `apiDebtRepository` when a JWT token is present and shows `AuthPage` when not.

### Money: integer agorot only

All amounts are stored and computed as **integer agorot** (minor units). `src/lib/money.ts` provides `parseIlsInputToMinor` and `formatIls`. Never store or pass floating-point ILS values — convert at the UI boundary only.

### Auth flow

JWT tokens are stored in localStorage under `debt-tracker:auth` (key in `AuthContext.tsx`). `AuthContext` exposes `login`, `register`, and `logout` via React context. The server uses `server/lib/middleware.ts` (`authMiddleware`) to verify the JWT and attach `req.userId` to every protected request. All member/transaction queries are scoped to `req.userId`.

### i18n

All user-facing strings are in **`src/i18n/he.ts`** (Hebrew). Never hardcode UI text elsewhere. The entire app is RTL (`dir="rtl"` on the root element).

### Theme

The app defaults to **dark** theme. Theme is toggled via `data-theme` on `<html>` and persisted in localStorage. `src/lib/theme.ts` manages the theme; an inline script in `index.html` applies the stored theme before React hydrates (to avoid flash).

## Implementation Notes

### Balance calculation

Balances are computed client-side in `src/features/balances/balance.ts` from the full transaction list. The **reset endpoint** (`POST /api/members/:memberId/reset`) recalculates the balance server-side and never trusts the client's value — it creates a `reset_adjustment` transaction to bring the balance to zero.

### Test setup

- Frontend tests use vitest with jsdom; setup file is `src/tests/setup.ts`
- Backend tests use vitest + supertest; `server/tests/globalSetup.ts` runs Prisma migrations against `TEST_DATABASE_URL` before the suite starts; `server/tests/helpers.ts` provides row-cleanup utilities
- Playwright config is in `playwright.config.ts`; global setup in `e2e/global-setup.ts`
