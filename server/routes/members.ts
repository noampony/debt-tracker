import { Router } from "express";
import { db } from "../lib/db.js";
import { authMiddleware } from "../lib/middleware.js";
import {
  createMemberSchema,
  updateMemberSchema,
} from "../lib/validation.js";

const router = Router();
router.use(authMiddleware);

// GET /api/members — list the authenticated user's members
router.get("/members", async (req, res) => {
  const members = await db.member.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });
  res.json(members);
});

// POST /api/members — create a new member
router.post("/members", async (req, res) => {
  const result = createMemberSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { name } = result.data;
  if (!name.trim()) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  const existing = await db.member.findFirst({
    where: { userId: req.userId, name },
  });
  if (existing) {
    res.status(409).json({ error: "A member with this name already exists" });
    return;
  }

  const member = await db.member.create({
    data: { userId: req.userId, name },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });

  res.status(201).json(member);
});

// PATCH /api/members/:id — rename a member
router.patch("/members/:id", async (req, res) => {
  const memberId = req.params.id;

  const existing = await db.member.findFirst({
    where: { id: memberId, userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  const result = updateMemberSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { name } = result.data;

  const duplicate = await db.member.findFirst({
    where: { userId: req.userId, name, NOT: { id: memberId } },
  });
  if (duplicate) {
    res.status(409).json({ error: "A member with this name already exists" });
    return;
  }

  const member = await db.member.update({
    where: { id: memberId },
    data: { name, updatedAt: new Date() },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });

  res.json(member);
});

export { router as membersRouter };

