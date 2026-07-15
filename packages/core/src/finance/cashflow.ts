import { isExpense, isIncome } from "./transactions";
import { monthKey } from "./budgets";
import type { CashFlow, Transaction } from "./types";

/**
 * Cash flow engine (Sprint 2.11). Deterministic income vs expenses over a set of
 * transactions (transfers excluded — they move value, not create it).
 */
export function cashFlow(transactions: Transaction[]): CashFlow {
  const income = round(transactions.filter(isIncome).reduce((s, t) => s + t.amount, 0));
  const expenses = round(transactions.filter(isExpense).reduce((s, t) => s + t.amount, 0));
  const net = round(income - expenses);
  return {
    income,
    expenses,
    net,
    direction: net > 0 ? "positive" : net < 0 ? "negative" : "flat",
  };
}

export function cashFlowForMonth(transactions: Transaction[], month: string): CashFlow {
  return cashFlow(transactions.filter((t) => monthKey(t.occurredAt) === month));
}

/** Total spend per category (expenses only), highest first. */
export function spendByCategory(
  transactions: Transaction[],
): { category: string; amount: number }[] {
  const map = new Map<string, number>();
  for (const t of transactions.filter(isExpense)) {
    map.set(t.category, round((map.get(t.category) ?? 0) + t.amount));
  }
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
