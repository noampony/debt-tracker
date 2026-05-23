import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { App } from "../app/App";
import { ui } from "../i18n/he";
import type { DebtRepository } from "../storage/debtRepository";
import type { Member } from "../features/members/types";
import type { Transaction } from "../features/transactions/types";
import { formatIls } from "../lib/money";

const emptyRepository: DebtRepository = {
  getMembers: async () => [],
  createMember: async (member) => member,
  updateMember: async () => undefined,
  deleteMember: async () => undefined,
  getTransactions: async () => [],
  createTransaction: async (transaction) => transaction,
  updateTransaction: async (transaction) => transaction,
  deleteTransaction: async () => undefined,
  resetMemberDebt: async () => null,
};

function createMemoryRepository(
  initialMembers: Member[] = [],
  initialTransactions: Transaction[] = [],
): DebtRepository {
  const members = [...initialMembers];
  const transactions = [...initialTransactions];

  return {
    getMembers: async () => [...members],
    createMember: async (member) => {
      members.push(member);
      return member;
    },
    updateMember: async (member) => {
      const memberIndex = members.findIndex((storedMember) => storedMember.id === member.id);
      if (memberIndex >= 0) {
        members[memberIndex] = member;
      }
    },
    deleteMember: async (memberId) => {
      const memberIndex = members.findIndex((m) => m.id === memberId);
      if (memberIndex >= 0) members.splice(memberIndex, 1);
      // cascade-delete transactions
      const toRemove = transactions.filter((tx) => tx.memberId === memberId).map((tx) => tx.id);
      toRemove.forEach((id) => {
        const i = transactions.findIndex((tx) => tx.id === id);
        if (i >= 0) transactions.splice(i, 1);
      });
    },
    getTransactions: async () => [...transactions],
    createTransaction: async (transaction) => {
      transactions.push(transaction);
      return transaction;
    },
    updateTransaction: async (transaction) => {
      const idx = transactions.findIndex((tx) => tx.id === transaction.id);
      if (idx >= 0) transactions[idx] = transaction;
      return transaction;
    },
    deleteTransaction: async (transactionId) => {
      const idx = transactions.findIndex((tx) => tx.id === transactionId);
      if (idx >= 0) transactions.splice(idx, 1);
    },
    resetMemberDebt: async (memberId) => {
      const balanceMinor = transactions
        .filter((tx) => tx.memberId === memberId)
        .reduce((sum, tx) => sum + (tx.direction === "member_owes_user" ? tx.amountMinor : -tx.amountMinor), 0);
      if (balanceMinor === 0) return null;
      const resetTx: Transaction = {
        id: `reset-${Date.now()}`,
        memberId,
        amountMinor: Math.abs(balanceMinor),
        direction: balanceMinor > 0 ? "user_owes_member" : "member_owes_user",
        title: "איפוס חוב",
        transactionDate: "2026-05-23",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: "reset_adjustment",
      };
      transactions.push(resetTx);
      return resetTx;
    },
  };
}

function createInspectableMemoryRepository(
  initialMembers: Member[] = [],
  initialTransactions: Transaction[] = [],
): { repository: DebtRepository; createdTransactions: Transaction[] } {
  const members = [...initialMembers];
  const transactions = [...initialTransactions];
  const createdTransactions: Transaction[] = [];

  return {
    repository: {
      getMembers: async () => [...members],
      createMember: async (member) => {
        members.push(member);
        return member;
      },
      updateMember: async (member) => {
        const memberIndex = members.findIndex((storedMember) => storedMember.id === member.id);
        if (memberIndex >= 0) {
          members[memberIndex] = member;
        }
      },
      deleteMember: async (memberId) => {
        const i = members.findIndex((m) => m.id === memberId);
        if (i >= 0) members.splice(i, 1);
        const toRemove = transactions.filter((tx) => tx.memberId === memberId).map((tx) => tx.id);
        toRemove.forEach((id) => {
          const j = transactions.findIndex((tx) => tx.id === id);
          if (j >= 0) transactions.splice(j, 1);
        });
      },
      getTransactions: async () => [...transactions],
      createTransaction: async (transaction) => {
        createdTransactions.push(transaction);
        transactions.push(transaction);
        return transaction;
      },
      updateTransaction: async (transaction) => {
        const idx = transactions.findIndex((tx) => tx.id === transaction.id);
        if (idx >= 0) transactions[idx] = transaction;
        return transaction;
      },
      deleteTransaction: async (transactionId) => {
        const idx = transactions.findIndex((tx) => tx.id === transactionId);
        if (idx >= 0) transactions.splice(idx, 1);
      },
      resetMemberDebt: async (memberId) => {
        const balanceMinor = transactions
          .filter((tx) => tx.memberId === memberId)
          .reduce((sum, tx) => sum + (tx.direction === "member_owes_user" ? tx.amountMinor : -tx.amountMinor), 0);
        if (balanceMinor === 0) return null;
        const resetTx: Transaction = {
          id: `reset-${Date.now()}`,
          memberId,
          amountMinor: Math.abs(balanceMinor),
          direction: balanceMinor > 0 ? "user_owes_member" : "member_owes_user",
          title: "איפוס חוב",
          transactionDate: "2026-05-23",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          type: "reset_adjustment",
        };
        createdTransactions.push(resetTx);
        transactions.push(resetTx);
        return resetTx;
      },
    },
    createdTransactions,
  };
}

function createMember(id: string, name: string): Member {
  return {
    id,
    name,
    createdAt: "2026-05-23T08:00:00.000Z",
    updatedAt: "2026-05-23T08:00:00.000Z",
  };
}

function createTransaction(
  id: string,
  memberId: string,
  amountMinor: number,
  direction: Transaction["direction"] = "member_owes_user",
  options: Partial<Pick<Transaction, "title" | "notes" | "transactionDate" | "createdAt">> = {},
): Transaction {
  return {
    id,
    memberId,
    amountMinor,
    direction,
    title: options.title ?? "ארוחה",
    notes: options.notes,
    transactionDate: options.transactionDate ?? "2026-05-23",
    createdAt: options.createdAt ?? "2026-05-23T08:05:00.000Z",
    updatedAt: options.createdAt ?? "2026-05-23T08:05:00.000Z",
    type: "manual",
  };
}

function getSummaryAmount(card: HTMLElement): string | null {
  return card.querySelector(".summary-amount")?.textContent ?? null;
}

function getDatalistOptions(container: HTMLElement, datalistId: string): string[] {
  const datalist = container.querySelector(`datalist#${datalistId}`);
  return Array.from(datalist?.querySelectorAll("option") ?? []).map((option) => option.value);
}

