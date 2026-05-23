import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { ui } from "../i18n/he";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/primitives/Button";
import { Card } from "../components/primitives/Card";
import { TextInput } from "../components/primitives/TextInput";
import type { Member } from "../features/members/types";
import { sortMembersByBalance } from "../features/members/sorting";
import type { Transaction } from "../features/transactions/types";
import { calculateBalanceSummary, calculateMemberBalance } from "../features/balances/balance";
import { formatDate, getTodayDateIso } from "../lib/dates";
import { createId } from "../lib/ids";
import { formatIls, parseIlsInputToMinor } from "../lib/money";
import type { DebtRepository } from "../storage/debtRepository";
import type { TransactionDirection } from "../features/transactions/types";
import { createResetAdjustmentTransaction } from "../features/transactions/reset";

type AppProps = {
  repository: DebtRepository;
};

type TransactionFormErrors = {
  memberId?: string;
  amount?: string;
  title?: string;
  transactionDate?: string;
};

function formatMemberBalance(member: Member, balanceMinor: number): string {
  if (balanceMinor > 0) {
    return `${member.name} חייב לך ${formatIls(balanceMinor)}`;
  }

  if (balanceMinor < 0) {
    return `אתה חייב ל${member.name} ${formatIls(Math.abs(balanceMinor))}`;
  }

  return `אין חוב פתוח מול ${member.name}`;
}

function formatTransactionDirection(member: Member, transaction: Transaction): string {
  if (transaction.direction === "member_owes_user") {
    return `${member.name} חייב לך`;
  }

  return `אתה חייב ל${member.name}`;
}

function getTransactionSortTime(transaction: Transaction): number {
  const transactionDateTime = Date.parse(transaction.transactionDate);

  if (Number.isFinite(transactionDateTime)) {
    return transactionDateTime;
  }

  const createdAtTime = Date.parse(transaction.createdAt);
  return Number.isFinite(createdAtTime) ? createdAtTime : 0;
}

function getCreatedAtSortTime(transaction: Transaction): number {
  const createdAtTime = Date.parse(transaction.createdAt);
  return Number.isFinite(createdAtTime) ? createdAtTime : 0;
}

