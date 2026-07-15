import { isExpense } from "./transactions";
import type { Budget, BudgetStatus, Transaction } from "./types";

/**
 * Budget engine (Sprint 2.11). Deterministic monthly usage, remaining and
 * warning/exceeded state per category. Spend is summed from expense
 * transactions in the given month.
 */
export function monthKey(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}

export function spentInCategory(
  transactions: Transaction[],
  category: string,
  month: string,
): number {
  return round(
    transactions
      .filter((t) => isExpense(t) && t.category === category && monthKey(t.occurredAt) === month)
      .reduce((sum, t) => sum + t.amount, 0),
  );
}

export function budgetStatus(
  budget: Budget,
  transactions: Transaction[],
  month: string,
): BudgetStatus {
  const spent = spentInCategory(transactions, budget.category, month);
  const remaining = round(budget.monthlyLimit - spent);
  const usagePercent =
    budget.monthlyLimit > 0 ? Math.round((spent / budget.monthlyLimit) * 100) : 0;
  let state: BudgetStatus["state"] = "ok";
  if (spent > budget.monthlyLimit) state = "exceeded";
  else if (spent >= budget.monthlyLimit * budget.warningThreshold) state = "warning";
  return { budget, spent, remaining, usagePercent, state };
}

export function allBudgetStatuses(
  budgets: Budget[],
  transactions: Transaction[],
  month: string,
): BudgetStatus[] {
  return budgets.filter((b) => b.active).map((b) => budgetStatus(b, transactions, month));
}

/** Overall budget usage across active budgets (0–100+). */
export function overallUsage(statuses: BudgetStatus[]): number {
  const limit = statuses.reduce((sum, s) => sum + s.budget.monthlyLimit, 0);
  const spent = statuses.reduce((sum, s) => sum + s.spent, 0);
  return limit > 0 ? Math.round((spent / limit) * 100) : 0;
}

export function exceededCategories(statuses: BudgetStatus[]): string[] {
  return statuses.filter((s) => s.state === "exceeded").map((s) => s.budget.category);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
