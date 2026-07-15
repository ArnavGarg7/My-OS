import { isExpense, isIncome } from "./transactions";
import type { Transaction } from "./types";
import type { Category, TransactionDirection } from "./constants";

/**
 * Finance selectors + search (Sprint 2.11). Deterministic read helpers and
 * keyword search over transactions (merchant / description / category).
 */
export interface TransactionFilter {
  accountId?: string | undefined;
  category?: Category | undefined;
  direction?: TransactionDirection | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

export function filterTransactions(
  transactions: Transaction[],
  filter: TransactionFilter,
): Transaction[] {
  return transactions.filter((t) => {
    if (filter.accountId && t.accountId !== filter.accountId) return false;
    if (filter.category && t.category !== filter.category) return false;
    if (filter.direction && t.direction !== filter.direction) return false;
    if (filter.from && t.occurredAt < filter.from) return false;
    if (filter.to && t.occurredAt > filter.to) return false;
    return true;
  });
}

export function sortByRecent(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export function searchTransactions(transactions: Transaction[], query: string): Transaction[] {
  const q = query.trim().toLowerCase();
  if (!q) return sortByRecent(transactions);
  return sortByRecent(
    transactions.filter(
      (t) =>
        t.merchant.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        String(t.category).toLowerCase().includes(q),
    ),
  );
}

export function totalIncome(transactions: Transaction[]): number {
  return round(transactions.filter(isIncome).reduce((s, t) => s + t.amount, 0));
}

export function totalExpenses(transactions: Transaction[]): number {
  return round(transactions.filter(isExpense).reduce((s, t) => s + t.amount, 0));
}

/** Expenses linked to a given project (Sprint 2.11 project integration). */
export function expensesForProject(transactions: Transaction[], projectId: string): Transaction[] {
  return transactions.filter((t) => isExpense(t) && t.projectId === projectId);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
