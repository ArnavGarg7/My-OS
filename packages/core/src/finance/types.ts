import type { AccountType, BillingCycle, Category, TransactionDirection } from "./constants";

/**
 * Finance domain types (Sprint 2.11). Raw entities (accounts, transactions,
 * budgets, subscriptions, savings) + derived analytics (balances, cash flow,
 * forecasts, summaries). Balances/derived values are always computed.
 */
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  /** Opening balance; the live balance is derived from transaction history. */
  openingBalance: number;
  institution: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number; // always positive; direction gives the sign
  category: Category;
  direction: TransactionDirection;
  merchant: string;
  description: string;
  occurredAt: string; // ISO
  createdAt: string; // ISO
  /** Optional project link (Sprint 2.11) — ids only, no duplication. */
  projectId: string | null;
}

export interface Budget {
  id: string;
  category: Category;
  monthlyLimit: number;
  warningThreshold: number; // 0–1
  active: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  nextPayment: string; // ISO date
  active: boolean;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null; // ISO date
  completedAt: string | null; // ISO
}

// --- derived analytics ---
export interface AccountBalance {
  accountId: string;
  balance: number;
}

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  usagePercent: number;
  state: "ok" | "warning" | "exceeded";
}

export interface CashFlow {
  income: number;
  expenses: number;
  net: number;
  direction: "positive" | "negative" | "flat";
}

export interface SavingsProgress {
  goal: SavingsGoal;
  progressPercent: number;
  remaining: number;
  projectedCompletion: string | null; // ISO date
  onTrack: boolean;
}

export interface SubscriptionSummary {
  monthlyRecurring: number;
  yearlyRecurring: number;
  activeCount: number;
  upcoming: { name: string; amount: number; dueInDays: number }[];
}

export interface Forecast {
  projectedMonthEndBalance: number;
  projectedExpenses: number;
  projectedIncome: number;
  recurringExpenses: number;
  averageDailySpend: number;
}

export interface FinanceSummary {
  date: string;
  netWorth: number;
  cashAvailable: number;
  cashFlow: CashFlow;
  budgets: BudgetStatus[];
  overallBudgetPercent: number;
  subscriptions: SubscriptionSummary;
  savings: SavingsProgress[];
  forecast: Forecast;
}

/** Deterministic signals exposed to Decision / Morning. */
export interface FinanceSignals {
  cashAvailable: number;
  cashFlowDirection: "positive" | "negative" | "flat";
  overBudgetCategories: string[];
  budgetUsagePercent: number;
  largePaymentDueToday: { name: string; amount: number } | null;
  savingsNearlyComplete: { title: string; remaining: number } | null;
  monthlyRecurring: number;
}
