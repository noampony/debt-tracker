import type { Transaction, TransactionDirection } from "../transactions/types";

export type MemberBalance = {
  memberId: string;
  balanceMinor: number;
};

export type BalanceSummary = {
  memberBalances: MemberBalance[];
  totalOwedToUserMinor: number;
  totalUserOwesMinor: number;
  netBalanceMinor: number;
};

const POSITIVE_DIRECTIONS = new Set<TransactionDirection>([
  "member_owes_user",
  "user_returned_to_member",
]);

export function calculateSignedTransactionAmount(transaction: Transaction): number {
  return POSITIVE_DIRECTIONS.has(transaction.direction) ? transaction.amountMinor : -transaction.amountMinor;
}

export function calculateMemberBalance(memberId: string, transactions: Transaction[]): number {
  return transactions.reduce((balanceMinor, transaction) => {
    if (transaction.memberId !== memberId) {
      return balanceMinor;
    }

    return balanceMinor + calculateSignedTransactionAmount(transaction);
  }, 0);
}

export function calculateBalanceSummary(memberIds: string[], transactions: Transaction[]): BalanceSummary {
  const memberBalances = memberIds.map((memberId) => ({
    memberId,
    balanceMinor: calculateMemberBalance(memberId, transactions),
  }));

  return memberBalances.reduce<BalanceSummary>(
    (summary, memberBalance) => {
      if (memberBalance.balanceMinor > 0) {
        summary.totalOwedToUserMinor += memberBalance.balanceMinor;
      }

      if (memberBalance.balanceMinor < 0) {
        summary.totalUserOwesMinor += Math.abs(memberBalance.balanceMinor);
      }

      summary.netBalanceMinor += memberBalance.balanceMinor;

      return summary;
    },
    {
      memberBalances,
      totalOwedToUserMinor: 0,
      totalUserOwesMinor: 0,
      netBalanceMinor: 0,
    },
  );
}
