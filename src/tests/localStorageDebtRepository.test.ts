import type { Member } from "../features/members/types";
import type { Transaction } from "../features/transactions/types";
import {
  createLocalStorageDebtRepository,
  LOCAL_STORAGE_KEYS,
  LOCAL_STORAGE_SCHEMA_VERSION,
} from "../storage/localStorageDebtRepository";

const member: Member = {
  id: "member-1",
  name: "דני",
  createdAt: "2026-05-23T08:00:00.000Z",
  updatedAt: "2026-05-23T08:00:00.000Z",
};

const transaction: Transaction = {
  id: "transaction-1",
  memberId: member.id,
  amountMinor: 1250,
  direction: "member_owes_user",
  title: "קפה",
  transactionDate: "2026-05-23",
  createdAt: "2026-05-23T08:05:00.000Z",
  updatedAt: "2026-05-23T08:05:00.000Z",
  type: "manual",
};

function createMemoryStorage(): Pick<Storage, "getItem" | "setItem"> {
  const entries = new Map<string, string>();

  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
  };
}

describe("localStorage debt repository", () => {
  it("saves and loads members and transactions with schema versioned collections", async () => {
    const storage = createMemoryStorage();
    const repository = createLocalStorageDebtRepository(storage);

    await repository.createMember(member);
    await repository.createTransaction(transaction);

    const nextRepository = createLocalStorageDebtRepository(storage);

    expect(await nextRepository.getMembers()).toEqual([member]);
    expect(await nextRepository.getTransactions()).toEqual([transaction]);
    expect(JSON.parse(storage.getItem(LOCAL_STORAGE_KEYS.members)!)).toEqual({
      schemaVersion: LOCAL_STORAGE_SCHEMA_VERSION,
      records: [member],
    });
    expect(JSON.parse(storage.getItem(LOCAL_STORAGE_KEYS.transactions)!)).toEqual({
      schemaVersion: LOCAL_STORAGE_SCHEMA_VERSION,
      records: [transaction],
    });
  });

  it("updates an existing member", async () => {
    const repository = createLocalStorageDebtRepository(createMemoryStorage());
    const updatedMember = { ...member, name: "דנה", updatedAt: "2026-05-23T09:00:00.000Z" };

    await repository.createMember(member);
    await repository.updateMember(updatedMember);

    expect(await repository.getMembers()).toEqual([updatedMember]);
  });

  it("returns empty arrays when storage data is missing", async () => {
    const repository = createLocalStorageDebtRepository(createMemoryStorage());

    await expect(repository.getMembers()).resolves.toEqual([]);
    await expect(repository.getTransactions()).resolves.toEqual([]);
  });

  it("safely ignores malformed and invalid stored data", async () => {
    const storage = createMemoryStorage();
    const repository = createLocalStorageDebtRepository(storage);

    storage.setItem(LOCAL_STORAGE_KEYS.members, "{not-json");
    storage.setItem(
      LOCAL_STORAGE_KEYS.transactions,
      JSON.stringify({
        schemaVersion: LOCAL_STORAGE_SCHEMA_VERSION,
        records: [{ ...transaction, amountMinor: "₪12.50" }, transaction],
      }),
    );

    await expect(repository.getMembers()).resolves.toEqual([]);
    await expect(repository.getTransactions()).resolves.toEqual([transaction]);
  });
});
