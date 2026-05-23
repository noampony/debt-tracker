import { Router } from "express";
import { db } from "../lib/db.js";
import { hashPassword, verifyPassword, signToken } from "../lib/auth.js";
import { registerSchema, loginSchema } from "../lib/validation.js";
import { authMiddleware } from "../lib/middleware.js";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { email, password } = result.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: { email: normalizedEmail, passwordHash },
    select: { id: true, email: true, tokenVersion: true },
  });

  const token = signToken(user.id, user.tokenVersion);
  res.status(201).json({ token, user: { id: user.id, email: user.email } });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { email, password } = result.data;
  const normalizedEmail = email.toLowerCase();

  const user = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken(user.id, user.tokenVersion);
  res.json({ token, user: { id: user.id, email: user.email } });
});

// POST /api/auth/logout — increments tokenVersion, invalidating all existing tokens
router.post("/logout", authMiddleware, async (req, res) => {
  await db.user.update({
    where: { id: req.userId },
    data: { tokenVersion: { increment: 1 } },
  });
  res.status(204).send();
});

export { router as authRouter };


