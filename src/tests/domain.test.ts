import {
  calculateBalanceSummary,
  calculateMemberBalance,
  calculateSignedTransactionAmount,
} from "../features/balances/balance";
import type { Member } from "../features/members/types";
import type { Transaction } from "../features/transactions/types";
import { createResetAdjustmentTransaction } from "../features/transactions/reset";
import { formatDate, getTodayDateIso } from "../lib/dates";
import { formatIls, parseIlsInputToMinor } from "../lib/money";

const baseTransaction: Transaction = {
  id: "transaction-1",
  memberId: "member-1",
  amountMinor: 1000,
  direction: "member_owes_user",
  title: "ארוחה",
  transactionDate: "2026-05-23",
  createdAt: "2026-05-23T08:00:00.000Z",
  updatedAt: "2026-05-23T08:00:00.000Z",
  type: "manual",
};

const baseMember: Member = {
  id: "member-1",
  name: "דני",
  createdAt: "2026-05-23T08:00:00.000Z",
  updatedAt: "2026-05-23T08:00:00.000Z",
};

describe("money utilities", () => {
  it("parses valid ILS input to integer minor units", () => {
    expect(parseIlsInputToMinor("10")).toBe(1000);
    expect(parseIlsInputToMinor("10.5")).toBe(1050);
    expect(parseIlsInputToMinor("10,55")).toBe(1055);
    expect(parseIlsInputToMinor(" ₪42.01 ")).toBe(4201);
  });

  it("rejects empty, zero, negative, and invalid ILS input", () => {
    expect(parseIlsInputToMinor("")).toBeNull();
    expect(parseIlsInputToMinor("0")).toBeNull();
    expect(parseIlsInputToMinor("-10")).toBeNull();
    expect(parseIlsInputToMinor("abc")).toBeNull();
    expect(parseIlsInputToMinor("10.999")).toBeNull();
    expect(parseIlsInputToMinor("1e3")).toBeNull();
  });

  it("formats ILS values with Hebrew locale currency formatting", () => {
    const formatter = new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
    });

    expect(formatIls(12345)).toBe(formatter.format(123.45));
    expect(formatIls(-5000)).toBe(formatter.format(-50));
    expect(formatIls(0)).toBe(formatter.format(0));
  });
});

describe("date utilities", () => {
  it("formats dates with the Hebrew locale", () => {
    expect(formatDate("2026-05-23")).toBe(
      new Intl.DateTimeFormat("he-IL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(2026, 4, 23)),
    );
  });

  it("returns an empty string for invalid dates", () => {
    expect(formatDate("2026-02-30")).toBe("");
    expect(formatDate("not-a-date")).toBe("");
  });

  it("returns an ISO-compatible current date", () => {
    expect(getTodayDateIso(new Date(2026, 4, 23, 15, 30))).toBe("2026-05-23");
  });
});

describe("balance logic", () => {
  it("calculates signed transaction amounts from the direction", () => {
    expect(calculateSignedTransactionAmount({ ...baseTransaction, direction: "member_owes_user" })).toBe(1000);
    expect(calculateSignedTransactionAmount({ ...baseTransaction, direction: "user_owes_member" })).toBe(-1000);
  });

  it("calculates positive, negative, mixed, and zero member balances", () => {
    const transactions: Transaction[] = [
      { ...baseTransaction, id: "positive", memberId: "positive-member", amountMinor: 5000 },
      {
        ...baseTransaction,
        id: "negative",
        memberId: "negative-member",
        amountMinor: 3000,
        direction: "user_owes_member",
      },
      { ...baseTransaction, id: "mixed-positive", memberId: "mixed-member", amountMinor: 7000 },
      {
        ...baseTransaction,
        id: "mixed-negative",
        memberId: "mixed-member",
        amountMinor: 2000,
        direction: "user_owes_member",
      },
      { ...baseTransaction, id: "zero-positive", memberId: "zero-member", amountMinor: 1500 },
      {
        ...baseTransaction,
        id: "zero-negative",
        memberId: "zero-member",
        amountMinor: 1500,
        direction: "user_owes_member",
      },
      { ...baseTransaction, id: "other", memberId: "other-member", amountMinor: 9999 },
    ];

    expect(calculateMemberBalance("positive-member", transactions)).toBe(5000);
    expect(calculateMemberBalance("negative-member", transactions)).toBe(-3000);
    expect(calculateMemberBalance("mixed-member", transactions)).toBe(5000);
    expect(calculateMemberBalance("zero-member", transactions)).toBe(0);
    expect(calculateMemberBalance(baseMember.id, transactions)).toBe(0);
  });

  it("calculates aggregate summary across member balances", () => {
    const transactions: Transaction[] = [
      { ...baseTransaction, id: "member-1-positive", memberId: "member-1", amountMinor: 5000 },
      {
        ...baseTransaction,
        id: "member-2-negative",
        memberId: "member-2",
        amountMinor: 3000,
        direction: "user_owes_member",
      },
      { ...baseTransaction, id: "member-3-positive", memberId: "member-3", amountMinor: 1000 },
      {
        ...baseTransaction,
        id: "member-3-negative",
        memberId: "member-3",
        amountMinor: 1000,
        direction: "user_owes_member",
      },
    ];

    expect(calculateBalanceSummary(["member-1", "member-2", "member-3"], transactions)).toEqual({
      memberBalances: [
        { memberId: "member-1", balanceMinor: 5000 },
        { memberId: "member-2", balanceMinor: -3000 },
        { memberId: "member-3", balanceMinor: 0 },
      ],
      totalOwedToUserMinor: 5000,
      totalUserOwesMinor: 3000,
      netBalanceMinor: 2000,
    });
  });
});

describe("reset debt logic", () => {
  it("creates an adjustment for positive balances that brings the member balance to zero", () => {
    const resetTransaction = createResetAdjustmentTransaction({
      id: "reset-1",
      memberId: "member-1",
      balanceMinor: 2500,
      transactionDate: "2026-05-23",
      createdAt: "2026-05-23T08:00:00.000Z",
    });

    expect(resetTransaction).toMatchObject({
      amountMinor: 2500,
      direction: "user_owes_member",
      title: "איפוס חוב",
      type: "reset_adjustment",
    });
    expect(calculateMemberBalance("member-1", [{ ...baseTransaction, amountMinor: 2500 }, resetTransaction!])).toBe(0);
  });

  it("creates an adjustment for negative balances that brings the member balance to zero", () => {
    const resetTransaction = createResetAdjustmentTransaction({
      id: "reset-2",
      memberId: "member-1",
      balanceMinor: -2500,
      transactionDate: "2026-05-23",
      createdAt: "2026-05-23T08:00:00.000Z",
    });

    expect(resetTransaction).toMatchObject({
      amountMinor: 2500,
      direction: "member_owes_user",
      title: "איפוס חוב",
      type: "reset_adjustment",
    });
    expect(
      calculateMemberBalance("member-1", [
        { ...baseTransaction, amountMinor: 2500, direction: "user_owes_member" },
        resetTransaction!,
      ]),
    ).toBe(0);
  });

  it("returns no transaction for zero balances", () => {
    expect(
      createResetAdjustmentTransaction({
        id: "reset-3",
        memberId: "member-1",
        balanceMinor: 0,
        transactionDate: "2026-05-23",
        createdAt: "2026-05-23T08:00:00.000Z",
      }),
    ).toBeNull();
  });
});
