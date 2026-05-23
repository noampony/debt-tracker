import type { Transaction } from "./types";

export const resetDebtTitle = "איפוס חוב";

type ResetAdjustmentInput = {
  id: string;
  memberId: string;
  balanceMinor: number;
  transactionDate: string;
  createdAt: string;
  updatedAt?: string;
};

export function createResetAdjustmentTransaction(input: ResetAdjustmentInput): Transaction | null {
  if (input.balanceMinor === 0) {
    return null;
  }

  return {
    id: input.id,
    memberId: input.memberId,
    amountMinor: Math.abs(input.balanceMinor),
    direction: input.balanceMinor > 0 ? "user_owes_member" : "member_owes_user",
    title: resetDebtTitle,
    transactionDate: input.transactionDate,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt ?? input.createdAt,
    type: "reset_adjustment",
  };
}
