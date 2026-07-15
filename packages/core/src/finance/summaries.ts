import { cashAvailable, netWorth } from "./accounts";
import { allBudgetStatuses, exceededCategories, monthKey, overallUsage } from "./budgets";
import { cashFlowForMonth } from "./cashflow";
import { dueToday, summarizeSubscriptions } from "./subscriptions";
import { isNearlyComplete, remaining, savingsProgress } from "./savings";
import { forecast } from "./forecasting";
import type {
  Account,
  Budget,
  FinanceSignals,
  FinanceSummary,
  SavingsGoal,
  Subscription,
  Transaction,
} from "./types";

/**
 * Finance summaries (Sprint 2.11). Assemble the deterministic FinanceSummary and
 * the cross-module FinanceSignals from raw entities. Everything is derived.
 */
export interface SummaryInput {
  date: string; // YYYY-MM-DD
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  subscriptions: Subscription[];
  savings: SavingsGoal[];
  monthlyContribution?: number;
  now?: Date;
}

export function financeSummary(input: SummaryInput): FinanceSummary {
  const now = input.now ?? new Date(`${input.date}T12:00:00`);
  const month = monthKey(`${input.date}T00:00:00`);
  const cash = cashAvailable(input.accounts, input.transactions);
  const budgetStatuses = allBudgetStatuses(input.budgets, input.transactions, month);
  const contribution = input.monthlyContribution ?? 0;

  return {
    date: input.date,
    netWorth: netWorth(input.accounts, input.transactions),
    cashAvailable: cash,
    cashFlow: cashFlowForMonth(input.transactions, month),
    budgets: budgetStatuses,
    overallBudgetPercent: overallUsage(budgetStatuses),
    subscriptions: summarizeSubscriptions(input.subscriptions, now),
    savings: input.savings.map((g) => savingsProgress(g, contribution, now)),
    forecast: forecast(cash, input.transactions, input.subscriptions, now),
  };
}

export function financeSignals(input: SummaryInput): FinanceSignals {
  const now = input.now ?? new Date(`${input.date}T12:00:00`);
  const summary = financeSummary(input);
  const due = dueToday(input.subscriptions, now).sort((a, b) => b.amount - a.amount)[0] ?? null;
  const nearly = input.savings.find((g) => isNearlyComplete(g)) ?? null;

  return {
    cashAvailable: summary.cashAvailable,
    cashFlowDirection: summary.cashFlow.direction,
    overBudgetCategories: exceededCategories(summary.budgets),
    budgetUsagePercent: summary.overallBudgetPercent,
    largePaymentDueToday: due ? { name: due.name, amount: due.amount } : null,
    savingsNearlyComplete: nearly ? { title: nearly.title, remaining: remaining(nearly) } : null,
    monthlyRecurring: summary.subscriptions.monthlyRecurring,
  };
}
