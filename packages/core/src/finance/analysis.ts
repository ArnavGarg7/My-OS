import { isExpense } from "./transactions";
import { monthKey } from "./budgets";
import { cashFlow } from "./cashflow";
import type { CashFlow, Transaction } from "./types";

/**
 * Spending analysis engine (Phase 2). Deterministic aggregations over transactions for the analysis
 * screen: period ranges, category breakdown with shares, income-vs-expense, and a month-over-month
 * trend. Pure — all date math is UTC and driven by a caller-supplied "today", so the same inputs always
 * produce the same output. No AI, no randomness.
 */

export type AnalysisPeriodId = "this-week" | "this-month" | "last-month" | "custom";

export interface AnalysisRange {
  /** Inclusive start date, YYYY-MM-DD. */
  start: string;
  /** Inclusive end date, YYYY-MM-DD. */
  end: string;
  label: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/**
 * Resolve a period id to an inclusive date range, given today (YYYY-MM-DD). "this-week" starts on
 * Monday; "custom" echoes today for both ends (the UI supplies explicit dates instead).
 */
export function resolvePeriod(period: AnalysisPeriodId, todayISO: string): AnalysisRange {
  const today = new Date(`${todayISO}T00:00:00Z`);
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  switch (period) {
    case "this-week": {
      // Monday-based week: JS day 0=Sun..6=Sat → offset to previous Monday.
      const offset = (today.getUTCDay() + 6) % 7;
      const start = new Date(Date.UTC(y, m, today.getUTCDate() - offset));
      return { start: iso(start), end: todayISO, label: "This week" };
    }
    case "this-month":
      return { start: iso(new Date(Date.UTC(y, m, 1))), end: todayISO, label: "This month" };
    case "last-month": {
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 0)); // day 0 of this month = last day of previous
      return { start: iso(start), end: iso(end), label: "Last month" };
    }
    case "custom":
      return { start: todayISO, end: todayISO, label: "Custom" };
  }
}

/** Transactions whose date (occurredAt) falls within [start, end] inclusive. */
export function transactionsInRange(
  transactions: Transaction[],
  start: string,
  end: string,
): Transaction[] {
  return transactions.filter((t) => {
    const d = t.occurredAt.slice(0, 10);
    return d >= start && d <= end;
  });
}

export interface CategoryShare {
  category: string;
  amount: number;
  /** Share of total expenses, 0–100, rounded to a whole percent. */
  percent: number;
}

/** Expense total per category with each category's share of the total, highest first. */
export function categoryBreakdown(transactions: Transaction[]): CategoryShare[] {
  const map = new Map<string, number>();
  for (const t of transactions.filter(isExpense)) {
    map.set(t.category, round((map.get(t.category) ?? 0) + t.amount));
  }
  const total = [...map.values()].reduce((s, n) => s + n, 0);
  return [...map.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      percent: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/** Income vs expenses over a set of transactions (transfers excluded). */
export function incomeVsExpense(transactions: Transaction[]): CashFlow {
  return cashFlow(transactions);
}

export interface MonthTrendPoint extends CashFlow {
  /** Month key, YYYY-MM. */
  month: string;
}

/**
 * Income/expense/net for each of the last `months` calendar months ending with the month of `todayISO`,
 * oldest first. Months with no transactions appear as zeroes so the trend has no gaps.
 */
export function monthlyTrend(
  transactions: Transaction[],
  months: number,
  todayISO: string,
): MonthTrendPoint[] {
  const today = new Date(`${todayISO}T00:00:00Z`);
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  const points: MonthTrendPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const key = monthKey(iso(new Date(Date.UTC(y, m - i, 1))));
    const inMonth = transactions.filter((t) => monthKey(t.occurredAt) === key);
    points.push({ month: key, ...cashFlow(inMonth) });
  }
  return points;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
