import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

function normalizeAppUrl(value: string): string | null {
  const candidate = value.includes("://") ? value : `https://${value}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

// Vercel sets VERCEL_URL automatically on every build (hostname only, no protocol).
// VITE_APP_URL can override it (e.g. for a custom domain).
function resolveAppUrl(): string {
  for (const value of [process.env.VITE_APP_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL]) {
    if (!value) continue;

    const url = normalizeAppUrl(value);
    if (url) return url;
  }

  return "http://localhost:5173";
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "inject-app-url",
      transformIndexHtml(html) {
        return html.replace(/__APP_URL__/g, resolveAppUrl());
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
