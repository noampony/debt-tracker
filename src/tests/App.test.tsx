import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { App } from "../app/App";
import { ui } from "../i18n/he";
import type { DebtRepository } from "../storage/debtRepository";
import type { Member } from "../features/members/types";
import type { Transaction } from "../features/transactions/types";

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
});
