# Hebrew Debt Tracker — Backend Architecture

## 9.1 Backend Architecture Decision

### Overview

The app uses a **separate Express backend module** in the `server/` directory.
The frontend (React + Vite) communicates with the backend over HTTP REST API.
For local development, `server/index.ts` starts a long-running Express server.
For Vercel production, `api/index.ts` exports the same Express app as a Vercel Function.

### Why a Separate Backend?

- The frontend uses **Vite** (not Next.js), so server actions or file-based routing are not available.
- A dedicated backend provides a clean separation of concerns and can run as a local Node server or a Vercel Function.
- The `DebtRepository` interface in `src/storage/debtRepository.ts` allows the frontend to swap between local storage and API-backed storage without UI changes.

### Stack

| Layer        | Technology                    |
|--------------|-------------------------------|
| Frontend     | React 19 + TypeScript + Vite  |
| Backend      | Express v5 + TypeScript       |
| ORM          | Prisma v5                     |
| Database     | PostgreSQL                            |
| Auth         | JWT (jsonwebtoken) + bcrypt   |
| Validation   | Zod                           |
| Test Runner  | Vitest + Supertest            |
| Runtime      | Local Node.js via `tsx` / Vercel Functions |

### Data Flow

```
Browser (React app)
  ↕ HTTPS / fetch
Express API (server/ locally, api/index.ts on Vercel)
  ↕ Prisma Client
PostgreSQL
```

---

## Vercel Deployment

Production hosting is Vercel:

- The React/Vite frontend is built with `npm run build` and served from `dist`.
- `vercel.json` declares the Vite framework preset, build command, output directory, and rewrites.
- `/api/*` and `/health` are routed to `api/index.ts`.
- `api/index.ts` exports `createApp()` without calling `listen()`, which lets Vercel run the Express app as a serverless function.
- `server/index.ts` remains the local/traditional Node entrypoint and is not used by Vercel Functions.
- No secrets are stored in `vercel.json`; production values are configured in Vercel environment variables.

---

## Database Schema

### `User`
| Column         | Type     | Notes                    |
|----------------|----------|--------------------------|
| id             | cuid     | Primary key              |
| email          | String   | Unique, lowercased       |
| passwordHash   | String   | bcrypt hash              |
| createdAt      | DateTime |                          |
| updatedAt      | DateTime |                          |

### `Member`
| Column    | Type     | Notes                    |
|-----------|----------|--------------------------|
| id        | cuid     | Primary key              |
| userId    | String   | FK → User                |
| name      | String   |                          |
| createdAt | DateTime |                          |
| updatedAt | DateTime |                          |

Unique constraint: `(userId, name)` — duplicate names are rejected per user.

### `Transaction`
| Column          | Type     | Notes                                              |
|-----------------|----------|----------------------------------------------------|
| id              | cuid     | Primary key                                        |
| memberId        | String   | FK → Member                                        |
| amountMinor     | Int      | Amount in agorot (integer minor units)             |
| direction       | String   | `member_owes_user` \| `user_owes_member`           |
| title           | String   | Reason / description                               |
| notes           | String?  | Optional                                           |
| transactionDate | String   | ISO date YYYY-MM-DD                                |
| type            | String   | `manual` \| `reset_adjustment`                     |
| createdAt       | DateTime |                                                    |
| updatedAt       | DateTime |                                                    |

---

## Money Storage

Amounts are stored as **integer agorot** (`amountMinor: Int`).  
100 agorot = ₪1.  
This avoids floating-point rounding errors.

---

## Reset Behavior

The reset endpoint (`POST /api/members/:memberId/reset`):
1. Queries **all stored transactions** for the member from the database.
2. Calculates the balance server-side — the client's balance is **never trusted**.
3. If balance is 0, returns `204 No Content` (no-op).
4. Otherwise, creates a `reset_adjustment` transaction that brings balance to exactly 0.
5. The original transactions are preserved in history.

---

## Section 11 — Transaction Maintenance Decisions

### 11.2a Transaction Editing

**Decision: Not included before deployment.**

Reasoning:
- Transaction editing is explicitly out of scope for Phase 1 (see `docs/SPECS.md`, section 4.2.4).
- The core design principle is auditability and history preservation.
- Editing would silently change historical records, making the audit trail unreliable.