export function App({ repository }: AppProps) {
  const todayDateIso = getTodayDateIso();
  const amountInputRef = useRef<HTMLInputElement>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberNameError, setMemberNameError] = useState("");
  const [memberActionMessage, setMemberActionMessage] = useState("");
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [transactionMemberId, setTransactionMemberId] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDirection, setTransactionDirection] = useState<TransactionDirection>("member_owes_user");
  const [transactionTitle, setTransactionTitle] = useState("");
  const [transactionDate, setTransactionDate] = useState(todayDateIso);
  const [transactionNotes, setTransactionNotes] = useState("");
  const [transactionErrors, setTransactionErrors] = useState<TransactionFormErrors>({});
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const memberListItems = useMemo(
    () =>
      sortMembersByBalance(
        members.map((member) => ({
          ...member,
          balanceMinor: calculateMemberBalance(member.id, transactions),
        })),
      ),
    [members, transactions],
  );

  const balanceSummary = useMemo(
    () =>
      calculateBalanceSummary(
        members.map((member) => member.id),
        transactions,
      ),
    [members, transactions],
  );

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) ?? null,
    [members, selectedMemberId],
  );

  const selectedMemberBalanceMinor = useMemo(
    () => (selectedMember ? calculateMemberBalance(selectedMember.id, transactions) : 0),
    [selectedMember, transactions],
  );

  const selectedMemberTransactions = useMemo(() => {
    if (!selectedMember) {
      return [];
    }

    return transactions
      .filter((transaction) => transaction.memberId === selectedMember.id)
      .sort((first, second) => {
        const dateDiff = getTransactionSortTime(second) - getTransactionSortTime(first);

        if (dateDiff !== 0) {
          return dateDiff;
        }

        return getCreatedAtSortTime(second) - getCreatedAtSortTime(first);
      });
  }, [selectedMember, transactions]);

  const prioritizedMembers = useMemo(() => {
    const latestTransactionTimeByMember = new Map<string, number>();

    transactions.forEach((transaction) => {
      const transactionTime = Date.parse(transaction.createdAt);
      const currentLatestTime = latestTransactionTimeByMember.get(transaction.memberId) ?? 0;

      if (Number.isFinite(transactionTime) && transactionTime > currentLatestTime) {
        latestTransactionTimeByMember.set(transaction.memberId, transactionTime);
      }
    });

    return [...members].sort((first, second) => {
      const firstLatestTime = latestTransactionTimeByMember.get(first.id) ?? 0;
      const secondLatestTime = latestTransactionTimeByMember.get(second.id) ?? 0;

      if (firstLatestTime !== secondLatestTime) {
        return secondLatestTime - firstLatestTime;
      }

      return first.name.localeCompare(second.name, "he");
    });
  }, [members, transactions]);

  useEffect(() => {
    let isMounted = true;

    async function loadPersistedData() {
      try {
        const [members, transactions] = await Promise.all([repository.getMembers(), repository.getTransactions()]);

        if (!isMounted) {
          return;
        }

        setMembers(members);
        setTransactions(transactions);
      } catch {
        if (isMounted) {
          setMembers([]);
          setTransactions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPersistedData();

    return () => {
      isMounted = false;
    };
  }, [repository]);

  useEffect(() => {
    if (isTransactionFormOpen && transactionMemberId) {
      amountInputRef.current?.focus();
    }
  }, [isTransactionFormOpen, transactionMemberId]);

  function closeAddMemberForm() {
    setIsAddMemberOpen(false);
    setMemberName("");
    setMemberNameError("");
  }

  async function handleAddMemberSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = memberName.trim();

    if (!trimmedName) {
      setMemberNameError(ui.members.nameRequired);
      return;
    }

    const hasDuplicateName = members.some((member) => member.name.trim() === trimmedName);

    if (hasDuplicateName) {
      setMemberNameError(ui.members.duplicateName);
      return;
    }

    const now = new Date().toISOString();
    const member: Member = {
      id: createId(),
      name: trimmedName,
      createdAt: now,
      updatedAt: now,
    };

    await repository.createMember(member);
    setMembers((currentMembers) => {
      if (currentMembers.some((currentMember) => currentMember.id === member.id)) {
        return [...currentMembers];
      }

      return [...currentMembers, member];
    });
    closeAddMemberForm();
  }

  function openTransactionForm(memberId = "") {
    setIsTransactionFormOpen(true);
    setTransactionMemberId(memberId);
    setTransactionAmount("");
    setTransactionDirection("member_owes_user");
    setTransactionTitle("");
    setTransactionDate(getTodayDateIso());
    setTransactionNotes("");
    setTransactionErrors({});
    setMemberActionMessage("");
  }

  function closeTransactionForm() {
    setIsTransactionFormOpen(false);
    setTransactionMemberId("");
    setTransactionAmount("");
    setTransactionDirection("member_owes_user");
    setTransactionTitle("");
    setTransactionDate(getTodayDateIso());
    setTransactionNotes("");
    setTransactionErrors({});
  }

  function validateTransactionAmount(amount: string): string | undefined {
    const normalizedAmount = amount.trim().replace(/\s/g, "").replace(/^₪/, "").replace(/₪$/, "");

    if (!normalizedAmount) {
      return ui.transaction.amountRequired;
    }

    if (normalizedAmount.startsWith("-")) {
      return ui.transaction.amountNegative;
    }

    if (/^[0]+(?:[.,]0{1,2})?$/.test(normalizedAmount)) {
      return ui.transaction.amountZero;
    }

    if (parseIlsInputToMinor(amount) === null) {
      return ui.transaction.amountInvalid;
    }

    return undefined;
  }

  async function handleAddTransactionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = transactionTitle.trim();
    const trimmedNotes = transactionNotes.trim();
    const errors: TransactionFormErrors = {
      memberId: transactionMemberId ? undefined : ui.transaction.memberRequired,
      amount: validateTransactionAmount(transactionAmount),
      title: trimmedTitle ? undefined : ui.transaction.reasonRequired,
      transactionDate: transactionDate ? undefined : ui.transaction.dateRequired,
    };
    const amountMinor = parseIlsInputToMinor(transactionAmount);

    setTransactionErrors(errors);

    if (Object.values(errors).some(Boolean) || amountMinor === null) {
      return;
    }

    const now = new Date().toISOString();
    const transaction: Transaction = {
      id: createId(),
      memberId: transactionMemberId,
      amountMinor,
      direction: transactionDirection,
      title: trimmedTitle,
      notes: trimmedNotes || undefined,
      transactionDate,
      createdAt: now,
      updatedAt: now,
      type: "manual",
    };

    await repository.createTransaction(transaction);
    setTransactions((currentTransactions) => [...currentTransactions, transaction]);
    closeTransactionForm();
  }

  function openResetDialog() {
    if (selectedMemberBalanceMinor === 0) {
      return;
    }

    setIsResetDialogOpen(true);
  }

  function closeResetDialog() {
    setIsResetDialogOpen(false);
  }

  async function handleConfirmReset() {
    if (!selectedMember) {
      return;
    }

    const now = new Date().toISOString();
    const resetTransaction = createResetAdjustmentTransaction({
      id: createId(),
      memberId: selectedMember.id,
      balanceMinor: selectedMemberBalanceMinor,
      transactionDate: getTodayDateIso(),
      createdAt: now,
    });

    if (!resetTransaction) {
      closeResetDialog();
      return;
    }

    await repository.createTransaction(resetTransaction);
    setTransactions((currentTransactions) => [...currentTransactions, resetTransaction]);
    closeResetDialog();
  }

  function renderResetDialog() {
    if (!selectedMember || !isResetDialogOpen) {
      return null;
    }

    const dialogBody = ui.members.resetDialogBody.replace("{memberName}", selectedMember.name);

    return (
      <div className="dialog-backdrop" role="presentation">
        <div role="dialog" aria-modal="true" aria-labelledby="reset-dialog-title">
          <Card className="dialog-card">
            <h3 id="reset-dialog-title">{ui.members.resetDialogTitle}</h3>
            <p>{dialogBody}</p>
            <div className="button-row">
              <Button type="button" variant="ghost" onClick={closeResetDialog}>
                {ui.members.resetDialogCancel}
              </Button>
              <Button type="button" variant="secondary" onClick={handleConfirmReset}>
                {ui.members.resetDialogConfirm}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  function renderTransactionForm() {
    if (!isTransactionFormOpen) {
      return null;
    }

    return (
      <section className="section-stack" aria-labelledby="add-transaction-title">
        <Card>
          <form className="form-stack" aria-labelledby="add-transaction-title" onSubmit={handleAddTransactionSubmit}>
            <div className="form-heading">
              <h2 id="add-transaction-title">{ui.transaction.addTitle}</h2>
            </div>

            <label className="field" htmlFor="transaction-member">
              <span>{ui.transaction.memberLabel}</span>
              <select
                id="transaction-member"
                value={transactionMemberId}
                onChange={(event) => {
                  setTransactionMemberId(event.target.value);
                  setTransactionErrors((currentErrors) => ({ ...currentErrors, memberId: undefined }));
                }}
                aria-invalid={transactionErrors.memberId ? "true" : "false"}
                aria-describedby={transactionErrors.memberId ? "transaction-member-error" : undefined}
              >
                <option value="">{ui.transaction.memberPlaceholder}</option>
                {prioritizedMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            {transactionErrors.memberId && (
              <p className="field-error" id="transaction-member-error" role="alert">
                {transactionErrors.memberId}
              </p>
            )}

            <TextInput
              ref={amountInputRef}
              label={ui.transaction.amountLabel}
              value={transactionAmount}
              inputMode="decimal"
              autoComplete="off"
              dir="ltr"
              placeholder={ui.transaction.amountPlaceholder}
              onChange={(event) => {
                setTransactionAmount(event.target.value);
                setTransactionErrors((currentErrors) => ({ ...currentErrors, amount: undefined }));
              }}
              aria-invalid={transactionErrors.amount ? "true" : "false"}
              aria-describedby={transactionErrors.amount ? "transaction-amount-error" : undefined}
            />
            {transactionErrors.amount && (
              <p className="field-error" id="transaction-amount-error" role="alert">
                {transactionErrors.amount}
              </p>
            )}

            <fieldset className="field radio-group">
              <legend>{ui.transaction.directionLabel}</legend>
              <label>
                <input
                  type="radio"
                  name="transaction-direction"
                  value="member_owes_user"
                  checked={transactionDirection === "member_owes_user"}
                  onChange={() => setTransactionDirection("member_owes_user")}
                />
                <span>{ui.transaction.memberOwesUserLabel}</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="transaction-direction"
                  value="user_owes_member"
                  checked={transactionDirection === "user_owes_member"}
                  onChange={() => setTransactionDirection("user_owes_member")}
                />
                <span>{ui.transaction.userOwesMemberLabel}</span>
              </label>
            </fieldset>

            <TextInput
              label={ui.transaction.reasonLabel}
              value={transactionTitle}
              placeholder={ui.transaction.reasonPlaceholder}
              onChange={(event) => {
                setTransactionTitle(event.target.value);
                setTransactionErrors((currentErrors) => ({ ...currentErrors, title: undefined }));
              }}
              aria-invalid={transactionErrors.title ? "true" : "false"}
              aria-describedby={transactionErrors.title ? "transaction-title-error" : undefined}
            />
            {transactionErrors.title && (
              <p className="field-error" id="transaction-title-error" role="alert">
                {transactionErrors.title}
              </p>
            )}

            <TextInput
              label={ui.transaction.dateLabel}
              type="date"
              value={transactionDate}
              onChange={(event) => {
                setTransactionDate(event.target.value);
                setTransactionErrors((currentErrors) => ({ ...currentErrors, transactionDate: undefined }));
              }}
              aria-invalid={transactionErrors.transactionDate ? "true" : "false"}
              aria-describedby={transactionErrors.transactionDate ? "transaction-date-error" : undefined}
            />
            {transactionErrors.transactionDate && (
              <p className="field-error" id="transaction-date-error" role="alert">
                {transactionErrors.transactionDate}
              </p>
            )}

            <label className="field" htmlFor="transaction-notes">
              <span>{ui.transaction.notesLabel}</span>
              <textarea
                id="transaction-notes"
                value={transactionNotes}
                placeholder={ui.transaction.notesPlaceholder}
                onChange={(event) => setTransactionNotes(event.target.value)}
              />
            </label>

            <div className="button-row">
              <Button type="submit">{ui.actions.save}</Button>
              <Button type="button" variant="ghost" onClick={closeTransactionForm}>
                {ui.actions.cancel}
              </Button>
            </div>
          </form>
        </Card>
      </section>
    );
  }

  if (selectedMember) {
    const isResetDisabled = selectedMemberBalanceMinor === 0;

    return (
      <AppShell title={ui.app.title} subtitle={ui.app.subtitle}>
        <section className="section-stack" aria-labelledby="member-detail-title">
          <Button type="button" variant="ghost" className="back-button" onClick={() => setSelectedMemberId("")}>
            {ui.actions.back}
          </Button>
          <Card className="member-detail-card">
            <p className="eyebrow">{ui.members.detailTitle}</p>
            <h2 id="member-detail-title">{selectedMember.name}</h2>
            <div className="balance-panel">
              <p className="summary-label">{ui.members.currentBalance}</p>
              <p>{formatMemberBalance(selectedMember, selectedMemberBalanceMinor)}</p>
            </div>
            <div className="button-row detail-actions">
              <Button type="button" onClick={() => openTransactionForm(selectedMember.id)}>
                {ui.actions.addTransaction}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isResetDisabled}
                onClick={openResetDialog}
                aria-describedby="reset-debt-helper"
              >
                {ui.members.resetDebt}
              </Button>
            </div>
            <p className="helper-text" id="reset-debt-helper">
              {isResetDisabled ? ui.members.resetDisabled : ui.members.resetHelp}
            </p>
          </Card>
        </section>

        {renderResetDialog()}

        {renderTransactionForm()}

        <section className="section-stack" aria-labelledby="transaction-history-title">
          <div className="section-heading">
            <h2 id="transaction-history-title">{ui.transaction.historyTitle}</h2>
          </div>
          <div className="card-list history-list">
            {selectedMemberTransactions.length === 0 && <p className="empty-state">{ui.transaction.historyEmpty}</p>}
            {selectedMemberTransactions.map((transaction) => (
              <Card key={transaction.id} className="transaction-card">
                <div className="transaction-card-header">
                  <div>
                    <h3>{transaction.title}</h3>
                    <p>{formatTransactionDirection(selectedMember, transaction)}</p>
                  </div>
                  <p className="transaction-amount">{formatIls(transaction.amountMinor)}</p>
                </div>
                <dl className="transaction-meta">
                  <div>
                    <dt>{ui.transaction.dateLabelShort}</dt>
                    <dd>{formatDate(transaction.transactionDate) || transaction.transactionDate}</dd>
                  </div>
                  <div>
                    <dt>{ui.transaction.amountLabelShort}</dt>
                    <dd>{formatIls(transaction.amountMinor)}</dd>
                  </div>
                  <div>
                    <dt>{ui.transaction.reasonLabelShort}</dt>
                    <dd>{transaction.title}</dd>
                  </div>
                  {transaction.notes && (
                    <div className="transaction-notes">
                      <dt>{ui.transaction.notesLabelShort}</dt>
                      <dd>{transaction.notes}</dd>
                    </div>
                  )}
                </dl>
              </Card>
            ))}
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title={ui.app.title} subtitle={ui.app.subtitle}>
      <section className="hero-section" aria-labelledby="quick-action-title">
        <div>
          <p className="eyebrow">{ui.home.todayLabel}</p>
          <h2 id="quick-action-title">{ui.home.quickActionTitle}</h2>
          <p>{ui.home.quickActionDescription}</p>
        </div>
        <Button type="button" className="prominent-action" onClick={() => openTransactionForm()}>
          {ui.actions.newTransaction}
        </Button>
      </section>

      <section className="section-stack" aria-labelledby="summary-title">
        <div className="section-heading">
          <h2 id="summary-title">{ui.overview.title}</h2>
        </div>
        <div className="summary-grid">
          <Card className="summary-card">
            <p className="summary-label">{ui.overview.totalOwedToUser}</p>
            <p className="summary-amount">{formatIls(balanceSummary.totalOwedToUserMinor)}</p>
          </Card>
          <Card className="summary-card">
            <p className="summary-label">{ui.overview.totalUserOwes}</p>
            <p className="summary-amount">{formatIls(balanceSummary.totalUserOwesMinor)}</p>
          </Card>
        </div>
      </section>

      {renderTransactionForm()}

      <section className="section-stack" aria-labelledby="members-title">
        <div className="section-heading">
          <h2 id="members-title">{ui.members.title}</h2>
          <Button type="button" variant="secondary" onClick={() => setIsAddMemberOpen(true)}>
            {ui.actions.addMember}
          </Button>
        </div>
        {isAddMemberOpen && (
          <Card>
            <form className="form-stack" aria-labelledby="add-member-title" onSubmit={handleAddMemberSubmit}>
              <div className="form-heading">
                <h3 id="add-member-title">{ui.members.addTitle}</h3>
                <p>{ui.members.formHelp}</p>
              </div>
              <TextInput
                label={ui.members.nameLabel}
                value={memberName}
                onChange={(event) => {
                  setMemberName(event.target.value);
                  setMemberNameError("");
                }}
                aria-invalid={memberNameError ? "true" : "false"}
                aria-describedby={memberNameError ? "member-name-error" : undefined}
                autoFocus
              />
              {memberNameError && (
                <p className="field-error" id="member-name-error" role="alert">
                  {memberNameError}
                </p>
              )}
              <div className="button-row">
                <Button type="submit">{ui.actions.save}</Button>
                <Button type="button" variant="ghost" onClick={closeAddMemberForm}>
                  {ui.actions.cancel}
                </Button>
              </div>
            </form>
          </Card>
        )}
        {memberActionMessage && (
          <p className="inline-status" role="status">
            {memberActionMessage}
          </p>
        )}
        <div className="card-list">
          {isLoading && <p>{ui.members.loading}</p>}
          {!isLoading && memberListItems.length === 0 && <p>{ui.members.empty}</p>}
          {memberListItems.map((member) => (
            <Card key={member.id}>
              <div className="member-row">
                <div>
                  <h3>{member.name}</h3>
                  <p>{formatMemberBalance(member, member.balanceMinor)}</p>
                </div>
                <div className="member-actions">
                  <Button type="button" variant="secondary" onClick={() => openTransactionForm(member.id)}>
                    {ui.actions.addTransaction}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setSelectedMemberId(member.id);
                      setMemberActionMessage("");
                    }}
                  >
                    {ui.actions.viewDetails}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
