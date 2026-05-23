import type { DebtRepository } from "./debtRepository";
import type { Member } from "../features/members/types";
import type { Transaction } from "../features/transactions/types";

const API_BASE = "/api";

async function apiFetch(
  url: string,
  token: string,
  onUnauthorized: () => void,
  options: RequestInit = {},
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (res.status === 401) {
    onUnauthorized();
    throw new Error("Session expired. Please sign in again.");
  }

  return res;
}

function normalizeMember(raw: Record<string, unknown>): Member {
  return {
    id: String(raw.id),
    name: String(raw.name),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
  };
}

function normalizeTransaction(raw: Record<string, unknown>): Transaction {
  return {
    id: String(raw.id),
    memberId: String(raw.memberId),
    amountMinor: Number(raw.amountMinor),
    direction: raw.direction as Transaction["direction"],
    title: String(raw.title),
    notes: raw.notes != null ? String(raw.notes) : undefined,
    transactionDate: String(raw.transactionDate),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    type: raw.type as Transaction["type"],
  };
}

export function createApiDebtRepository(
  token: string,
  onUnauthorized: () => void,
): DebtRepository {
  const req = (url: string, options?: RequestInit) =>
    apiFetch(url, token, onUnauthorized, options);

  return {
    async getMembers(): Promise<Member[]> {
      const res = await req(`${API_BASE}/members`);
      if (!res.ok) throw new Error("Failed to load members");
      const data = (await res.json()) as Record<string, unknown>[];
      return data.map(normalizeMember);
    },

    async createMember(member: Member): Promise<Member> {
      const res = await req(`${API_BASE}/members`, {
        method: "POST",
        body: JSON.stringify({ name: member.name }),
      });
      const body = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(String(body.error ?? "Failed to create member"));
      }
      return normalizeMember(body);
    },

    async updateMember(member: Member): Promise<void> {
      const res = await req(`${API_BASE}/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: member.name }),
      });
      if (!res.ok) {
        const body = (await res.json()) as Record<string, unknown>;
        throw new Error(String(body.error ?? "Failed to update member"));
      }
    },

    async getTransactions(): Promise<Transaction[]> {
      const res = await req(`${API_BASE}/transactions`);
      if (!res.ok) throw new Error("Failed to load transactions");
      const data = (await res.json()) as Record<string, unknown>[];
      return data.map(normalizeTransaction);
    },

    async createTransaction(transaction: Transaction): Promise<Transaction> {
      const payload = {
        memberId: transaction.memberId,
        amountMinor: transaction.amountMinor,
        direction: transaction.direction,
        title: transaction.title,
        notes: transaction.notes,
        transactionDate: transaction.transactionDate,
        type: transaction.type,
      };
      const res = await req(`${API_BASE}/transactions`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(String(body.error ?? "Failed to create transaction"));
      }
      return normalizeTransaction(body);
    },

    async resetMemberDebt(memberId: string): Promise<Transaction | null> {
      const res = await req(`${API_BASE}/members/${memberId}/reset`, { method: "POST" });
      if (res.status === 204) return null;
      const body = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(String(body.error ?? "Failed to reset debt"));
      }
      return normalizeTransaction(body);
    },
  };
}

