import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { authRouter } from "../routes/auth.js";
import { membersRouter } from "../routes/members.js";
import { transactionsRouter } from "../routes/transactions.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check — used by Playwright webServer readiness probe
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  // Auth routes — no auth required
  app.use("/api/auth", authRouter);

  // Protected resource routes
  app.use("/api", membersRouter);
  app.use("/api", transactionsRouter);

  // 404 catch-all
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
  });

  // Generic error handler — never expose stack traces or sensitive data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[server error]", err.message);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

