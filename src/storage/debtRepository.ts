import type { Member } from "../features/members/types";
import type { Transaction } from "../features/transactions/types";

export type DebtRepository = {
  getMembers(): Promise<Member[]>;
  createMember(member: Member): Promise<Member>;
  updateMember(member: Member): Promise<void>;
  deleteMember(memberId: string): Promise<void>;
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: Transaction): Promise<Transaction>;
  updateTransaction(transaction: Transaction): Promise<Transaction>;
  deleteTransaction(transactionId: string): Promise<void>;
  /** Reset a member's debt to zero by creating a balancing transaction server-side.
   * Returns the created reset transaction, or null if the balance was already zero. */
  resetMemberDebt(memberId: string): Promise<Transaction | null>;
};
