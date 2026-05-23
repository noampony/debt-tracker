import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function readEnvValue(name: string) {
  if (process.env[name]) return process.env[name];

  const envPath = path.join(projectRoot, ".env");
  if (!existsSync(envPath)) return undefined;

  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${name}=`));
  if (!line) return undefined;

  return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

/**
 * Playwright global setup: apply Prisma migrations to the E2E test database
 * before any tests run.
 */
export default async function globalSetup() {
  const databaseUrl = readEnvValue("E2E_DATABASE_URL") ?? readEnvValue("TEST_DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("E2E_DATABASE_URL or TEST_DATABASE_URL must be set to a dedicated PostgreSQL database URL before running E2E tests.");
  }

  console.log("[e2e global-setup] Migrating E2E database...");
  execSync("npx prisma migrate deploy", {
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  });
  console.log("[e2e global-setup] E2E database ready.");
}
