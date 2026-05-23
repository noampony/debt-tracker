import type { DebtRepository } from "./debtRepository";
import type { Member } from "../features/members/types";
import type { Transaction, TransactionDirection } from "../features/transactions/types";
import { createId } from "../lib/ids";

export const LOCAL_STORAGE_SCHEMA_VERSION = 1;

export const LOCAL_STORAGE_KEYS = {
  members: "hebrew-debt-tracker:v1:members",
  transactions: "hebrew-debt-tracker:v1:transactions",
} as const;

type StorageCollection<TRecord> = {
  schemaVersion: number;
  records: TRecord[];
};

type BrowserStorage = Pick<Storage, "getItem" | "setItem">;

type CollectionKey = keyof typeof LOCAL_STORAGE_KEYS;

const transactionDirections: readonly TransactionDirection[] = ["member_owes_user", "user_owes_member"];
const transactionTypes: readonly Transaction["type"][] = ["manual", "reset_adjustment"];

function createEmptyCollection<TRecord>(): StorageCollection<TRecord> {
  return {
    schemaVersion: LOCAL_STORAGE_SCHEMA_VERSION,
    records: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isMember(value: unknown): value is Member {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.createdAt) &&
    isNonEmptyString(value.updatedAt)
  );
}

function isTransaction(value: unknown): value is Transaction {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.memberId) &&
    isPositiveInteger(value.amountMinor) &&
    transactionDirections.includes(value.direction as TransactionDirection) &&
    isNonEmptyString(value.title) &&
    isOptionalString(value.notes) &&
    isNonEmptyString(value.transactionDate) &&
    isNonEmptyString(value.createdAt) &&
    isNonEmptyString(value.updatedAt) &&
    transactionTypes.includes(value.type as Transaction["type"])
  );
}

function resolveBrowserStorage(): BrowserStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readCollection<TRecord>(
  storage: BrowserStorage | null,
  key: CollectionKey,
  isValidRecord: (value: unknown) => value is TRecord,
): StorageCollection<TRecord> {
  if (!storage) {
    return createEmptyCollection();
  }

  try {
    const storedValue = storage.getItem(LOCAL_STORAGE_KEYS[key]);

    if (!storedValue) {
      return createEmptyCollection();
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (!isRecord(parsedValue) || parsedValue.schemaVersion !== LOCAL_STORAGE_SCHEMA_VERSION) {
      return createEmptyCollection();
    }

    if (!Array.isArray(parsedValue.records)) {
      return createEmptyCollection();
    }

    return {
      schemaVersion: LOCAL_STORAGE_SCHEMA_VERSION,
      records: parsedValue.records.filter(isValidRecord),
    };
  } catch {
    return createEmptyCollection();
  }
}

function writeCollection<TRecord>(
  storage: BrowserStorage | null,
  key: CollectionKey,
  collection: StorageCollection<TRecord>,
): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(LOCAL_STORAGE_KEYS[key], JSON.stringify(collection));
  } catch {
    // Storage may be unavailable or full. Keep personal financial data out of logs.
  }
}

function copyMember(member: Member): Member {
  return { ...member };
}

function copyTransaction(transaction: Transaction): Transaction {
  return { ...transaction };
}

export function createLocalStorageDebtRepository(
  storage: BrowserStorage | null = resolveBrowserStorage(),
): DebtRepository {
  return {
    async getMembers() {
      return readCollection(storage, "members", isMember).records.map(copyMember);
    },

    async createMember(member) {
      const collection = readCollection(storage, "members", isMember);
      writeCollection(storage, "members", {
        ...collection,
        records: [...collection.records, copyMember(member)],
      });
      return copyMember(member);
    },

    async updateMember(member) {
      const collection = readCollection(storage, "members", isMember);
      writeCollection(storage, "members", {
        ...collection,
        records: collection.records.map((storedMember) =>
          storedMember.id === member.id ? copyMember(member) : storedMember,
        ),
      });
    },

    async getTransactions() {
      return readCollection(storage, "transactions", isTransaction).records.map(copyTransaction);
    },

    async createTransaction(transaction) {
      const collection = readCollection(storage, "transactions", isTransaction);
      writeCollection(storage, "transactions", {
        ...collection,
        records: [...collection.records, copyTransaction(transaction)],
      });
      return copyTransaction(transaction);
    },

    async resetMemberDebt(memberId) {
      const allTransactions = readCollection(storage, "transactions", isTransaction).records;
      const balanceMinor = allTransactions
        .filter((tx) => tx.memberId === memberId)
        .reduce((sum, tx) => sum + (tx.direction === "member_owes_user" ? tx.amountMinor : -tx.amountMinor), 0);

      if (balanceMinor === 0) return null;

      const now = new Date().toISOString();
      const today = now.split("T")[0];
      const resetTx: Transaction = {
        id: createId(),
        memberId,
        amountMinor: Math.abs(balanceMinor),
        direction: balanceMinor > 0 ? "user_owes_member" : "member_owes_user",
        title: "איפוס חוב",
        transactionDate: today,
        createdAt: now,
        updatedAt: now,
        type: "reset_adjustment",
      };

      const collection = readCollection(storage, "transactions", isTransaction);
      writeCollection(storage, "transactions", {
        ...collection,
        records: [...collection.records, copyTransaction(resetTx)],
      });
      return copyTransaction(resetTx);
    },
  };
}

export const localStorageDebtRepository = createLocalStorageDebtRepository();
