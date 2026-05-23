import { Router } from "express";
import { db } from "../lib/db.js";
import { authMiddleware } from "../lib/middleware.js";
import { createTransactionSchema } from "../lib/validation.js";
import { calculateMemberBalance } from "../lib/balance.js";

const router = Router();
router.use(authMiddleware);

// Reusable select shape for transaction responses
const TX_SELECT = {
  id: true,
  memberId: true,
  amountMinor: true,
  direction: true,
  title: true,
  notes: true,
  transactionDate: true,
  type: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * GET /api/transactions
 * Returns all transactions across all of the authenticated user's members.
 */
router.get("/transactions", async (req, res) => {
  const transactions = await db.transaction.findMany({
    where: { member: { userId: req.userId } },
    orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
    select: TX_SELECT,
  });
  res.json(transactions);
});

/**
 * GET /api/members/:memberId/transactions
 * Returns all transactions for a member, sorted newest-first.
 * Requires the member to belong to the authenticated user.
 */
router.get("/members/:memberId/transactions", async (req, res) => {
  const { memberId } = req.params;

  const member = await db.member.findFirst({
    where: { id: memberId, userId: req.userId },
  });
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  const transactions = await db.transaction.findMany({
    where: { memberId },
    orderBy: { transactionDate: "desc" },
    select: TX_SELECT,
  });

  res.json(transactions);
});

/**
 * POST /api/transactions
 * Creates a new transaction. Server validates that the target member
 * belongs to the authenticated user; the balance is not trusted from the client.
 */
router.post("/transactions", async (req, res) => {
  const result = createTransactionSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { memberId, amountMinor, direction, title, notes, transactionDate, type } =
    result.data;

  const member = await db.member.findFirst({
    where: { id: memberId, userId: req.userId },
  });
  if (!member) {
    res.status(404).json({ error: "Member not found or access denied" });
    return;
  }

  const transaction = await db.transaction.create({
    data: { memberId, amountMinor, direction, title, notes, transactionDate, type },
    select: TX_SELECT,
  });

  res.status(201).json(transaction);
});

/**
 * POST /api/members/:memberId/reset
 * Server recalculates the member's balance from all stored transactions
 * and creates a balancing reset_adjustment transaction.
 * Returns 204 if balance is already zero (no-op).
 */
router.post("/members/:memberId/reset", async (req, res) => {
  const { memberId } = req.params;

  const member = await db.member.findFirst({
    where: { id: memberId, userId: req.userId },
  });
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  // Always recalculate from DB — never trust the client's balance value
  const transactions = await db.transaction.findMany({
    where: { memberId },
    select: { amountMinor: true, direction: true },
  });

  const balanceMinor = calculateMemberBalance(transactions);

  if (balanceMinor === 0) {
    res.status(204).send();
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const resetTransaction = await db.transaction.create({
    data: {
      memberId,
      amountMinor: Math.abs(balanceMinor),
      direction: balanceMinor > 0 ? "user_owes_member" : "member_owes_user",
      title: "איפוס חוב",
      transactionDate: today,
      type: "reset_adjustment",
    },
    select: TX_SELECT,
  });

  res.status(201).json(resetTransaction);
});

export { router as transactionsRouter };

