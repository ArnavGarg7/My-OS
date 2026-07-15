import { clampScore, round } from "./metrics";
import type { FinanceAnalyticsInput } from "./types";

/**
 * Finance analytics (Sprint 2.14). Turns the Finance engine's summary into a
 * 0–100 financial-health score from budget adherence + savings rate, plus the
 * spending/cash-flow figures. Deterministic — single currency (₹).
 */
export interface FinanceMetrics {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  budgetAdherence: number; // 0–100
  savingsRate: number; // 0–100
  subscriptionCost: number;
  score: number; // 0–100
}

export function computeFinance(input?: FinanceAnalyticsInput): FinanceMetrics {
  const f = input ?? {
    totalIncome: 0,
    totalExpense: 0,
    budgetAdherence: 0,
    savingsRate: 0,
    subscriptionCost: 0,
  };
  const netCashFlow = round(f.totalIncome - f.totalExpense, 2);
  const score = clampScore(f.budgetAdherence * 0.6 + f.savingsRate * 0.4);

  return {
    totalIncome: round(f.totalIncome, 2),
    totalExpense: round(f.totalExpense, 2),
    netCashFlow,
    budgetAdherence: clampScore(f.budgetAdherence),
    savingsRate: clampScore(f.savingsRate),
    subscriptionCost: round(f.subscriptionCost, 2),
    score,
  };
}
