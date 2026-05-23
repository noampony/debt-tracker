import { Router } from "express";
import { db } from "../lib/db.js";
import { authMiddleware } from "../lib/middleware.js";
import {
  createMemberSchema,
  updateMemberSchema,
} from "../lib/validation.js";
import { encode, decode } from "../lib/codec.js";

/** Decode a raw DB member record before sending it to the client. */
function decodeMember(member: { id: string; name: string; createdAt: Date; updatedAt: Date }) {
  return { ...member, name: decode(member.name) };
}

const router = Router();
router.use(authMiddleware);

// GET /api/members — list the authenticated user's members
router.get("/members", async (req, res) => {
  const members = await db.member.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });
  res.json(members.map(decodeMember));
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

  const encodedName = encode(name);

  const existing = await db.member.findFirst({
    where: { userId: req.userId, name: encodedName },
  });
  if (existing) {
    res.status(409).json({ error: "A member with this name already exists" });
    return;
  }

  const member = await db.member.create({
    data: { userId: req.userId, name: encodedName },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });

  res.status(201).json(decodeMember(member));
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

  const encodedName = encode(name);

  const duplicate = await db.member.findFirst({
    where: { userId: req.userId, name: encodedName, NOT: { id: memberId } },
  });
  if (duplicate) {
    res.status(409).json({ error: "A member with this name already exists" });
    return;
  }

  const member = await db.member.update({
    where: { id: memberId },
    data: { name: encodedName, updatedAt: new Date() },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });

  res.json(decodeMember(member));
});

// DELETE /api/members/:id — delete a member and all their transactions
router.delete("/members/:id", async (req, res) => {
  const memberId = req.params.id;

  const existing = await db.member.findFirst({
    where: { id: memberId, userId: req.userId },
    select: { id: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  // Delete transactions first (FK constraint: Transaction → Member ON DELETE RESTRICT)
  await db.transaction.deleteMany({ where: { memberId } });
  await db.member.delete({ where: { id: memberId } });

  res.status(204).send();
});

export { router as membersRouter };
