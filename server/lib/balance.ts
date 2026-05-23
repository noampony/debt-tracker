/**
 * Server-side balance logic that mirrors src/features/balances/balance.ts.
 * The server always recalculates balance from stored transactions and never
 * trusts client-supplied balance values.
 */

interface TransactionLike {
  amountMinor: number;
  direction: string;
}

/**
 * Returns the signed balance contribution of a single transaction.
 * Positive means the member owes the user; negative means the user owes the member.
 */
export function getSignedAmount(transaction: TransactionLike): number {
  return transaction.direction === "member_owes_user"
    ? transaction.amountMinor
    : -transaction.amountMinor;
}

/**
 * Sums the signed amounts of all transactions into a single balance for a member.
 */
export function calculateMemberBalance(
  transactions: TransactionLike[],
): number {
  return transactions.reduce((sum, t) => sum + getSignedAmount(t), 0);
}

