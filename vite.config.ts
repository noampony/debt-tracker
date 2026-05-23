import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Vercel sets VERCEL_URL automatically on every build (hostname only, no protocol).
// VITE_APP_URL can override it (e.g. for a custom domain).
function resolveAppUrl(): string {
  if (process.env.VITE_APP_URL) return process.env.VITE_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:5173";
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "inject-app-url",
      transformIndexHtml(html) {
        return html.replace(/%VITE_APP_URL%/g, resolveAppUrl());
      },
    },
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/tests/setup.ts",
    include: ["src/tests/**/*.test.{ts,tsx}"],
  },
});
