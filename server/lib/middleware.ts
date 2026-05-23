import { Request, Response, NextFunction } from "express";
import { verifyToken } from "./auth.js";
import { db } from "./db.js";

/**
 * Express middleware that validates a Bearer JWT and attaches userId to req.
 * Also verifies tokenVersion against the database to support server-side sign-out.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = authHeader.slice(7);
  let userId: string;
  let tokenVersion: number;

  try {
    ({ userId, tokenVersion } = verifyToken(token));
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  // Verify tokenVersion against DB to support sign-out invalidation
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tokenVersion: true },
  });

  if (!user || user.tokenVersion !== tokenVersion) {
    res.status(401).json({ error: "Token has been invalidated" });
    return;
  }

  req.userId = userId;
  next();
}


