import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

function readEnvValue(name: string) {
  if (process.env[name]) return process.env[name];
  if (!existsSync(".env")) return undefined;

  const line = readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${name}=`));
  if (!line) return undefined;

  return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

const testDatabaseUrl = readEnvValue("TEST_DATABASE_URL") ?? "__missing_test_database_url__";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    globalSetup: "./server/tests/globalSetup.ts",
    env: {
      DATABASE_URL: testDatabaseUrl,
      TEST_DATABASE_URL: testDatabaseUrl,
      JWT_SECRET: "test-jwt-secret-for-testing-only",
      NODE_ENV: "test",
    },
    include: ["server/tests/**/*.test.ts"],
    // Run test files sequentially to avoid concurrent DB conflicts
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
