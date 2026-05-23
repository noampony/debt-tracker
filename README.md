# Hebrew Debt Tracker

Mobile-first Hebrew RTL web app for tracking informal debts with friends and
family. The app uses a React/Vite frontend and an Express/Prisma API.

## Stack

- Frontend: React 19, TypeScript, Vite
- Backend: Express 5, Prisma, Zod
- Auth: JWT with bcrypt password hashing
- Local database: PostgreSQL
- Production hosting: Vercel static hosting + Vercel Functions
- Production database: hosted PostgreSQL

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create local environment variables:

```bash
cp .env.example .env
```

3. Fill in `.env` with PostgreSQL URLs:

```env
DATABASE_URL="postgresql://..."
TEST_DATABASE_URL="postgresql://..."
E2E_DATABASE_URL="postgresql://..."
JWT_SECRET="local-development-secret"
PORT=3001
```

Use separate databases for app development and automated tests. Server tests
delete rows, so `TEST_DATABASE_URL` must never point at production.

4. Apply local database migrations:

```bash
npm run db:migrate
```

5. Start the API and frontend in separate terminals:

```bash
npm run dev:server
npm run dev
```

The Vite dev server proxies `/api` requests to the local Express server on
`http://localhost:3001`.

## Commands

```bash
npm run lint
npm run typecheck
npm run typecheck:server
npm test
npm run test:server
npm run test:e2e
npm run build
```

## Environment Variables

| Variable       | Required | Used by             | Notes |
|----------------|----------|---------------------|-------|
| `DATABASE_URL` | Yes      | Prisma/API          | PostgreSQL URL for local app runtime and Vercel production |
| `JWT_SECRET`   | Yes      | API auth            | Use a cryptographically strong value |
| `PORT`         | No       | Local Express only  | Defaults to `3001`; not used by Vercel |
| `TEST_DATABASE_URL` | Yes for server tests | Vitest server setup | Dedicated PostgreSQL test DB; tests delete rows |
| `E2E_DATABASE_URL` | No | Playwright setup | Dedicated E2E DB; falls back to `TEST_DATABASE_URL` |

Do not commit real `.env` values. Vercel production values must be configured
in the Vercel project settings.

## Production Build

```bash
npm run build
```

The production build runs TypeScript project checks and emits the Vite frontend
to `dist`.

## Vercel Deployment

The repository includes `vercel.json` with these settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- API runtime: Express app exported from `api/index.ts` as a Vercel Function
- Routes: `/api/*` and `/health` are handled by the API function; all other
  paths serve the Vite SPA.

Before deploying production data, use a hosted PostgreSQL database and set:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require
JWT_SECRET=<strong random secret>
```

The checked-in Prisma schema and migration history are PostgreSQL-oriented.
After setting `DATABASE_URL`, run:

```bash
npm run db:migrate
```

Run migrations against the production database before using the deployed app.

## Local Testing After PostgreSQL Migration

Use the normal two-terminal workflow:

```bash
npm run dev:server
npm run dev
```

Then open the Vite URL, usually `http://localhost:5173`. The frontend proxies
`/api/*` to the local backend on `http://localhost:3001`.

For server tests, set `TEST_DATABASE_URL` to a dedicated PostgreSQL database:

```bash
TEST_DATABASE_URL="postgresql://..." npm run test:server
```

## Deployment Smoke Test

After deploying to Vercel:

1. Open the deployed app URL and confirm the Hebrew RTL UI loads.
2. Open `/health` and confirm it returns `{"status":"ok"}`.
3. Register or log in.
4. Add a member.
5. Add a transaction.
6. Confirm the balance appears correctly in Hebrew.
7. Reset the member debt and confirm a reset adjustment appears in history.
