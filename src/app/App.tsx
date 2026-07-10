import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { ui } from "../i18n/he";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/primitives/Button";
import { Card } from "../components/primitives/Card";
import { Dialog } from "../components/primitives/Dialog";
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

type AppProps = {
  repository: DebtRepository;
  userEmail?: string;
  onLogout?: () => void;
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
  switch (transaction.direction) {
    case "member_owes_user":
      return `${member.name} חייב לך`;
    case "user_owes_member":
      return `אתה חייב ל${member.name}`;
    case "member_returned_to_user":
      return `${member.name} החזיר לך`;
    case "user_returned_to_member":
      return `אתה החזרת ל${member.name}`;
  }
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

function getMemberInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0] : "?";
}

function balanceToneClass(balanceMinor: number): string {
  if (balanceMinor > 0) return "balance-positive";
  if (balanceMinor < 0) return "balance-negative";
  return "balance-zero";
}

export function App({ repository, userEmail, onLogout }: AppProps) {
  const todayDateIso = getTodayDateIso();
  const amountInputRef = useRef<HTMLInputElement>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberNameError, setMemberNameError] = useState("");
  const [memberActionMessage, setMemberActionMessage] = useState("");
  const [memberCreateError, setMemberCreateError] = useState("");
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [transactionMemberId, setTransactionMemberId] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDirection, setTransactionDirection] = useState<TransactionDirection>("member_owes_user");
  const [transactionTitle, setTransactionTitle] = useState("");
  const [transactionReasonIsCustom, setTransactionReasonIsCustom] = useState(false);
  const [transactionDate, setTransactionDate] = useState(todayDateIso);
  const [transactionNotes, setTransactionNotes] = useState("");
  const [transactionErrors, setTransactionErrors] = useState<TransactionFormErrors>({});
  const [transactionCreateError, setTransactionCreateError] = useState("");
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetError, setResetError] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [editMemberName, setEditMemberName] = useState("");
  const [editMemberNameError, setEditMemberNameError] = useState("");
  const [editMemberSaveError, setEditMemberSaveError] = useState("");
  const [isSavingEditMember, setIsSavingEditMember] = useState(false);
  // Delete member
  const [isDeleteMemberDialogOpen, setIsDeleteMemberDialogOpen] = useState(false);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [deleteMemberError, setDeleteMemberError] = useState("");
  // Edit transaction
  const [editingTransactionId, setEditingTransactionId] = useState("");
  const [editTransactionAmount, setEditTransactionAmount] = useState("");
  const [editTransactionDirection, setEditTransactionDirection] = useState<TransactionDirection>("member_owes_user");
  const [editTransactionTitle, setEditTransactionTitle] = useState("");
  const [editTransactionReasonIsCustom, setEditTransactionReasonIsCustom] = useState(false);
  const [editTransactionDate, setEditTransactionDate] = useState("");
  const [editTransactionNotes, setEditTransactionNotes] = useState("");
  const [editTransactionErrors, setEditTransactionErrors] = useState<TransactionFormErrors>({});
  const [editTransactionSaveError, setEditTransactionSaveError] = useState("");
  const [isSavingEditTransaction, setIsSavingEditTransaction] = useState(false);
  // Delete transaction
  const [deleteTransactionId, setDeleteTransactionId] = useState("");
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);
  const [deleteTransactionError, setDeleteTransactionError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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
      setIsLoading(true);
      setLoadError("");
      try {
        const [members, transactions] = await Promise.all([repository.getMembers(), repository.getTransactions()]);

        if (!isMounted) {
          return;
        }

        setMembers(members);
        setTransactions(transactions);
      } catch {
        if (isMounted) {
          setLoadError(ui.error.loadFailed);
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

  // Reset edit-member form state whenever the selected member changes.
  useEffect(() => {
    setIsEditMemberOpen(false);
    setEditMemberName("");
    setEditMemberNameError("");
    setEditMemberSaveError("");
    setIsDeleteMemberDialogOpen(false);
    setDeleteMemberError("");
    setEditingTransactionId("");
    setEditTransactionSaveError("");
    setDeleteTransactionId("");
    setDeleteTransactionError("");
  }, [selectedMemberId]);

  function openEditMemberForm() {
    if (!selectedMember) return;
    setEditMemberName(selectedMember.name);
    setEditMemberNameError("");
    setEditMemberSaveError("");
    setIsEditMemberOpen(true);
  }

  function closeEditMemberForm() {
    setIsEditMemberOpen(false);
    setEditMemberName("");
    setEditMemberNameError("");
    setEditMemberSaveError("");
  }

  async function handleEditMemberSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMember || isSavingEditMember) return;

    const trimmedName = editMemberName.trim();

    if (!trimmedName) {
      setEditMemberNameError(ui.members.nameRequired);
      return;
    }

    const hasDuplicateName = members.some(
      (member) => member.id !== selectedMember.id && member.name.trim() === trimmedName,
    );

    if (hasDuplicateName) {
      setEditMemberNameError(ui.members.duplicateName);
      return;
    }

    setIsSavingEditMember(true);
    setEditMemberSaveError("");

    const now = new Date().toISOString();
    const updatedMember: Member = {
      ...selectedMember,
      name: trimmedName,
      updatedAt: now,
    };

    try {
      await repository.updateMember(updatedMember);
      setMembers((currentMembers) =>
        currentMembers.map((member) => (member.id === updatedMember.id ? updatedMember : member)),
      );
      closeEditMemberForm();
    } catch {
      setEditMemberSaveError(ui.error.memberUpdateFailed);
    } finally {
      setIsSavingEditMember(false);
    }
  }

  // ── Delete Member ──────────────────────────────────────────────────────────

  function openDeleteMemberDialog() {
    setIsDeleteMemberDialogOpen(true);
    setDeleteMemberError("");
  }

  function closeDeleteMemberDialog() {
    setIsDeleteMemberDialogOpen(false);
    setDeleteMemberError("");
  }

  async function handleConfirmDeleteMember() {
    if (!selectedMember || isDeletingMember) return;

    setIsDeletingMember(true);
    setDeleteMemberError("");

    try {
      await repository.deleteMember(selectedMember.id);
      setMembers((current) => current.filter((m) => m.id !== selectedMember.id));
      setTransactions((current) => current.filter((tx) => tx.memberId !== selectedMember.id));
      setSelectedMemberId(""); // navigate back to main screen
    } catch {
      setDeleteMemberError(ui.error.memberDeleteFailed);
      setIsDeletingMember(false);
    }
  }

  // ── Edit Transaction ───────────────────────────────────────────────────────

  function openEditTransaction(transaction: Transaction) {
    setEditingTransactionId(transaction.id);
    setEditTransactionAmount(String(transaction.amountMinor / 100));
    setEditTransactionDirection(transaction.direction);
    setEditTransactionTitle(transaction.title);
    setEditTransactionReasonIsCustom(!(ui.transaction.commonReasons as readonly string[]).includes(transaction.title));
    setEditTransactionDate(transaction.transactionDate);
    setEditTransactionNotes(transaction.notes ?? "");
    setEditTransactionErrors({});
    setEditTransactionSaveError("");
  }

  function closeEditTransaction() {
    setEditingTransactionId("");
    setEditTransactionAmount("");
    setEditTransactionDirection("member_owes_user");
    setEditTransactionTitle("");
    setEditTransactionReasonIsCustom(false);
    setEditTransactionDate("");
    setEditTransactionNotes("");
    setEditTransactionErrors({});
    setEditTransactionSaveError("");
  }

  async function handleEditTransactionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSavingEditTransaction) return;

    const transaction = transactions.find((tx) => tx.id === editingTransactionId);
    if (!transaction) return;

    const trimmedTitle = editTransactionTitle.trim();
    const errors: TransactionFormErrors = {
      amount: validateTransactionAmount(editTransactionAmount),
      title: trimmedTitle ? undefined : ui.transaction.reasonRequired,
      transactionDate: editTransactionDate ? undefined : ui.transaction.dateRequired,
    };
    const amountMinor = parseIlsInputToMinor(editTransactionAmount);

    setEditTransactionErrors(errors);

    if (Object.values(errors).some(Boolean) || amountMinor === null) return;

    setIsSavingEditTransaction(true);
    setEditTransactionSaveError("");

    const now = new Date().toISOString();
    const updatedTransaction: Transaction = {
      ...transaction,
      amountMinor,
      direction: editTransactionDirection,
      title: trimmedTitle,
      notes: editTransactionNotes.trim() || undefined,
      transactionDate: editTransactionDate,
      updatedAt: now,
    };

    try {
      const saved = await repository.updateTransaction(updatedTransaction);
      setTransactions((current) => current.map((tx) => (tx.id === saved.id ? saved : tx)));
      closeEditTransaction();
    } catch {
      setEditTransactionSaveError(ui.error.transactionUpdateFailed);
    } finally {
      setIsSavingEditTransaction(false);
    }
  }

  // ── Delete Transaction ─────────────────────────────────────────────────────

  function openDeleteTransactionDialog(transactionId: string) {
    setDeleteTransactionId(transactionId);
    setDeleteTransactionError("");
  }

  function closeDeleteTransactionDialog() {
    setDeleteTransactionId("");
    setDeleteTransactionError("");
  }

  async function handleConfirmDeleteTransaction() {
    if (!deleteTransactionId || isDeletingTransaction) return;

    setIsDeletingTransaction(true);
    setDeleteTransactionError("");

    try {
      await repository.deleteTransaction(deleteTransactionId);
      setTransactions((current) => current.filter((tx) => tx.id !== deleteTransactionId));
      closeDeleteTransactionDialog();
    } catch {
      setDeleteTransactionError(ui.error.transactionDeleteFailed);
    } finally {
      setIsDeletingTransaction(false);
    }
  }

  function closeAddMemberForm() {
    setIsAddMemberOpen(false);
    setMemberName("");
    setMemberNameError("");
    setMemberCreateError("");
  }

  async function handleAddMemberSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSavingMember) return;

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

    setIsSavingMember(true);
    setMemberCreateError("");

    const now = new Date().toISOString();
    const member: Member = {
      id: createId(),
      name: trimmedName,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const created = await repository.createMember(member);
      setMembers((currentMembers) => {
        if (currentMembers.some((currentMember) => currentMember.id === created.id)) {
          return [...currentMembers];
        }

        return [...currentMembers, created];
      });
      closeAddMemberForm();
    } catch {
      setMemberCreateError(ui.error.memberCreateFailed);
    } finally {
      setIsSavingMember(false);
    }
  }

  function openTransactionForm(memberId = "") {
    setIsTransactionFormOpen(true);
    setTransactionMemberId(memberId);
    setTransactionAmount("");
    setTransactionDirection("member_owes_user");
    setTransactionTitle("");
    setTransactionReasonIsCustom(false);
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
    setTransactionReasonIsCustom(false);
    setTransactionDate(getTodayDateIso());
    setTransactionNotes("");
    setTransactionErrors({});
    setTransactionCreateError("");
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

    if (isSavingTransaction) return;

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

    setIsSavingTransaction(true);
    setTransactionCreateError("");

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

    try {
      const created = await repository.createTransaction(transaction);
      setTransactions((currentTransactions) => [...currentTransactions, created]);
      closeTransactionForm();
    } catch {
      setTransactionCreateError(ui.error.transactionCreateFailed);
    } finally {
      setIsSavingTransaction(false);
    }
  }

  function openResetDialog() {
    if (selectedMemberBalanceMinor === 0) {
      return;
    }

    setIsResetDialogOpen(true);
  }

  function closeResetDialog() {
    setIsResetDialogOpen(false);
    setResetError("");
  }

  async function handleConfirmReset() {
    if (!selectedMember || isResetting) {
      return;
    }

    setIsResetting(true);
    setResetError("");

    try {
      const resetTransaction = await repository.resetMemberDebt(selectedMember.id);
      if (resetTransaction) {
        setTransactions((currentTransactions) => [...currentTransactions, resetTransaction]);
      }
      closeResetDialog();
    } catch {
      setResetError(ui.error.resetFailed);
    } finally {
      setIsResetting(false);
    }
  }

  function renderResetDialog() {
    if (!selectedMember) {
      return null;
    }

    const dialogBody = ui.members.resetDialogBody.replace("{memberName}", selectedMember.name);

    return (
      <Dialog isOpen={isResetDialogOpen} titleId="reset-dialog-title" onClose={closeResetDialog}>
        <Card className="dialog-card">
          <h3 id="reset-dialog-title">{ui.members.resetDialogTitle}</h3>
          <p>{dialogBody}</p>
          {resetError && (
            <p className="field-error" role="alert">
              {resetError}
            </p>
          )}
          <div className="button-row">
            <Button type="button" variant="white" onClick={closeResetDialog} disabled={isResetting}>
              {ui.members.resetDialogCancel}
            </Button>
            <Button type="button" variant="secondary" onClick={handleConfirmReset} disabled={isResetting}>
              {isResetting ? ui.loading.resetting : ui.members.resetDialogConfirm}
            </Button>
          </div>
        </Card>
      </Dialog>
    );
  }

  function renderTransactionForm() {
    return (
      <Dialog isOpen={isTransactionFormOpen} titleId="add-transaction-title" onClose={closeTransactionForm}>
        <Card className="dialog-card transaction-dialog-card">
          <button
            type="button"
            className="dialog-close"
            aria-label={ui.actions.close}
            onClick={closeTransactionForm}
            disabled={isSavingTransaction}
          >
            ×
          </button>
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
              <label>
                <input
                  type="radio"
                  name="transaction-direction"
                  value="member_returned_to_user"
                  checked={transactionDirection === "member_returned_to_user"}
                  onChange={() => setTransactionDirection("member_returned_to_user")}
                />
                <span>{ui.transaction.memberReturnedToUserLabel}</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="transaction-direction"
                  value="user_returned_to_member"
                  checked={transactionDirection === "user_returned_to_member"}
                  onChange={() => setTransactionDirection("user_returned_to_member")}
                />
                <span>{ui.transaction.userReturnedToMemberLabel}</span>
              </label>
            </fieldset>

            <label className="field">
              <span>{ui.transaction.reasonLabel}</span>
              <select
                value={transactionReasonIsCustom ? "אחר" : transactionTitle}
                onChange={(e) => {
                  if (e.target.value === "אחר") {
                    setTransactionReasonIsCustom(true);
                    setTransactionTitle("");
                  } else {
                    setTransactionReasonIsCustom(false);
                    setTransactionTitle(e.target.value);
                    setTransactionErrors((err) => ({ ...err, title: undefined }));
                  }
                }}
              >
                <option value="" disabled>{ui.transaction.reasonPlaceholder}</option>
                {ui.transaction.commonReasons.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
            {transactionReasonIsCustom && (
              <TextInput
                label=""
                value={transactionTitle}
                placeholder={ui.transaction.reasonPlaceholder}
                onChange={(event) => {
                  setTransactionTitle(event.target.value);
                  setTransactionErrors((err) => ({ ...err, title: undefined }));
                }}
                aria-invalid={transactionErrors.title ? "true" : "false"}
                aria-describedby={transactionErrors.title ? "transaction-title-error" : undefined}
              />
            )}
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
                rows={1}
                value={transactionNotes}
                placeholder={ui.transaction.notesPlaceholder}
                onChange={(event) => setTransactionNotes(event.target.value)}
              />
            </label>

            {transactionCreateError && (
              <p className="field-error" role="alert">
                {transactionCreateError}
              </p>
            )}

            <div className="button-row">
              <Button type="submit" disabled={isSavingTransaction}>
                {isSavingTransaction ? ui.loading.savingTransaction : ui.actions.save}
              </Button>
              <Button type="button" variant="white" onClick={closeTransactionForm} disabled={isSavingTransaction}>
                {ui.actions.cancel}
              </Button>
            </div>
          </form>
        </Card>
      </Dialog>
    );
  }

  function renderDeleteMemberDialog() {
    if (!selectedMember) return null;
    const dialogBody = ui.members.deleteConfirmBody.replace("{memberName}", selectedMember.name);
    return (
      <Dialog isOpen={isDeleteMemberDialogOpen} titleId="delete-member-dialog-title" onClose={closeDeleteMemberDialog}>
        <Card className="dialog-card">
          <h3 id="delete-member-dialog-title">{ui.members.deleteConfirmTitle}</h3>
          <p>{dialogBody}</p>
          {deleteMemberError && (
            <p className="field-error" role="alert">
              {deleteMemberError}
            </p>
          )}
          <div className="button-row">
            <Button type="button" variant="white" onClick={closeDeleteMemberDialog} disabled={isDeletingMember}>
              {ui.actions.cancel}
            </Button>
            <Button type="button" variant="danger" onClick={handleConfirmDeleteMember} disabled={isDeletingMember}>
              {isDeletingMember ? ui.loading.deletingMember : ui.members.deleteConfirm}
            </Button>
          </div>
        </Card>
      </Dialog>
    );
  }

  function renderDeleteTransactionDialog() {
    return (
      <Dialog
        isOpen={!!deleteTransactionId}
        titleId="delete-tx-dialog-title"
        onClose={closeDeleteTransactionDialog}
      >
        <Card className="dialog-card">
          <h3 id="delete-tx-dialog-title">{ui.transaction.deleteTransactionConfirmTitle}</h3>
          <p>{ui.transaction.deleteTransactionConfirmBody}</p>
          {deleteTransactionError && (
            <p className="field-error" role="alert">
              {deleteTransactionError}
            </p>
          )}
          <div className="button-row">
            <Button
              type="button"
              variant="white"
              onClick={closeDeleteTransactionDialog}
              disabled={isDeletingTransaction}
            >
              {ui.actions.cancel}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmDeleteTransaction}
              disabled={isDeletingTransaction}
            >
              {isDeletingTransaction ? ui.loading.deletingTransaction : ui.transaction.deleteTransactionConfirm}
            </Button>
          </div>
        </Card>
      </Dialog>
    );
  }

  function renderEditTransactionForm() {
    return (
      <Dialog isOpen={!!editingTransactionId} titleId="edit-transaction-title" onClose={closeEditTransaction}>
        <Card className="dialog-card transaction-dialog-card">
          <button
            type="button"
            className="dialog-close"
            aria-label={ui.actions.close}
            onClick={closeEditTransaction}
            disabled={isSavingEditTransaction}
          >
            ×
          </button>
          <form
            className="form-stack"
            aria-labelledby="edit-transaction-title"
            onSubmit={handleEditTransactionSubmit}
          >
          <div className="form-heading">
            <h3 id="edit-transaction-title">{ui.transaction.editTransactionTitle}</h3>
          </div>
          <TextInput
            label={ui.transaction.amountLabel}
            value={editTransactionAmount}
            inputMode="decimal"
            autoComplete="off"
            dir="ltr"
            placeholder={ui.transaction.amountPlaceholder}
            onChange={(event) => {
              setEditTransactionAmount(event.target.value);
              setEditTransactionErrors((e) => ({ ...e, amount: undefined }));
            }}
            aria-invalid={editTransactionErrors.amount ? "true" : "false"}
            aria-describedby={editTransactionErrors.amount ? "edit-tx-amount-error" : undefined}
            autoFocus
          />
          {editTransactionErrors.amount && (
            <p className="field-error" id="edit-tx-amount-error" role="alert">
              {editTransactionErrors.amount}
            </p>
          )}
          <fieldset className="field radio-group">
            <legend>{ui.transaction.directionLabel}</legend>
            <label>
              <input
                type="radio"
                name="edit-tx-direction"
                value="member_owes_user"
                checked={editTransactionDirection === "member_owes_user"}
                onChange={() => setEditTransactionDirection("member_owes_user")}
              />
              <span>{ui.transaction.memberOwesUserLabel}</span>
            </label>
            <label>
              <input
                type="radio"
                name="edit-tx-direction"
                value="user_owes_member"
                checked={editTransactionDirection === "user_owes_member"}
                onChange={() => setEditTransactionDirection("user_owes_member")}
              />
              <span>{ui.transaction.userOwesMemberLabel}</span>
            </label>
            <label>
              <input
                type="radio"
                name="edit-tx-direction"
                value="member_returned_to_user"
                checked={editTransactionDirection === "member_returned_to_user"}
                onChange={() => setEditTransactionDirection("member_returned_to_user")}
              />
              <span>{ui.transaction.memberReturnedToUserLabel}</span>
            </label>
            <label>
              <input
                type="radio"
                name="edit-tx-direction"
                value="user_returned_to_member"
                checked={editTransactionDirection === "user_returned_to_member"}
                onChange={() => setEditTransactionDirection("user_returned_to_member")}
              />
              <span>{ui.transaction.userReturnedToMemberLabel}</span>
            </label>
          </fieldset>
          <label className="field">
            <span>{ui.transaction.reasonLabel}</span>
            <select
              value={editTransactionReasonIsCustom ? "אחר" : editTransactionTitle}
              onChange={(e) => {
                if (e.target.value === "אחר") {
                  setEditTransactionReasonIsCustom(true);
                  setEditTransactionTitle("");
                } else {
                  setEditTransactionReasonIsCustom(false);
                  setEditTransactionTitle(e.target.value);
                  setEditTransactionErrors((err) => ({ ...err, title: undefined }));
                }
              }}
            >
              <option value="" disabled>{ui.transaction.reasonPlaceholder}</option>
              {ui.transaction.commonReasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
          {editTransactionReasonIsCustom && (
            <TextInput
              label=""
              value={editTransactionTitle}
              placeholder={ui.transaction.reasonPlaceholder}
              onChange={(event) => {
                setEditTransactionTitle(event.target.value);
                setEditTransactionErrors((err) => ({ ...err, title: undefined }));
              }}
              aria-invalid={editTransactionErrors.title ? "true" : "false"}
              aria-describedby={editTransactionErrors.title ? "edit-tx-title-error" : undefined}
            />
          )}
          {editTransactionErrors.title && (
            <p className="field-error" id="edit-tx-title-error" role="alert">
              {editTransactionErrors.title}
            </p>
          )}
          <TextInput
            label={ui.transaction.dateLabel}
            type="date"
            value={editTransactionDate}
            onChange={(event) => {
              setEditTransactionDate(event.target.value);
              setEditTransactionErrors((e) => ({ ...e, transactionDate: undefined }));
            }}
          />
          <label className="field" htmlFor="edit-tx-notes">
            <span>{ui.transaction.notesLabel}</span>
            <textarea
              id="edit-tx-notes"
              rows={1}
              value={editTransactionNotes}
              placeholder={ui.transaction.notesPlaceholder}
              onChange={(event) => setEditTransactionNotes(event.target.value)}
            />
          </label>
          {editTransactionSaveError && (
            <p className="field-error" role="alert">
              {editTransactionSaveError}
            </p>
          )}
          <div className="button-row">
            <Button type="submit" disabled={isSavingEditTransaction}>
              {isSavingEditTransaction ? ui.loading.savingEditTransaction : ui.actions.save}
            </Button>
            <Button type="button" variant="white" onClick={closeEditTransaction} disabled={isSavingEditTransaction}>
              {ui.actions.cancel}
            </Button>
          </div>
          </form>
        </Card>
      </Dialog>
    );
  }

  if (selectedMember) {
    const isResetDisabled = selectedMemberBalanceMinor === 0;

    return (
      <AppShell title={ui.app.title} subtitle={ui.app.subtitle} userEmail={userEmail} onLogout={onLogout}>
        <section className="section-stack" aria-labelledby="member-detail-title">
          <Button type="button" variant="ghost" className="back-button" onClick={() => setSelectedMemberId("")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flexShrink: 0}}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {ui.actions.back}
          </Button>
          <Card className="member-detail-card">
            {isEditMemberOpen ? (
              <form className="form-stack" aria-labelledby="member-detail-title" onSubmit={handleEditMemberSubmit}>
                <div className="form-heading">
                  <h2 id="member-detail-title">{ui.members.editTitle}</h2>
                </div>
                <TextInput
                  label={ui.members.nameLabel}
                  value={editMemberName}
                  onChange={(event) => {
                    setEditMemberName(event.target.value);
                    setEditMemberNameError("");
                  }}
                  aria-invalid={editMemberNameError ? "true" : "false"}
                  aria-describedby={editMemberNameError ? "edit-member-name-error" : undefined}
                  autoFocus
                />
                {editMemberNameError && (
                  <p className="field-error" id="edit-member-name-error" role="alert">
                    {editMemberNameError}
                  </p>
                )}
                {editMemberSaveError && (
                  <p className="field-error" role="alert">
                    {editMemberSaveError}
                  </p>
                )}
                <div className="button-row">
                  <Button type="submit" disabled={isSavingEditMember}>
                    {isSavingEditMember ? ui.loading.savingMember : ui.actions.save}
                  </Button>
                  <Button type="button" variant="white" onClick={closeEditMemberForm} disabled={isSavingEditMember}>
                    {ui.actions.cancel}
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div className="member-detail-header">
                  <p className="eyebrow">{ui.members.detailTitle}</p>
                  <button
                    type="button"
                    className="icon-button icon-button-danger"
                    onClick={openDeleteMemberDialog}
                    aria-label={ui.members.deleteName}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
                <div className="member-name-row">
                  <h2 id="member-detail-title">{selectedMember.name}</h2>
                  <button
                    type="button"
                    className="icon-button icon-button-edit"
                    onClick={openEditMemberForm}
                    aria-label={ui.members.editName}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
                <div className="balance-panel">
                  <p className="summary-label">{ui.members.currentBalance}</p>
                  <p className={balanceToneClass(selectedMemberBalanceMinor)}>
                    {formatMemberBalance(selectedMember, selectedMemberBalanceMinor)}
                  </p>
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
              </>
            )}
          </Card>
        </section>

        {renderResetDialog()}
        {renderDeleteMemberDialog()}
        {renderDeleteTransactionDialog()}

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
                  <div className="button-row transaction-card-actions">
                    <Button type="button" variant="white" onClick={() => openEditTransaction(transaction)}>
                      {ui.actions.edit}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => openDeleteTransactionDialog(transaction.id)}
                    >
                      {ui.actions.delete}
                    </Button>
                  </div>
                </Card>
            ))}
          </div>
        </section>

        {renderEditTransactionForm()}
      </AppShell>
    );
  }

  return (
    <AppShell title={ui.app.title} subtitle={ui.app.subtitle} userEmail={userEmail} onLogout={onLogout}>
      <section className="hero-section" aria-labelledby="quick-action-title">
        <div>
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
          <Card className="summary-card summary-card--positive">
            <div className="summary-card-head">
              <span className="summary-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="17" y1="7" x2="7" y2="17" />
                  <polyline points="17 17 7 17 7 7" />
                </svg>
              </span>
              <p className="summary-label">{ui.overview.totalOwedToUser}</p>
            </div>
            <p className="summary-amount">{formatIls(balanceSummary.totalOwedToUserMinor)}</p>
          </Card>
          <Card className="summary-card summary-card--negative">
            <div className="summary-card-head">
              <span className="summary-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </span>
              <p className="summary-label">{ui.overview.totalUserOwes}</p>
            </div>
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
              {memberCreateError && (
                <p className="field-error" role="alert">
                  {memberCreateError}
                </p>
              )}
              <div className="button-row">
                <Button type="submit" disabled={isSavingMember}>
                  {isSavingMember ? ui.loading.savingMember : ui.actions.save}
                </Button>
                <Button type="button" variant="white" onClick={closeAddMemberForm} disabled={isSavingMember}>
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
          {loadError && (
            <p className="error-state" role="alert">
              {loadError}
            </p>
          )}
          {!isLoading && !loadError && memberListItems.length === 0 && <p>{ui.members.empty}</p>}
          {memberListItems.map((member) => (
            <Card key={member.id} className="member-card">
              <div className="member-row">
                <div className="member-identity">
                  <span className="member-avatar" aria-hidden="true">{getMemberInitial(member.name)}</span>
                  <div className="member-identity-text">
                    <h3>{member.name}</h3>
                    <p className={balanceToneClass(member.balanceMinor)}>
                      {formatMemberBalance(member, member.balanceMinor)}
                    </p>
                  </div>
                </div>
                <div className="member-actions">
                  <Button type="button" onClick={() => openTransactionForm(member.id)}>
                    {ui.actions.addTransaction}
                  </Button>
                  <Button
                    type="button"
                    variant="white"
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
