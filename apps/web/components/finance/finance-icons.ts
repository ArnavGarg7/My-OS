import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  CreditCard,
  Landmark,
  PiggyBank,
  Repeat,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { AccountType, BillingCycle, TransactionDirection } from "@myos/core/finance";

/** Presentational icon + label maps for the Finance UI (Sprint 2.11). */
export const ACCOUNT_ICON: Record<AccountType, LucideIcon> = {
  checking: Landmark,
  savings: PiggyBank,
  cash: Banknote,
  credit: CreditCard,
  investment: TrendingUp,
};

export const ACCOUNT_LABEL: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  cash: "Cash",
  credit: "Credit",
  investment: "Investment",
};

export const DIRECTION_ICON: Record<TransactionDirection, LucideIcon> = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowLeftRight,
};

export const DIRECTION_TONE: Record<TransactionDirection, string> = {
  income: "text-success",
  expense: "text-danger",
  transfer: "text-fg-subtle",
};

export const BUDGET_TONE = {
  ok: "text-success",
  warning: "text-warning",
  exceeded: "text-danger",
} as const;

export const CYCLE_LABEL: Record<BillingCycle, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export const FINANCE_ICONS = { wallet: Wallet, subscription: Repeat, savings: PiggyBank };

/** Format a number as a compact currency string (single-currency this sprint). */
export function formatMoney(amount: number, currency = "₹"): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${currency}${Math.abs(Math.round(amount)).toLocaleString()}`;
}
