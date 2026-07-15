import { SPEND_WINDOW_DAYS } from "./constants";
import { isExpense, isIncome } from "./transactions";
import { monthlyRecurring } from "./subscriptions";
import type { Forecast, Subscription, Transaction } from "./types";

/**
 * Forecast engine (Sprint 2.11). Rule-based, deterministic — projects month-end
 * balance from the recent average daily spend, known recurring subscriptions and
 * observed income. No machine learning.
 */
const DAY_MS = 86_400_000;

/** Average daily spend over the trailing window. */
export function averageDailySpend(
  transactions: Transaction[],
  now: Date,
  window = SPEND_WINDOW_DAYS,
): number {
  const cutoff = now.getTime() - window * DAY_MS;
  const recent = transactions.filter(
    (t) => isExpense(t) && new Date(t.occurredAt).getTime() >= cutoff,
  );
  const total = recent.reduce((s, t) => s + t.amount, 0);
  return round(total / window);
}

/** Average monthly income observed over the window (scaled to 30 days). */
export function averageMonthlyIncome(
  transactions: Transaction[],
  now: Date,
  window = SPEND_WINDOW_DAYS,
): number {
  const cutoff = now.getTime() - window * DAY_MS;
  const recent = transactions.filter(
    (t) => isIncome(t) && new Date(t.occurredAt).getTime() >= cutoff,
  );
  const total = recent.reduce((s, t) => s + t.amount, 0);
  return round((total / window) * 30);
}

export function forecast(
  currentBalance: number,
  transactions: Transaction[],
  subscriptions: Subscription[],
  now: Date,
): Forecast {
  const daysLeft = daysLeftInMonth(now);
  const dailySpend = averageDailySpend(transactions, now);
  const recurring = monthlyRecurring(subscriptions);
  const projectedExpenses = round(dailySpend * daysLeft + prorateRecurring(recurring, daysLeft));
  const projectedIncome = round((averageMonthlyIncome(transactions, now) / 30) * daysLeft);
  return {
    projectedMonthEndBalance: round(currentBalance - projectedExpenses + projectedIncome),
    projectedExpenses,
    projectedIncome,
    recurringExpenses: recurring,
    averageDailySpend: dailySpend,
  };
}

function prorateRecurring(monthlyRecurringAmount: number, daysLeft: number): number {
  return (monthlyRecurringAmount / 30) * daysLeft;
}

export function daysLeftInMonth(now: Date): number {
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return Math.max(0, end.getDate() - now.getDate());
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
