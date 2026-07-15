import "server-only";
import {
  contribute,
  financeEngine,
  savingsProgress,
  type Account,
  type Budget,
  type CreateAccountInput,
  type SavingsGoal,
  type SavingsProgress,
  type Subscription,
  type Transaction,
  type TransactionDirection,
} from "@myos/core/finance";
import type { Database } from "@myos/db";
import * as repo from "./repository";
import {
  accountRowToAccount,
  budgetRowToBudget,
  savingsRowToGoal,
  subscriptionRowToSubscription,
  transactionRowToTransaction,
  transactionToColumns,
} from "./mapper";

/**
 * FinanceService (Sprint 2.11). Bridges the pure FinanceEngine with persistence.
 * Balances / cash flow / budgets / forecasts are derived on read. Manual entry
 * only. Not a banking app.
 */
export async function accounts(db: Database): Promise<(Account & { balance: number })[]> {
  const [accountRows, txnRows] = await Promise.all([
    repo.listAccounts(db),
    repo.listTransactions(db),
  ]);
  const list = accountRows.map(accountRowToAccount);
  const txns = txnRows.map(transactionRowToTransaction);
  return list.map((a) => ({ ...a, balance: financeEngine.balance(a, txns) }));
}

export async function createAccount(db: Database, input: CreateAccountInput): Promise<Account> {
  const row = await repo.insertAccount(db, {
    name: input.name,
    type: input.type,
    openingBalance: input.openingBalance,
    institution: input.institution,
    ...(input.currency ? { currency: input.currency } : {}),
  });
  return accountRowToAccount(row);
}

export async function transactions(db: Database): Promise<Transaction[]> {
  return (await repo.listTransactions(db)).map(transactionRowToTransaction);
}

export async function createTransaction(
  db: Database,
  input: {
    accountId: string;
    amount: number;
    category?: string | undefined;
    direction?: TransactionDirection | undefined;
    merchant?: string | undefined;
    description?: string | undefined;
    occurredAt?: string | undefined;
    projectId?: string | null | undefined;
  },
): Promise<Transaction> {
  const draft = financeEngine.createTransaction(input, new Date());
  const errors = financeEngine.validateTransaction(draft);
  if (errors.length) throw new Error(errors.join(" "));
  const row = await repo.insertTransaction(db, transactionToColumns(draft));
  return transactionRowToTransaction(row);
}

export async function record(
  db: Database,
  direction: "income" | "expense",
  input: {
    accountId: string;
    amount: number;
    category?: string | undefined;
    merchant?: string | undefined;
    description?: string | undefined;
    occurredAt?: string | undefined;
  },
): Promise<Transaction> {
  return createTransaction(db, { ...input, direction });
}

export async function removeTransaction(db: Database, id: string): Promise<{ id: string }> {
  await repo.deleteTransaction(db, id);
  return { id };
}

export async function transfer(
  db: Database,
  input: { fromAccountId: string; toAccountId: string; amount: number },
): Promise<{ ok: true }> {
  const [from, to] = financeEngine.transfer(
    input.fromAccountId,
    input.toAccountId,
    input.amount,
    new Date(),
  );
  await repo.insertTransactions(db, [transactionToColumns(from), transactionToColumns(to)]);
  return { ok: true };
}

export async function budgets(db: Database): Promise<Budget[]> {
  return (await repo.listBudgets(db)).map(budgetRowToBudget);
}

export async function createBudget(
  db: Database,
  input: { category: string; monthlyLimit: number; warningThreshold: number },
): Promise<Budget> {
  return budgetRowToBudget(await repo.insertBudget(db, input));
}

export async function subscriptions(db: Database): Promise<Subscription[]> {
  return (await repo.listSubscriptions(db)).map(subscriptionRowToSubscription);
}

export async function createSubscription(
  db: Database,
  input: {
    name: string;
    amount: number;
    billingCycle: Subscription["billingCycle"];
    nextPayment: string;
  },
): Promise<Subscription> {
  return subscriptionRowToSubscription(await repo.insertSubscription(db, input));
}

export async function savings(db: Database): Promise<SavingsProgress[]> {
  const goals = (await repo.listSavings(db)).map(savingsRowToGoal);
  const now = new Date();
  return goals.map((g) => savingsProgress(g, 0, now));
}

export async function createSavingsGoal(
  db: Database,
  input: { title: string; targetAmount: number; currentAmount: number; deadline: string | null },
): Promise<SavingsGoal> {
  return savingsRowToGoal(await repo.insertSavingsGoal(db, input));
}

export async function contributeSavings(
  db: Database,
  input: { id: string; amount: number },
): Promise<SavingsGoal> {
  const row = await repo.getSavingsGoal(db, input.id);
  if (!row) throw new Error("Savings goal not found");
  const next = contribute(savingsRowToGoal(row), input.amount, new Date());
  const updated = await repo.updateSavingsGoal(db, input.id, {
    currentAmount: next.currentAmount,
    completedAt: next.completedAt ? new Date(next.completedAt) : null,
  });
  return savingsRowToGoal(updated);
}