describe("App", () => {
  it("renders the Hebrew root page content", async () => {
    render(<App repository={emptyRepository} />);

    expect(screen.getByRole("heading", { level: 1, name: ui.app.title })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ui.actions.newTransaction })).toBeInTheDocument();
    expect(await screen.findByText(ui.members.empty)).toBeInTheDocument();
  });

  it("loads member balances from the repository abstraction", async () => {
    render(
      <App
        repository={{
          ...emptyRepository,
          getMembers: async () => [
            {
              id: "member-1",
              name: "דני",
              createdAt: "2026-05-23T08:00:00.000Z",
              updatedAt: "2026-05-23T08:00:00.000Z",
            },
          ],
          getTransactions: async () => [
            {
              id: "transaction-1",
              memberId: "member-1",
              amountMinor: 5000,
              direction: "member_owes_user",
              title: "ארוחה",
              transactionDate: "2026-05-23",
              createdAt: "2026-05-23T08:05:00.000Z",
              updatedAt: "2026-05-23T08:05:00.000Z",
              type: "manual",
            },
          ],
        }}
      />,
    );

    expect(await screen.findByText(/דני חייב לך/)).toBeInTheDocument();
  });

  it("shows aggregate summary cards with formatted ILS totals", async () => {
    render(
      <App
        repository={createMemoryRepository(
          [createMember("member-1", "דני"), createMember("member-2", "נועה"), createMember("member-3", "יואב")],
          [
            createTransaction("transaction-1", "member-1", 5000),
            createTransaction("transaction-2", "member-2", 3000, "user_owes_member"),
            createTransaction("transaction-3", "member-3", 1000),
            createTransaction("transaction-4", "member-3", 1000, "user_owes_member"),
          ],
        )}
      />,
    );

    expect(await screen.findByText(ui.overview.totalOwedToUser)).toBeInTheDocument();
    expect(screen.getByText(ui.overview.totalUserOwes)).toBeInTheDocument();

    const owedToUserCard = screen.getByText(ui.overview.totalOwedToUser).closest(".summary-card") as HTMLElement;
    const userOwesCard = screen.getByText(ui.overview.totalUserOwes).closest(".summary-card") as HTMLElement;

    expect(getSummaryAmount(owedToUserCard)).toBe(formatIls(5000));
    expect(getSummaryAmount(userOwesCard)).toBe(formatIls(3000));
  });

  it("updates the aggregate summary after adding a transaction", async () => {
    const user = userEvent.setup();

    render(<App repository={createMemoryRepository([createMember("member-1", "דני")])} />);

    expect(await screen.findByText(ui.overview.totalOwedToUser)).toBeInTheDocument();
    const owedToUserCard = screen.getByText(ui.overview.totalOwedToUser).closest(".summary-card") as HTMLElement;
    const userOwesCard = screen.getByText(ui.overview.totalUserOwes).closest(".summary-card") as HTMLElement;

    expect(getSummaryAmount(owedToUserCard)).toBe(formatIls(0));
    expect(getSummaryAmount(userOwesCard)).toBe(formatIls(0));

    await user.click(screen.getAllByRole("button", { name: ui.actions.newTransaction })[0]);
    await user.selectOptions(screen.getByLabelText(ui.transaction.memberLabel), "member-1");
    await user.type(screen.getByLabelText(ui.transaction.amountLabel), "42.50");
    await user.click(screen.getByLabelText(ui.transaction.userOwesMemberLabel));
    await user.type(screen.getByLabelText(ui.transaction.reasonLabel), "נסיעה");
    await user.click(screen.getByRole("button", { name: ui.actions.save }));

    expect(await within(userOwesCard).findByText(/42.50/)).toBeInTheDocument();
    expect(getSummaryAmount(userOwesCard)).toBe(formatIls(4250));
    expect(getSummaryAmount(owedToUserCard)).toBe(formatIls(0));
  });

  it("renders distinct natural Hebrew member balance text for positive, negative, and zero balances", async () => {
    render(
      <App
        repository={createMemoryRepository(
          [createMember("member-1", "דני"), createMember("member-2", "נועה"), createMember("member-3", "יואב")],
          [
            createTransaction("transaction-1", "member-1", 5000),
            createTransaction("transaction-2", "member-2", 3000, "user_owes_member"),
          ],
        )}
      />,
    );

    const positiveBalance = await screen.findByText(/דני חייב לך/);
    const negativeBalance = screen.getByText(/אתה חייב לנועה/);

    expect(positiveBalance.textContent).toBe(`דני חייב לך ${formatIls(5000)}`);
    expect(negativeBalance.textContent).toBe(`אתה חייב לנועה ${formatIls(3000)}`);
    expect(screen.getByText("אין חוב פתוח מול יואב")).toBeInTheDocument();
  });

  it("adds a member from the Hebrew add member form", async () => {
    const user = userEvent.setup();

    render(<App repository={createMemoryRepository()} />);

    await user.click(screen.getByRole("button", { name: ui.actions.addMember }));
    const addMemberForm = screen.getByRole("form", { name: ui.members.addTitle });
    await user.type(screen.getByLabelText(ui.members.nameLabel), " דני ");
    await user.click(within(addMemberForm).getByRole("button", { name: ui.actions.save }));

    expect(await screen.findByRole("heading", { level: 3, name: "דני" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("rejects empty member names", async () => {
    const user = userEvent.setup();

    render(<App repository={createMemoryRepository()} />);

    await user.click(screen.getByRole("button", { name: ui.actions.addMember }));
    const addMemberForm = screen.getByRole("form", { name: ui.members.addTitle });
    await user.click(within(addMemberForm).getByRole("button", { name: ui.actions.save }));

    expect(await screen.findByRole("alert")).toHaveTextContent(ui.members.nameRequired);
    expect(screen.queryByRole("heading", { level: 3, name: "דני" })).not.toBeInTheDocument();
  });

  it("rejects duplicate member names after trimming whitespace", async () => {
    const user = userEvent.setup();

    render(
      <App
        repository={createMemoryRepository([
          {
            id: "member-1",
            name: "דני",
            createdAt: "2026-05-23T08:00:00.000Z",
            updatedAt: "2026-05-23T08:00:00.000Z",
          },
        ])}
      />,
    );

    expect(await screen.findByRole("heading", { level: 3, name: "דני" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: ui.actions.addMember }));
    const addMemberForm = screen.getByRole("form", { name: ui.members.addTitle });
    await user.type(screen.getByLabelText(ui.members.nameLabel), " דני ");
    await user.click(within(addMemberForm).getByRole("button", { name: ui.actions.save }));

    expect(await screen.findByRole("alert")).toHaveTextContent(ui.members.duplicateName);
    expect(screen.getAllByRole("heading", { level: 3, name: "דני" })).toHaveLength(1);
  });

  it("opens the add transaction form with today's date, Hebrew labels, and common reason suggestions", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <App
        repository={createMemoryRepository([
          {
            id: "member-1",
            name: "דני",
            createdAt: "2026-05-23T08:00:00.000Z",
            updatedAt: "2026-05-23T08:00:00.000Z",
          },
        ])}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: ui.actions.newTransaction })[0]);

    expect(screen.getByRole("form", { name: ui.transaction.addTitle })).toBeInTheDocument();
    expect(screen.getByLabelText(ui.transaction.memberLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(ui.transaction.amountLabel)).toHaveAttribute("inputmode", "decimal");
    expect(screen.getByText(ui.transaction.directionLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(ui.transaction.reasonLabel)).toHaveAttribute("list", "transaction-reason-suggestions");
    expect(getDatalistOptions(container, "transaction-reason-suggestions")).toEqual(ui.transaction.commonReasons);
    expect((screen.getByLabelText(ui.transaction.dateLabel) as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(screen.getByLabelText(ui.transaction.notesLabel)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ui.actions.cancel })).toBeInTheDocument();
  });

  it("rejects missing transaction fields with Hebrew validation messages", async () => {
    const user = userEvent.setup();

    render(<App repository={createMemoryRepository()} />);

    await user.click(screen.getAllByRole("button", { name: ui.actions.newTransaction })[0]);
    await user.click(screen.getByRole("button", { name: ui.actions.save }));

    expect(await screen.findByText(ui.transaction.memberRequired)).toBeInTheDocument();
    expect(screen.getByText(ui.transaction.amountRequired)).toBeInTheDocument();
    expect(screen.getByText(ui.transaction.reasonRequired)).toBeInTheDocument();
  });

  it.each([
    ["0", ui.transaction.amountZero],
    ["-10", ui.transaction.amountNegative],
    ["abc", ui.transaction.amountInvalid],
  ])("rejects invalid transaction amount %s", async (amount, expectedError) => {
    const user = userEvent.setup();

    render(
      <App
        repository={createMemoryRepository([
          {
            id: "member-1",
            name: "דני",
            createdAt: "2026-05-23T08:00:00.000Z",
            updatedAt: "2026-05-23T08:00:00.000Z",
          },
        ])}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: ui.actions.newTransaction })[0]);
    await user.selectOptions(screen.getByLabelText(ui.transaction.memberLabel), "member-1");
    await user.type(screen.getByLabelText(ui.transaction.amountLabel), amount);
    await user.type(screen.getByLabelText(ui.transaction.reasonLabel), "ארוחה");
    await user.click(screen.getByRole("button", { name: ui.actions.save }));

    expect(await screen.findByText(expectedError)).toBeInTheDocument();
  });

  it("creates a transaction with a custom reason and updates the member balance immediately", async () => {
    const user = userEvent.setup();

    render(
      <App
        repository={createMemoryRepository([
          {
            id: "member-1",
            name: "דני",
            createdAt: "2026-05-23T08:00:00.000Z",
            updatedAt: "2026-05-23T08:00:00.000Z",
          },
        ])}
      />,
    );

    expect(await screen.findByText("אין חוב פתוח מול דני")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: ui.actions.newTransaction })[0]);
    await user.selectOptions(screen.getByLabelText(ui.transaction.memberLabel), "member-1");
    await user.type(screen.getByLabelText(ui.transaction.amountLabel), "42.50");
    await user.click(screen.getByLabelText(ui.transaction.userOwesMemberLabel));
    await user.type(screen.getByLabelText(ui.transaction.reasonLabel), "נסיעה");
    await user.type(screen.getByLabelText(ui.transaction.notesLabel), "מונית");
    await user.click(screen.getByRole("button", { name: ui.actions.save }));

    expect(await screen.findByText(/אתה חייב לדני/)).toHaveTextContent("42.50");
    expect(screen.queryByRole("form", { name: ui.transaction.addTitle })).not.toBeInTheDocument();
  });

  it("opens a member-card transaction with the member preselected", async () => {
    const user = userEvent.setup();

    render(
      <App
        repository={createMemoryRepository([
          {
            id: "member-1",
            name: "דני",
            createdAt: "2026-05-23T08:00:00.000Z",
            updatedAt: "2026-05-23T08:00:00.000Z",
          },
        ])}
      />,
    );

    const memberCard = await screen.findByRole("heading", { level: 3, name: "דני" });
    await user.click(
      within(memberCard.closest(".card") as HTMLElement).getByRole("button", { name: ui.actions.addTransaction }),
    );

    expect(screen.getByLabelText(ui.transaction.memberLabel)).toHaveValue("member-1");
    expect(screen.getByLabelText(ui.transaction.amountLabel)).toHaveFocus();
  });

  it("navigates to member detail, shows balance, and returns to main screen", async () => {
    const user = userEvent.setup();

    render(
      <App
        repository={createMemoryRepository(
          [createMember("member-1", "דני")],
          [createTransaction("transaction-1", "member-1", 5000)],
        )}
      />,
    );

    const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(".card") as HTMLElement;
    await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));

    expect(screen.getByRole("heading", { level: 2, name: "דני" })).toBeInTheDocument();
    expect(screen.getAllByText(/דני חייב לך/).some((element) => element.textContent?.includes("50.00"))).toBe(true);
    expect(screen.getByRole("button", { name: ui.members.resetDebt })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: ui.actions.back }));

    expect(screen.getByRole("heading", { level: 2, name: ui.home.quickActionTitle })).toBeInTheDocument();
  });

  it("opens the add transaction form from member detail with the member preselected", async () => {
    const user = userEvent.setup();

    render(<App repository={createMemoryRepository([createMember("member-1", "דני")])} />);

    const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(".card") as HTMLElement;
    await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
    await user.click(screen.getByRole("button", { name: ui.actions.addTransaction }));

    expect(screen.getByLabelText(ui.transaction.memberLabel)).toHaveValue("member-1");
    expect(screen.getByLabelText(ui.transaction.amountLabel)).toHaveFocus();
  });

  it("shows selected member transactions newest-first with required fields and optional notes", async () => {
    const user = userEvent.setup();

    render(
      <App
        repository={createMemoryRepository(
          [createMember("member-1", "דני"), createMember("member-2", "נועה")],
          [
            createTransaction("transaction-old", "member-1", 1200, "member_owes_user", {
              title: "קפה",
              transactionDate: "2026-05-20",
              createdAt: "2026-05-20T08:05:00.000Z",
            }),
            createTransaction("transaction-other-member", "member-2", 9900, "member_owes_user", {
              title: "לא אמור להופיע",
              transactionDate: "2026-05-25",
            }),
            createTransaction("transaction-new", "member-1", 3400, "user_owes_member", {
              title: "נסיעה",
              notes: "מונית חזרה",
              transactionDate: "2026-05-22",
              createdAt: "2026-05-22T08:05:00.000Z",
            }),
          ],
        )}
      />,
    );

    const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(".card") as HTMLElement;
    await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));

    const history = screen.getByRole("heading", { level: 2, name: ui.transaction.historyTitle }).closest(
      "section",
    ) as HTMLElement;
    const cards = within(history).getAllByRole("article");

    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByRole("heading", { level: 3, name: "נסיעה" })).toBeInTheDocument();
    expect(within(cards[0]).getByText("22.05.2026")).toBeInTheDocument();
    expect(cards[0].textContent).toContain("34.00");
    expect(within(cards[0]).getByText("אתה חייב לדני")).toBeInTheDocument();
    expect(within(cards[0]).getByText("מונית חזרה")).toBeInTheDocument();
    expect(within(cards[1]).getByRole("heading", { level: 3, name: "קפה" })).toBeInTheDocument();
    expect(within(history).queryByText("לא אמור להופיע")).not.toBeInTheDocument();
    expect(within(cards[1]).queryByText(ui.transaction.notesLabelShort)).not.toBeInTheDocument();
  });

  it("shows a Hebrew empty transaction history state for members without transactions", async () => {
    const user = userEvent.setup();

    render(<App repository={createMemoryRepository([createMember("member-1", "דני")])} />);

    const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(".card") as HTMLElement;
    await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));

    expect(screen.getByText(ui.transaction.historyEmpty)).toBeInTheDocument();
  });

  it("disables reset for an already-zero balance", async () => {
    const user = userEvent.setup();

    render(<App repository={createMemoryRepository([createMember("member-1", "דני")])} />);

    const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(".card") as HTMLElement;
    await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));

    expect(screen.getByRole("button", { name: ui.members.resetDebt })).toBeDisabled();
    expect(screen.getByText(ui.members.resetDisabled)).toBeInTheDocument();
  });

  it("opens reset dialog and cancel closes it without changing balance", async () => {
    const user = userEvent.setup();

    render(
      <App
        repository={createMemoryRepository(
          [createMember("member-1", "דני")],
          [createTransaction("transaction-1", "member-1", 5000, "member_owes_user", { title: "ארוחה" })],
        )}
      />,
    );

    const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(".card") as HTMLElement;
    await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
    await user.click(screen.getByRole("button", { name: ui.members.resetDebt }));

    expect(screen.getByRole("dialog", { name: ui.members.resetDialogTitle })).toBeInTheDocument();
    expect(
      screen.getByText("הפעולה תאפס את החוב מול דני ותוסיף עסקת איזון להיסטוריה. האם להמשיך?"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: ui.members.resetDialogCancel }));

    expect(screen.queryByRole("dialog", { name: ui.members.resetDialogTitle })).not.toBeInTheDocument();
    const balancePanel = screen.getByText(ui.members.currentBalance).closest(".balance-panel") as HTMLElement;
    expect(balancePanel).toHaveTextContent("דני חייב לך");
    expect(balancePanel).toHaveTextContent("50.00");
    expect(screen.getByRole("heading", { level: 3, name: "ארוחה" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 3, name: ui.members.resetDebt })).not.toBeInTheDocument();
  });

  it("confirms reset by creating a reset_adjustment transaction, preserving history, and zeroing balance", async () => {
    const user = userEvent.setup();
    const { repository, createdTransactions } = createInspectableMemoryRepository(
      [createMember("member-1", "דני")],
      [createTransaction("transaction-1", "member-1", 5000, "member_owes_user", { title: "ארוחה" })],
    );

    render(<App repository={repository} />);

    const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(".card") as HTMLElement;
    await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
    await user.click(screen.getByRole("button", { name: ui.members.resetDebt }));
    await user.click(screen.getByRole("button", { name: ui.members.resetDialogConfirm }));

    expect(screen.queryByRole("dialog", { name: ui.members.resetDialogTitle })).not.toBeInTheDocument();
    expect(screen.getByText("אין חוב פתוח מול דני")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "ארוחה" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: ui.members.resetDebt })).toBeInTheDocument();
    expect(createdTransactions).toHaveLength(1);
    expect(createdTransactions[0]).toMatchObject({
      memberId: "member-1",
      amountMinor: 5000,
      direction: "user_owes_member",
      title: ui.members.resetDebt,
      type: "reset_adjustment",
    });
  });

  it("shows Hebrew loading state while initial data is loading", () => {
    const neverResolving: DebtRepository = {
      ...emptyRepository,
      getMembers: () => new Promise(() => undefined),
      getTransactions: () => new Promise(() => undefined),
    };

    render(<App repository={neverResolving} />);

    expect(screen.getByText(ui.members.loading)).toBeInTheDocument();
  });

  it("shows Hebrew error state when initial data loading fails", async () => {
    const failingRepository: DebtRepository = {
      ...emptyRepository,
      getMembers: async () => {
        throw new Error("network error");
      },
    };

    render(<App repository={failingRepository} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(ui.error.loadFailed);
  });

  it("shows Hebrew error when member creation fails and keeps form open", async () => {
    const user = userEvent.setup();
    const failingRepository: DebtRepository = {
      ...emptyRepository,
      createMember: async () => {
        throw new Error("server error");
      },
    };

    render(<App repository={failingRepository} />);

    await user.click(screen.getByRole("button", { name: ui.actions.addMember }));
    const addMemberForm = screen.getByRole("form", { name: ui.members.addTitle });
    await user.type(screen.getByLabelText(ui.members.nameLabel), "דני");
    await user.click(within(addMemberForm).getByRole("button", { name: ui.actions.save }));

    expect(await screen.findByRole("alert")).toHaveTextContent(ui.error.memberCreateFailed);
    // Form stays open so user can retry
    expect(screen.getByRole("form", { name: ui.members.addTitle })).toBeInTheDocument();
  });

  it("shows Hebrew error when transaction creation fails and keeps form open", async () => {
    const user = userEvent.setup();
    const failingRepository: DebtRepository = {
      ...createMemoryRepository([createMember("member-1", "דני")]),
      createTransaction: async () => {
        throw new Error("server error");
      },
    };

    render(<App repository={failingRepository} />);

    await user.click(screen.getAllByRole("button", { name: ui.actions.newTransaction })[0]);
    await user.selectOptions(screen.getByLabelText(ui.transaction.memberLabel), "member-1");
    await user.type(screen.getByLabelText(ui.transaction.amountLabel), "50");
    await user.type(screen.getByLabelText(ui.transaction.reasonLabel), "ארוחה");
    await user.click(screen.getByRole("button", { name: ui.actions.save }));

    expect(await screen.findByRole("alert")).toHaveTextContent(ui.error.transactionCreateFailed);
    // Form stays open so user can retry
    expect(screen.getByRole("form", { name: ui.transaction.addTitle })).toBeInTheDocument();
  });

  it("shows Hebrew error when reset fails and keeps dialog open", async () => {
    const user = userEvent.setup();
    const failingRepository: DebtRepository = {
      ...createMemoryRepository(
        [createMember("member-1", "דני")],
        [createTransaction("transaction-1", "member-1", 5000)],
      ),
      resetMemberDebt: async () => {
        throw new Error("server error");
      },
    };

    render(<App repository={failingRepository} />);

    const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(".card") as HTMLElement;
    await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
    await user.click(screen.getByRole("button", { name: ui.members.resetDebt }));
    await user.click(screen.getByRole("button", { name: ui.members.resetDialogConfirm }));

    expect(await screen.findByRole("alert")).toHaveTextContent(ui.error.resetFailed);
    // Dialog stays open so user can retry
    expect(screen.getByRole("dialog", { name: ui.members.resetDialogTitle })).toBeInTheDocument();
  });

  it("disables save button during member creation to prevent duplicate submissions", async () => {
    const user = userEvent.setup();
    let resolveCreate!: () => void;
    const slowRepository: DebtRepository = {
      ...emptyRepository,
      createMember: (member) =>
        new Promise<Member>((resolve) => {
          resolveCreate = () => resolve(member);
        }),
    };

    render(<App repository={slowRepository} />);

    await user.click(screen.getByRole("button", { name: ui.actions.addMember }));
    const addMemberForm = screen.getByRole("form", { name: ui.members.addTitle });
    await user.type(screen.getByLabelText(ui.members.nameLabel), "דני");
    await user.click(within(addMemberForm).getByRole("button", { name: ui.actions.save }));

    // Button should be disabled while pending
    expect(screen.getByRole("button", { name: ui.loading.savingMember })).toBeDisabled();

    resolveCreate();
    expect(await screen.findByRole("heading", { level: 3, name: "דני" })).toBeInTheDocument();
  });

  describe("Edit Member", () => {
    it("shows edit button on member detail screen", async () => {
      const user = userEvent.setup();

      render(<App repository={createMemoryRepository([createMember("member-1", "דני")])} />);

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));

      expect(screen.getByRole("button", { name: ui.members.editName })).toBeInTheDocument();
    });

    it("opens edit form with current name pre-filled", async () => {
      const user = userEvent.setup();

      render(<App repository={createMemoryRepository([createMember("member-1", "דני")])} />);

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
      await user.click(screen.getByRole("button", { name: ui.members.editName }));

      expect(screen.getByRole("form", { name: ui.members.editTitle })).toBeInTheDocument();
      expect(screen.getByLabelText(ui.members.nameLabel)).toHaveValue("דני");
    });

    it("rejects empty name with Hebrew validation message", async () => {
      const user = userEvent.setup();

      render(<App repository={createMemoryRepository([createMember("member-1", "דני")])} />);

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
      await user.click(screen.getByRole("button", { name: ui.members.editName }));
      const nameInput = screen.getByLabelText(ui.members.nameLabel);
      await user.clear(nameInput);
      await user.click(screen.getByRole("button", { name: ui.actions.save }));

      expect(await screen.findByRole("alert")).toHaveTextContent(ui.members.nameRequired);
    });

    it("rejects a name that duplicates another member's name", async () => {
      const user = userEvent.setup();

      render(
        <App
          repository={createMemoryRepository([createMember("member-1", "דני"), createMember("member-2", "נועה")])}
        />,
      );

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
      await user.click(screen.getByRole("button", { name: ui.members.editName }));
      const nameInput = screen.getByLabelText(ui.members.nameLabel);
      await user.clear(nameInput);
      await user.type(nameInput, "נועה");
      await user.click(screen.getByRole("button", { name: ui.actions.save }));

      expect(await screen.findByRole("alert")).toHaveTextContent(ui.members.duplicateName);
    });

    it("successfully renames a member and the new name appears in the detail screen", async () => {
      const user = userEvent.setup();

      render(<App repository={createMemoryRepository([createMember("member-1", "דני")])} />);

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
      await user.click(screen.getByRole("button", { name: ui.members.editName }));
      const nameInput = screen.getByLabelText(ui.members.nameLabel);
      await user.clear(nameInput);
      await user.type(nameInput, "דוד");
      await user.click(screen.getByRole("button", { name: ui.actions.save }));

      expect(await screen.findByRole("heading", { level: 2, name: "דוד" })).toBeInTheDocument();
      expect(screen.queryByRole("form", { name: ui.members.editTitle })).not.toBeInTheDocument();
    });

    it("updated name appears on the main member list after navigating back", async () => {
      const user = userEvent.setup();

      render(<App repository={createMemoryRepository([createMember("member-1", "דני")])} />);

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
      await user.click(screen.getByRole("button", { name: ui.members.editName }));
      const nameInput = screen.getByLabelText(ui.members.nameLabel);
      await user.clear(nameInput);
      await user.type(nameInput, "דוד");
      await user.click(screen.getByRole("button", { name: ui.actions.save }));

      await user.click(await screen.findByRole("button", { name: ui.actions.back }));

      expect(await screen.findByRole("heading", { level: 3, name: "דוד" })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { level: 3, name: "דני" })).not.toBeInTheDocument();
    });

    it("transactions remain associated with the member after renaming", async () => {
      const user = userEvent.setup();

      render(
        <App
          repository={createMemoryRepository(
            [createMember("member-1", "דני")],
            [createTransaction("transaction-1", "member-1", 5000, "member_owes_user", { title: "ארוחה" })],
          )}
        />,
      );

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
      await user.click(screen.getByRole("button", { name: ui.members.editName }));
      const nameInput = screen.getByLabelText(ui.members.nameLabel);
      await user.clear(nameInput);
      await user.type(nameInput, "דוד");
      await user.click(screen.getByRole("button", { name: ui.actions.save }));

      // Transaction is still visible in history after rename
      expect(await screen.findByRole("heading", { level: 3, name: "ארוחה" })).toBeInTheDocument();
      // Balance label and transaction direction both use the new name
      expect(screen.getAllByText(/דוד חייב לך/).length).toBeGreaterThan(0);
    });

    it("cancel closes the edit form without changing the name", async () => {
      const user = userEvent.setup();

      render(<App repository={createMemoryRepository([createMember("member-1", "דני")])} />);

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
      await user.click(screen.getByRole("button", { name: ui.members.editName }));
      const nameInput = screen.getByLabelText(ui.members.nameLabel);
      await user.clear(nameInput);
      await user.type(nameInput, "שם אחר");
      await user.click(screen.getByRole("button", { name: ui.actions.cancel }));

      expect(screen.queryByRole("form", { name: ui.members.editTitle })).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "דני" })).toBeInTheDocument();
    });

    it("shows Hebrew error when update fails and keeps the form open", async () => {
      const user = userEvent.setup();
      const failingRepository: DebtRepository = {
        ...createMemoryRepository([createMember("member-1", "דני")]),
        updateMember: async () => {
          throw new Error("server error");
        },
      };

      render(<App repository={failingRepository} />);

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
      await user.click(screen.getByRole("button", { name: ui.members.editName }));
      const nameInput = screen.getByLabelText(ui.members.nameLabel);
      await user.clear(nameInput);
      await user.type(nameInput, "דוד");
      await user.click(screen.getByRole("button", { name: ui.actions.save }));

      expect(await screen.findByRole("alert")).toHaveTextContent(ui.error.memberUpdateFailed);
      // Form stays open so user can retry
      expect(screen.getByRole("form", { name: ui.members.editTitle })).toBeInTheDocument();
    });
  });

  describe("Delete Member", () => {
    it("shows delete member button on member detail screen", async () => {
      const user = userEvent.setup();

      render(<App repository={createMemoryRepository([createMember("member-1", "דני")])} />);

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));

      expect(screen.getByRole("button", { name: ui.members.deleteName })).toBeInTheDocument();
    });

    it("opens delete member confirmation dialog", async () => {
      const user = userEvent.setup();

      render(<App repository={createMemoryRepository([createMember("member-1", "דני")])} />);

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
      await user.click(screen.getByRole("button", { name: ui.members.deleteName }));

      expect(screen.getByRole("dialog", { name: ui.members.deleteConfirmTitle })).toBeInTheDocument();
      // dialog body mentions the member name
      const dialog = screen.getByRole("dialog", { name: ui.members.deleteConfirmTitle });
      expect(dialog.textContent).toContain("דני");
    });

    it("cancel closes dialog without deleting the member", async () => {
      const user = userEvent.setup();

      render(<App repository={createMemoryRepository([createMember("member-1", "דני")])} />);

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
      await user.click(screen.getByRole("button", { name: ui.members.deleteName }));
      await user.click(screen.getByRole("button", { name: ui.actions.cancel }));

      expect(screen.queryByRole("dialog", { name: ui.members.deleteConfirmTitle })).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "דני" })).toBeInTheDocument();
    });

    it("confirm deletes member and navigates back to main screen", async () => {
      const user = userEvent.setup();

      render(<App repository={createMemoryRepository([createMember("member-1", "דני")])} />);

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
      await user.click(screen.getByRole("button", { name: ui.members.deleteName }));
      await user.click(screen.getByRole("button", { name: ui.members.deleteConfirm }));

      // After deletion, should navigate back to main screen with member gone
      expect(await screen.findByRole("heading", { level: 2, name: ui.home.quickActionTitle })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { level: 3, name: "דני" })).not.toBeInTheDocument();
    });

    it("shows Hebrew error when deletion fails and keeps dialog open", async () => {
      const user = userEvent.setup();
      const failingRepository: DebtRepository = {
        ...createMemoryRepository([createMember("member-1", "דני")]),
        deleteMember: async () => {
          throw new Error("server error");
        },
      };

      render(<App repository={failingRepository} />);

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
      await user.click(screen.getByRole("button", { name: ui.members.deleteName }));
      await user.click(screen.getByRole("button", { name: ui.members.deleteConfirm }));

      expect(await screen.findByRole("alert")).toHaveTextContent(ui.error.memberDeleteFailed);
      expect(screen.getByRole("dialog", { name: ui.members.deleteConfirmTitle })).toBeInTheDocument();
    });
  });

  describe("Edit Transaction", () => {
    it("shows edit and delete buttons on each transaction card", async () => {
      const user = userEvent.setup();

      render(
        <App
          repository={createMemoryRepository(
            [createMember("member-1", "דני")],
            [createTransaction("tx-1", "member-1", 5000, "member_owes_user", { title: "ארוחה" })],
          )}
        />,
      );

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));

      const history = screen.getByRole("heading", { level: 2, name: ui.transaction.historyTitle }).closest(
        "section",
      ) as HTMLElement;
      const txCard = within(history).getAllByRole("article")[0];
      expect(within(txCard).getByRole("button", { name: ui.actions.edit })).toBeInTheDocument();
      expect(within(txCard).getByRole("button", { name: ui.actions.delete })).toBeInTheDocument();
    });

    it("opens inline edit form with pre-filled values and common reason suggestions", async () => {
      const user = userEvent.setup();

      const { container } = render(
        <App
          repository={createMemoryRepository(
            [createMember("member-1", "דני")],
            [
              createTransaction("tx-1", "member-1", 5000, "member_owes_user", {
                title: "ארוחה",
                transactionDate: "2026-05-20",
              }),
            ],
          )}
        />,
      );

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));

      const history = screen.getByRole("heading", { level: 2, name: ui.transaction.historyTitle }).closest(
        "section",
      ) as HTMLElement;
      await user.click(within(history).getByRole("button", { name: ui.actions.edit }));

      expect(screen.getByRole("form", { name: ui.transaction.editTransactionTitle })).toBeInTheDocument();
      expect(screen.getByLabelText(ui.transaction.amountLabel)).toHaveValue("50");
      expect(screen.getByLabelText(ui.transaction.reasonLabel)).toHaveValue("ארוחה");
      expect(screen.getByLabelText(ui.transaction.reasonLabel)).toHaveAttribute(
        "list",
        "edit-tx-reason-suggestions-tx-1",
      );
      expect(getDatalistOptions(container, "edit-tx-reason-suggestions-tx-1")).toEqual(ui.transaction.commonReasons);
    });

    it("saves edited transaction with a common reason and updates balance", async () => {
      const user = userEvent.setup();

      render(
        <App
          repository={createMemoryRepository(
            [createMember("member-1", "דני")],
            [createTransaction("tx-1", "member-1", 5000, "member_owes_user", { title: "ארוחה" })],
          )}
        />,
      );

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));

      const history = screen.getByRole("heading", { level: 2, name: ui.transaction.historyTitle }).closest(
        "section",
      ) as HTMLElement;
      await user.click(within(history).getByRole("button", { name: ui.actions.edit }));

      const amountInput = screen.getByLabelText(ui.transaction.amountLabel);
      await user.clear(amountInput);
      await user.type(amountInput, "100");
      const titleInput = screen.getByLabelText(ui.transaction.reasonLabel);
      await user.clear(titleInput);
      await user.type(titleInput, "מתנה");
      await user.click(screen.getByRole("button", { name: ui.actions.save }));

      expect(await screen.findByRole("heading", { level: 3, name: "מתנה" })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { level: 3, name: "ארוחה" })).not.toBeInTheDocument();
      // Balance updated: ₪100 instead of ₪50
      expect(screen.getAllByText(/דני חייב לך/).some((el) => el.textContent?.includes("100.00"))).toBe(true);
    });

    it("cancel closes the edit form without saving", async () => {
      const user = userEvent.setup();

      render(
        <App
          repository={createMemoryRepository(
            [createMember("member-1", "דני")],
            [createTransaction("tx-1", "member-1", 5000, "member_owes_user", { title: "ארוחה" })],
          )}
        />,
      );

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));

      const history = screen.getByRole("heading", { level: 2, name: ui.transaction.historyTitle }).closest(
        "section",
      ) as HTMLElement;
      await user.click(within(history).getByRole("button", { name: ui.actions.edit }));
      await user.click(screen.getByRole("button", { name: ui.actions.cancel }));

      expect(screen.queryByRole("form", { name: ui.transaction.editTransactionTitle })).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 3, name: "ארוחה" })).toBeInTheDocument();
    });

    it("shows Hebrew error when transaction update fails and keeps edit form open", async () => {
      const user = userEvent.setup();
      const failingRepository: DebtRepository = {
        ...createMemoryRepository(
          [createMember("member-1", "דני")],
          [createTransaction("tx-1", "member-1", 5000, "member_owes_user", { title: "ארוחה" })],
        ),
        updateTransaction: async () => {
          throw new Error("server error");
        },
      };

      render(<App repository={failingRepository} />);

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));

      const history = screen.getByRole("heading", { level: 2, name: ui.transaction.historyTitle }).closest(
        "section",
      ) as HTMLElement;
      await user.click(within(history).getByRole("button", { name: ui.actions.edit }));
      await user.click(screen.getByRole("button", { name: ui.actions.save }));

      expect(await screen.findByRole("alert")).toHaveTextContent(ui.error.transactionUpdateFailed);
      expect(screen.getByRole("form", { name: ui.transaction.editTransactionTitle })).toBeInTheDocument();
    });
  });

  describe("Delete Transaction", () => {
    it("opens delete transaction confirmation dialog", async () => {
      const user = userEvent.setup();

      render(
        <App
          repository={createMemoryRepository(
            [createMember("member-1", "דני")],
            [createTransaction("tx-1", "member-1", 5000, "member_owes_user", { title: "ארוחה" })],
          )}
        />,
      );

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));

      const history = screen.getByRole("heading", { level: 2, name: ui.transaction.historyTitle }).closest(
        "section",
      ) as HTMLElement;
      await user.click(within(history).getByRole("button", { name: ui.actions.delete }));

      expect(
        screen.getByRole("dialog", { name: ui.transaction.deleteTransactionConfirmTitle }),
      ).toBeInTheDocument();
    });

    it("cancel closes dialog without deleting the transaction", async () => {
      const user = userEvent.setup();

      render(
        <App
          repository={createMemoryRepository(
            [createMember("member-1", "דני")],
            [createTransaction("tx-1", "member-1", 5000, "member_owes_user", { title: "ארוחה" })],
          )}
        />,
      );

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));

      const history = screen.getByRole("heading", { level: 2, name: ui.transaction.historyTitle }).closest(
        "section",
      ) as HTMLElement;
      await user.click(within(history).getByRole("button", { name: ui.actions.delete }));
      await user.click(screen.getByRole("button", { name: ui.actions.cancel }));

      expect(
        screen.queryByRole("dialog", { name: ui.transaction.deleteTransactionConfirmTitle }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 3, name: "ארוחה" })).toBeInTheDocument();
    });

    it("confirms deletion and removes transaction from history while updating balance", async () => {
      const user = userEvent.setup();

      render(
        <App
          repository={createMemoryRepository(
            [createMember("member-1", "דני")],
            [createTransaction("tx-1", "member-1", 5000, "member_owes_user", { title: "ארוחה" })],
          )}
        />,
      );

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));

      const history = screen.getByRole("heading", { level: 2, name: ui.transaction.historyTitle }).closest(
        "section",
      ) as HTMLElement;
      await user.click(within(history).getByRole("button", { name: ui.actions.delete }));
      const deleteTxDialog = screen.getByRole("dialog", { name: ui.transaction.deleteTransactionConfirmTitle });
      await user.click(within(deleteTxDialog).getByRole("button", { name: ui.transaction.deleteTransactionConfirm }));

      expect(await screen.findByText(ui.transaction.historyEmpty)).toBeInTheDocument();
      expect(screen.queryByRole("heading", { level: 3, name: "ארוחה" })).not.toBeInTheDocument();
      expect(screen.getByText("אין חוב פתוח מול דני")).toBeInTheDocument();
    });

    it("shows Hebrew error when deletion fails and keeps dialog open", async () => {
      const user = userEvent.setup();
      const failingRepository: DebtRepository = {
        ...createMemoryRepository(
          [createMember("member-1", "דני")],
          [createTransaction("tx-1", "member-1", 5000, "member_owes_user", { title: "ארוחה" })],
        ),
        deleteTransaction: async () => {
          throw new Error("server error");
        },
      };

      render(<App repository={failingRepository} />);

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));

      const history = screen.getByRole("heading", { level: 2, name: ui.transaction.historyTitle }).closest(
        "section",
      ) as HTMLElement;
      await user.click(within(history).getByRole("button", { name: ui.actions.delete }));
      const deleteTxDialog2 = screen.getByRole("dialog", { name: ui.transaction.deleteTransactionConfirmTitle });
      await user.click(
        within(deleteTxDialog2).getByRole("button", { name: ui.transaction.deleteTransactionConfirm }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(ui.error.transactionDeleteFailed);
      expect(
        screen.getByRole("dialog", { name: ui.transaction.deleteTransactionConfirmTitle }),
      ).toBeInTheDocument();
    });
  });

  it("disables confirm button during reset to prevent duplicate submissions", async () => {
    const user = userEvent.setup();
    let resolveReset!: (tx: Transaction | null) => void;
    const slowRepository: DebtRepository = {
      ...createMemoryRepository(
        [createMember("member-1", "דני")],
        [createTransaction("transaction-1", "member-1", 5000)],
      ),
      resetMemberDebt: () =>
        new Promise<Transaction | null>((resolve) => {
          resolveReset = resolve;
        }),
    };

    render(<App repository={slowRepository} />);

    const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(".card") as HTMLElement;
    await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
    await user.click(screen.getByRole("button", { name: ui.members.resetDebt }));
    await user.click(screen.getByRole("button", { name: ui.members.resetDialogConfirm }));

    // Confirm button should be disabled while pending
    expect(screen.getByRole("button", { name: ui.loading.resetting })).toBeDisabled();

    // Resolve with null (balance was already zero — no-op path)
    resolveReset(null);
    // Dialog should close after resolution
    expect(await screen.findByRole("button", { name: ui.members.resetDebt })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: ui.members.resetDialogTitle })).not.toBeInTheDocument();
  });

  describe("Security — safe rendering of user-generated content (XSS prevention)", () => {
    it("renders an HTML-like member name as escaped text, not as DOM elements", async () => {
      const htmlName = '<script>alert("xss")</script>';

      render(<App repository={createMemoryRepository([createMember("xss-member", htmlName)])} />);

      // testing-library matches by textContent, so it finds the heading
      const heading = await screen.findByRole("heading", { level: 3, name: htmlName });
      expect(heading).toBeInTheDocument();

      // The h3 must contain only a text node — no child element should have been injected
      expect(heading.childElementCount).toBe(0);

      // The serialised innerHTML must be HTML-escaped, not a live script tag
      expect(heading.innerHTML).not.toContain("<script>");
      expect(heading.innerHTML).toContain("&lt;script&gt;");
    });

    it("renders an HTML-like transaction title as escaped text, not as DOM elements", async () => {
      const user = userEvent.setup();
      const htmlTitle = '<img src=x onerror=alert(1)>';

      render(
        <App
          repository={createMemoryRepository(
            [createMember("member-1", "דני")],
            [createTransaction("tx-1", "member-1", 5000, "member_owes_user", { title: htmlTitle })],
          )}
        />,
      );

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));

      // The title heading is accessible by its full text content
      const titleHeading = screen.getByRole("heading", { level: 3, name: htmlTitle });
      expect(titleHeading).toBeInTheDocument();

      // No real img elements with an onerror attribute should exist in the document
      expect(document.querySelector("img")).toBeNull();

      // The heading contains only a text node (no child element)
      expect(titleHeading.childElementCount).toBe(0);
    });

    it("renders HTML-like transaction notes as escaped text, not as DOM elements", async () => {
      const user = userEvent.setup();
      const htmlNotes = '<b onclick="alert(2)">click me</b>';

      render(
        <App
          repository={createMemoryRepository(
            [createMember("member-1", "דני")],
            [
              createTransaction("tx-1", "member-1", 5000, "member_owes_user", {
                title: "ארוחה",
                notes: htmlNotes,
              }),
            ],
          )}
        />,
      );

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));

      // The notes text must be present as a text node
      const notesEl = screen.getByText(htmlNotes);
      expect(notesEl).toBeInTheDocument();

      // No real <b> element with onclick should have been injected by user content
      expect(document.querySelector("b[onclick]")).toBeNull();
    });
  });

  describe("Accessibility — dialogs", () => {
    it("reset dialog: all inputs have labels and dialog has a title", async () => {
      const user = userEvent.setup();

      render(
        <App
          repository={createMemoryRepository(
            [createMember("member-1", "דני")],
            [createTransaction("transaction-1", "member-1", 5000)],
          )}
        />,
      );

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
      await user.click(screen.getByRole("button", { name: ui.members.resetDebt }));

      const dialog = screen.getByRole("dialog", { name: ui.members.resetDialogTitle });
      expect(dialog).toBeInTheDocument();
      // Dialog has aria-modal
      expect(dialog).toHaveAttribute("aria-modal", "true");
      // Dialog title element is present
      expect(within(dialog).getByText(ui.members.resetDialogTitle)).toBeInTheDocument();
    });

    it("reset dialog: focus moves into dialog when opened", async () => {
      const user = userEvent.setup();

      render(
        <App
          repository={createMemoryRepository(
            [createMember("member-1", "דני")],
            [createTransaction("transaction-1", "member-1", 5000)],
          )}
        />,
      );

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
      await user.click(screen.getByRole("button", { name: ui.members.resetDebt }));

      // Focus should be inside the dialog on the first focusable element (cancel button)
      await waitFor(() => {
        const firstButton = screen.getByRole("button", { name: ui.members.resetDialogCancel });
        expect(firstButton).toHaveFocus();
      });
    });

    it("reset dialog: Escape key closes dialog without performing reset", async () => {
      const user = userEvent.setup();

      render(
        <App
          repository={createMemoryRepository(
            [createMember("member-1", "דני")],
            [createTransaction("transaction-1", "member-1", 5000)],
          )}
        />,
      );

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
      await user.click(screen.getByRole("button", { name: ui.members.resetDebt }));

      expect(screen.getByRole("dialog", { name: ui.members.resetDialogTitle })).toBeInTheDocument();

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("dialog", { name: ui.members.resetDialogTitle })).not.toBeInTheDocument();
      // Balance should be unchanged
      const balancePanel = screen.getByText(ui.members.currentBalance).closest(".balance-panel") as HTMLElement;
      expect(balancePanel).toHaveTextContent("דני חייב לך");
    });

    it("reset dialog: focus returns to trigger button after dialog closes", async () => {
      const user = userEvent.setup();

      render(
        <App
          repository={createMemoryRepository(
            [createMember("member-1", "דני")],
            [createTransaction("transaction-1", "member-1", 5000)],
          )}
        />,
      );

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
      const resetButton = screen.getByRole("button", { name: ui.members.resetDebt });
      await user.click(resetButton);
      await user.click(screen.getByRole("button", { name: ui.members.resetDialogCancel }));

      // Focus returns to the reset button that triggered the dialog
      await waitFor(() => {
        expect(screen.getByRole("button", { name: ui.members.resetDebt })).toHaveFocus();
      });
    });

    it("delete member dialog: Escape key closes dialog without deleting", async () => {
      const user = userEvent.setup();

      render(<App repository={createMemoryRepository([createMember("member-1", "דני")])} />);

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));
      await user.click(screen.getByRole("button", { name: ui.members.deleteName }));

      expect(screen.getByRole("dialog", { name: ui.members.deleteConfirmTitle })).toBeInTheDocument();

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("dialog", { name: ui.members.deleteConfirmTitle })).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "דני" })).toBeInTheDocument();
    });

    it("delete transaction dialog: Escape key closes dialog without deleting", async () => {
      const user = userEvent.setup();

      render(
        <App
          repository={createMemoryRepository(
            [createMember("member-1", "דני")],
            [createTransaction("tx-1", "member-1", 5000, "member_owes_user", { title: "ארוחה" })],
          )}
        />,
      );

      const memberCard = (await screen.findByRole("heading", { level: 3, name: "דני" })).closest(
        ".card",
      ) as HTMLElement;
      await user.click(within(memberCard).getByRole("button", { name: ui.actions.viewDetails }));

      const history = screen.getByRole("heading", { level: 2, name: ui.transaction.historyTitle }).closest(
        "section",
      ) as HTMLElement;
      await user.click(within(history).getByRole("button", { name: ui.actions.delete }));

      expect(
        screen.getByRole("dialog", { name: ui.transaction.deleteTransactionConfirmTitle }),
      ).toBeInTheDocument();

      await user.keyboard("{Escape}");

      expect(
        screen.queryByRole("dialog", { name: ui.transaction.deleteTransactionConfirmTitle }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 3, name: "ארוחה" })).toBeInTheDocument();
    });

    it("add transaction form: all fields have labeled inputs", async () => {
      const user = userEvent.setup();

      render(
        <App repository={createMemoryRepository([createMember("member-1", "דני")])} />,
      );

      await user.click(screen.getAllByRole("button", { name: ui.actions.newTransaction })[0]);

      // All inputs must be accessible by their label text
      expect(screen.getByLabelText(ui.transaction.memberLabel)).toBeInTheDocument();
      expect(screen.getByLabelText(ui.transaction.amountLabel)).toBeInTheDocument();
      expect(screen.getByLabelText(ui.transaction.memberOwesUserLabel)).toBeInTheDocument();
      expect(screen.getByLabelText(ui.transaction.userOwesMemberLabel)).toBeInTheDocument();
      expect(screen.getByLabelText(ui.transaction.reasonLabel)).toBeInTheDocument();
      expect(screen.getByLabelText(ui.transaction.dateLabel)).toBeInTheDocument();
      expect(screen.getByLabelText(ui.transaction.notesLabel)).toBeInTheDocument();
    });

    it("add member form: name input has a label", async () => {
      const user = userEvent.setup();

      render(<App repository={createMemoryRepository()} />);

      await user.click(screen.getByRole("button", { name: ui.actions.addMember }));

      expect(screen.getByLabelText(ui.members.nameLabel)).toBeInTheDocument();
    });

    it("form errors are associated with their fields via aria-describedby", async () => {
      const user = userEvent.setup();

      render(
        <App
          repository={createMemoryRepository([createMember("member-1", "דני")])}
        />,
      );

      await user.click(screen.getAllByRole("button", { name: ui.actions.newTransaction })[0]);
      await user.click(screen.getByRole("button", { name: ui.actions.save }));

      // Amount error should be associated with the amount field
      const amountInput = await screen.findByLabelText(ui.transaction.amountLabel);
      expect(amountInput).toHaveAttribute("aria-invalid", "true");
      const amountErrorId = amountInput.getAttribute("aria-describedby");
      expect(amountErrorId).toBeDefined();
      // The error element with that id exists in the DOM
      expect(document.getElementById(amountErrorId!)).toBeInTheDocument();
    });
  });
});
