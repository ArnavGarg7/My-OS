/**
 * Finance domain constants (Sprint 2.11). The deterministic personal financial
 * OS — accounts, transactions, budgets, subscriptions, cash flow and savings.
 * Not a banking app. No AI, no randomness. Single currency per the sprint scope.
 */

export const ACCOUNT_TYPES = ["checking", "savings", "cash", "credit", "investment"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

/** Accounts whose balance counts as a liability (subtracted from net worth). */
export const LIABILITY_TYPES: AccountType[] = ["credit"];

export const TRANSACTION_DIRECTIONS = ["income", "expense", "transfer"] as const;
export type TransactionDirection = (typeof TRANSACTION_DIRECTIONS)[number];

export const BILLING_CYCLES = ["weekly", "monthly", "quarterly", "yearly"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

/** How many times a cycle occurs per year (for normalising recurring spend). */
export const CYCLES_PER_YEAR: Record<BillingCycle, number> = {
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

/** Default spend categories (user-managed; parser maps keywords to these). */
export const DEFAULT_CATEGORIES = [
  "groceries",
  "dining",
  "transport",
  "housing",
  "utilities",
  "entertainment",
  "health",
  "shopping",
  "subscriptions",
  "income",
  "savings",
  "other",
] as const;
export type Category = (typeof DEFAULT_CATEGORIES)[number] | (string & {});

/** Default share of a monthly limit at which a budget warns (80%). */
export const DEFAULT_WARNING_THRESHOLD = 0.8;

/** A subscription / payment due within this many days is "upcoming". */
export const UPCOMING_PAYMENT_DAYS = 7;

/** A savings goal at/above this completion is "nearly complete". */
export const SAVINGS_NEARLY_DONE = 0.9;

/** Rolling window (days) used to estimate an average daily spend for forecasts. */
export const SPEND_WINDOW_DAYS = 30;

/** ISO currency code assumed across the app for this sprint. */
export const DEFAULT_CURRENCY = "INR";
