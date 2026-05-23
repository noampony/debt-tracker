import { createApp } from "./lib/app.js";
import { db } from "./lib/db.js";

const PORT = process.env.PORT ?? 3001;

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`[server] running on port ${PORT}`);
});

// Graceful shutdown — handles both Ctrl+C (SIGINT) and process manager signals (SIGTERM)
async function shutdown() {
  server.close();
  await db.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

