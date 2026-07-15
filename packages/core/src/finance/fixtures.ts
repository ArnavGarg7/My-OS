import type { Account, Budget, SavingsGoal, Subscription, Transaction } from "./types";

/** Test fixtures for the finance engine (imported by *.test.ts). */
export const at = (y: number, mo: number, d: number, h = 12) =>
  new Date(Date.UTC(y, mo, d, h, 0, 0)).toISOString();
export const day = (y: number, mo: number, d: number) =>
  new Date(Date.UTC(y, mo, d)).toISOString().slice(0, 10);

export function makeAccount(over: Partial<Account> = {}): Account {
  return {
    id: over.id ?? "a1",
    name: over.name ?? "Checking",
    type: over.type ?? "checking",
    currency: over.currency ?? "INR",
    openingBalance: over.openingBalance ?? 10000,
    institution: over.institution ?? "",
    createdAt: over.createdAt ?? at(2026, 6, 1),
    updatedAt: over.updatedAt ?? at(2026, 6, 1),
  };
}

export function makeTransaction(over: Partial<Transaction> = {}): Transaction {
  return {
    id: over.id ?? "t1",
    accountId: over.accountId ?? "a1",
    amount: over.amount ?? 500,
    category: over.category ?? "groceries",
    direction: over.direction ?? "expense",
    merchant: over.merchant ?? "Market",
    description: over.description ?? "",
    occurredAt: over.occurredAt ?? at(2026, 6, 7),
    createdAt: over.createdAt ?? at(2026, 6, 7),
    projectId: over.projectId ?? null,
  };
}

export function makeBudget(over: Partial<Budget> = {}): Budget {
  return {
    id: over.id ?? "b1",
    category: over.category ?? "groceries",
    monthlyLimit: over.monthlyLimit ?? 5000,
    warningThreshold: over.warningThreshold ?? 0.8,
    active: over.active ?? true,
  };
}

export function makeSubscription(over: Partial<Subscription> = {}): Subscription {
  return {
    id: over.id ?? "s1",
    name: over.name ?? "Netflix",
    amount: over.amount ?? 500,
    billingCycle: over.billingCycle ?? "monthly",
    nextPayment: over.nextPayment ?? day(2026, 6, 10),
    active: over.active ?? true,
  };
}

export function makeSavingsGoal(over: Partial<SavingsGoal> = {}): SavingsGoal {
  return {
    id: over.id ?? "g1",
    title: over.title ?? "Emergency fund",
    targetAmount: over.targetAmount ?? 100000,
    currentAmount: over.currentAmount ?? 40000,
    deadline: over.deadline ?? day(2026, 11, 31),
    completedAt: over.completedAt ?? null,
  };
}
