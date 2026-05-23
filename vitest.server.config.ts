import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    globalSetup: "./server/tests/globalSetup.ts",
    env: {
      DATABASE_URL: "file:./test.db",
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

