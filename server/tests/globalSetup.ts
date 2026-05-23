import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

/**
 * Global setup: apply Prisma migrations to the test database before any tests run.
 */
export default async function setup() {
  execSync("npx prisma migrate deploy", {
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "pipe",
  });
}

