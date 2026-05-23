import type { Member } from "../features/members/types";
import type { Transaction } from "../features/transactions/types";

export type DebtRepository = {
  getMembers(): Promise<Member[]>;
  createMember(member: Member): Promise<Member>;
  updateMember(member: Member): Promise<void>;
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: Transaction): Promise<Transaction>;
  /** Reset a member's debt to zero by creating a balancing transaction server-side.
   * Returns the created reset transaction, or null if the balance was already zero. */
  resetMemberDebt(memberId: string): Promise<Transaction | null>;
};
