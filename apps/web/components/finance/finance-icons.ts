import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  Car,
  Clapperboard,
  CreditCard,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  MoreHorizontal,
  PiggyBank,
  Plane,
  Plug,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  categoriesForGroup,
  findCategory,
  type AccountType,
  type BillingCycle,
  type CategoryGroup,
  type CustomCategory,
  type TransactionDirection,
} from "@myos/core/finance";

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

/** Category icon keys (from the core catalog) → lucide icons. Falls back to `other`. */
export const CATEGORY_ICON: Record<string, LucideIcon> = {
  groceries: ShoppingCart,
  dining: Utensils,
  transport: Car,
  housing: Home,
  utilities: Plug,
  entertainment: Clapperboard,
  health: HeartPulse,
  shopping: ShoppingBag,
  subscriptions: Repeat,
  education: GraduationCap,
  travel: Plane,
  personal: Sparkles,
  gifts: Gift,
  income: Banknote,
  savings: PiggyBank,
  other: MoreHorizontal,
};

/** Resolve a category icon key to an icon, defaulting to the `other` icon. */
export function categoryIcon(key: string): LucideIcon {
  return CATEGORY_ICON[key] ?? MoreHorizontal;
}

export interface CategoryOption {
  id: string;
  label: string;
  icon: string;
}

/** Active categories (built-in + custom, archived removed) for a group, built-ins first. */
export function categoryOptions(group: CategoryGroup, custom: CustomCategory[]): CategoryOption[] {
  const seeded = categoriesForGroup(group).map((c) => ({ id: c.id, label: c.label, icon: c.icon }));
  const extra = custom
    .filter((c) => c.group === group && !c.archived)
    .map((c) => ({ id: c.id, label: c.label, icon: c.icon }));
  return [...seeded, ...extra];
}

/** Display label + icon key for any stored category id (built-in or custom). */
export function categoryMeta(
  id: string,
  custom: CustomCategory[],
): { label: string; icon: string } {
  const c = custom.find((x) => x.id === id);
  if (c) return { label: c.label, icon: c.icon };
  const s = findCategory(id);
  return s ? { label: s.label, icon: s.icon } : { label: id, icon: "other" };
}

/** Format a number as a compact currency string (single-currency this sprint). */
export function formatMoney(amount: number, currency = "₹"): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${currency}${Math.abs(Math.round(amount)).toLocaleString()}`;
}
