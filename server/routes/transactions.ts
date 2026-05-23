import { Router } from "express";
import { db } from "../lib/db.js";
import { authMiddleware } from "../lib/middleware.js";
import { createTransactionSchema, updateTransactionSchema } from "../lib/validation.js";
import { calculateMemberBalance } from "../lib/balance.js";
import { encode, decode } from "../lib/codec.js";

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

type TxRow = {
  id: string;
  memberId: string;
  amountMinor: number;
  direction: string;
  title: string;
  notes: string | null;
  transactionDate: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Decode stored-encoded fields before returning a transaction to the client. */
function decodeTransaction(tx: TxRow) {
  return {
    ...tx,
    title: decode(tx.title),
    notes: tx.notes != null ? decode(tx.notes) : tx.notes,
  };
}

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
  res.json(transactions.map(decodeTransaction));
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

  res.json(transactions.map(decodeTransaction));
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
    data: { memberId, amountMinor, direction, title: encode(title), notes: notes != null ? encode(notes) : notes, transactionDate, type },
    select: TX_SELECT,
  });

  res.status(201).json(decodeTransaction(transaction));
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
      title: encode("איפוס חוב"),
      transactionDate: today,
      type: "reset_adjustment",
    },
    select: TX_SELECT,
  });

  res.status(201).json(decodeTransaction(resetTransaction));
});

/**
 * PATCH /api/transactions/:id
 * Updates editable fields of a transaction (amount, direction, title, notes, date).
 * The memberId and type fields are immutable after creation.
 */
router.patch("/transactions/:id", async (req, res) => {
  const { id } = req.params;

  // Verify the transaction belongs to the authenticated user via its member
  const existing = await db.transaction.findFirst({
    where: { id, member: { userId: req.userId } },
    select: TX_SELECT,
  });
  if (!existing) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  const result = updateTransactionSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { amountMinor, direction, title, notes, transactionDate } = result.data;

  const updated = await db.transaction.update({
    where: { id },
    data: { amountMinor, direction, title: encode(title), notes: notes != null ? encode(notes) : notes, transactionDate, updatedAt: new Date() },
    select: TX_SELECT,
  });

  res.json(decodeTransaction(updated));
});

/**
 * DELETE /api/transactions/:id
 * Permanently deletes a single transaction.
 * Authorization: transaction must belong to the authenticated user.
 */
router.delete("/transactions/:id", async (req, res) => {
  const { id } = req.params;

  const existing = await db.transaction.findFirst({
    where: { id, member: { userId: req.userId } },
    select: { id: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  await db.transaction.delete({ where: { id } });
  res.status(204).send();
});

export { router as transactionsRouter };