Intended alternative:
- Users who entered a wrong amount can add a **correction transaction** (e.g., if they over-recorded ₪100, they add a `user_owes_member` transaction for ₪100 to cancel it, then add the correct amount).
- The "Reset Debt" flow provides a one-tap way to zero out and re-enter correct totals.

If implemented in a future version:
- Editing must update the member balance atomically on the backend.
- The transaction must record an `updatedAt` timestamp so history is auditable.
- Tests must cover edit validation, balance recalculation, and audit trail preservation.

### 11.2b Transaction Deletion

**Decision: Not included before deployment.**

Reasoning:
- Deletion is explicitly out of scope for Phase 1 (see `docs/SPECS.md`, section 4.2.5).
- Permanently removing records contradicts the core design goal of preserving a full debt history.

Intended alternative:
- Users who want to remove the effect of a transaction can add a **correction transaction** in the opposite direction for the same amount.
- The "Reset Debt" flow provides a clean slate with history preserved.

If implemented in a future version:
- Deletion must require a confirmation dialog.
- Consider soft-delete (marking the transaction as deleted) rather than permanent removal.
- Tests must cover the confirmation flow, balance recalculation after deletion, and the soft-delete audit trail.

---

## Authentication

- Users register with email + password.
- Passwords are hashed with **bcrypt** (12 rounds in production, 1 in test).
- Login returns a **JWT token** valid for 30 days.
- All protected routes require `Authorization: Bearer <token>`.
- The `authMiddleware` verifies the JWT and attaches `req.userId` to every request.

---

## Per-User Data Isolation

- Every `Member` has a `userId` FK.
- All DB queries for members and transactions are scoped to `req.userId`.
- Any attempt to access or modify another user's members/transactions returns `404`.

---

## API Reference

### Auth

| Method | Path                   | Description      |
|--------|------------------------|------------------|
| POST   | `/api/auth/register`   | Register user    |
| POST   | `/api/auth/login`      | Login            |

### Members (protected)

| Method | Path                 | Description              |
|--------|----------------------|--------------------------|
| GET    | `/api/members`       | List user's members      |
| POST   | `/api/members`       | Create member            |
| PATCH  | `/api/members/:id`   | Rename member            |

### Transactions (protected)

| Method | Path                                   | Description                              |
|--------|----------------------------------------|------------------------------------------|
| GET    | `/api/members/:memberId/transactions`  | List member's transactions               |
| POST   | `/api/transactions`                    | Create transaction                       |
| POST   | `/api/members/:memberId/reset`         | Server-calculated reset (creates adj.)   |

---

## Environment Variables

| Variable         | Required | Description                                      |
|------------------|----------|--------------------------------------------------|
| `DATABASE_URL`   | Yes      | PostgreSQL URL for local app runtime and Vercel production |
| `JWT_SECRET`     | Yes      | Random secret for signing JWT tokens             |
| `PORT`           | No       | Local server port (default: `3001`; not used by Vercel Functions) |
| `TEST_DATABASE_URL` | Yes for server tests | Dedicated PostgreSQL test database; tests delete rows |
| `E2E_DATABASE_URL` | No | Dedicated PostgreSQL E2E database; falls back to `TEST_DATABASE_URL` |

**Do not commit real values.** See `.env.example` for the template.

---

## Migration

```bash
# Apply migrations to local development database
npm run db:migrate

# Apply migrations to a dedicated test database
TEST_DATABASE_URL="postgresql://..." npm run test:server
```

---

## Running the Server

```bash
# Development (with hot-reload)
npm run dev:server

# Production
npm run start:server
```

---

## Running Backend Tests

```bash
npm run test:server
```

Tests require a dedicated PostgreSQL database through `TEST_DATABASE_URL`. The test setup applies migrations automatically and test helpers delete rows, so this URL must never point at production.

---

## Production Deployment Notes

For Vercel production:
- Set `DATABASE_URL` to a hosted PostgreSQL connection string.
- Set `JWT_SECRET` to a cryptographically random 32+ byte hex string.
- Run `npm run db:migrate` against the production database after `DATABASE_URL` is configured.
- Verify `/health`, authentication, member creation, transaction creation, and reset adjustment behavior after deployment.
