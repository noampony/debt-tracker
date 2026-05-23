import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { App } from "../app/App";
import { ui } from "../i18n/he";
import type { DebtRepository } from "../storage/debtRepository";
import type { Member } from "../features/members/types";
import type { Transaction } from "../features/transactions/types";
import { formatIls } from "../lib/money";

const emptyRepository: DebtRepository = {
  getMembers: async () => [],
  createMember: async () => undefined,
  updateMember: async () => undefined,
  getTransactions: async () => [],
  createTransaction: async () => undefined,
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
    },
    updateMember: async (member) => {
      const memberIndex = members.findIndex((storedMember) => storedMember.id === member.id);

      if (memberIndex >= 0) {
        members[memberIndex] = member;
      }
    },
    getTransactions: async () => [...transactions],
    createTransaction: async (transaction) => {
      transactions.push(transaction);
    },
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

  it("opens the add transaction form with today's date and Hebrew labels", async () => {
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

    expect(screen.getByRole("form", { name: ui.transaction.addTitle })).toBeInTheDocument();
    expect(screen.getByLabelText(ui.transaction.memberLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(ui.transaction.amountLabel)).toHaveAttribute("inputmode", "decimal");
    expect(screen.getByText(ui.transaction.directionLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(ui.transaction.reasonLabel)).toBeInTheDocument();
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

  it("creates a transaction and updates the member balance immediately", async () => {
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

  it("navigates to member detail, shows balance, reset placeholder, and returns to main screen", async () => {
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
    expect(screen.getByRole("button", { name: ui.members.resetDebt })).toBeDisabled();
    expect(screen.getByText(ui.members.resetPending)).toBeInTheDocument();

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
});
