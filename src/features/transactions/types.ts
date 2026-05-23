export type TransactionDirection = "member_owes_user" | "user_owes_member";

export type Transaction = {
  id: string;
  memberId: string;
  amountMinor: number;
  direction: TransactionDirection;
  title: string;
  notes?: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  type: "manual" | "reset_adjustment";
};
