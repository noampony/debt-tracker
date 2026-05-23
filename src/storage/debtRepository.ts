import type { Member } from "../features/members/types";
import type { Transaction } from "../features/transactions/types";

export type DebtRepository = {
  getMembers(): Promise<Member[]>;
  createMember(member: Member): Promise<void>;
  updateMember(member: Member): Promise<void>;
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: Transaction): Promise<void>;
};
