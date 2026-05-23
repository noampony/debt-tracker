import { createApp } from "./lib/app.js";
import { db } from "./lib/db.js";

const PORT = process.env.PORT ?? 3001;

const app = createApp();

app.listen(PORT, () => {
  console.log(`[server] running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await db.$disconnect();
  process.exit(0);
});

