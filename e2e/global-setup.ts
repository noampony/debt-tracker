import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

/**
 * Playwright global setup: apply Prisma migrations to the E2E test database
 * before any tests run.
 */
export default async function globalSetup() {
  console.log("[e2e global-setup] Migrating E2E database...");
  execSync("npx prisma migrate deploy", {
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL: "file:./prisma/e2e.db" },
    stdio: "pipe",
  });
  console.log("[e2e global-setup] E2E database ready.");
}

