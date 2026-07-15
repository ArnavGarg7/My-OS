import "server-only";
import type {
  Account,
  AccountType,
  BillingCycle,
  Budget,
  SavingsGoal,
  Subscription,
  Transaction,
  TransactionDirection,
} from "@myos/core/finance";
import type {
  AccountRow,
  BudgetRow,
  SavingsGoalRow,
  SubscriptionRow,
  TransactionRow,
} from "@myos/db/schema";

/**
 * Finance row ↔ DTO mapping (Sprint 2.11). Timestamps become ISO strings for the
 * pure engine + client. Amounts pass through as doubles.
 */
export function accountRowToAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type as AccountType,
    currency: row.currency,
    openingBalance: row.openingBalance,
    institution: row.institution,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function transactionRowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    accountId: row.accountId,
    amount: row.amount,
    category: row.category,
    direction: row.direction as TransactionDirection,
    merchant: row.merchant,
    description: row.description,
    occurredAt: row.occurredAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    projectId: row.projectId,
  };
}

export function transactionToColumns(tx: Transaction) {
  return {
    accountId: tx.accountId,
    amount: tx.amount,
    category: tx.category,
    direction: tx.direction,
    merchant: tx.merchant,
    description: tx.description,
    projectId: tx.projectId,
    occurredAt: new Date(tx.occurredAt),
  };
}

export function budgetRowToBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    category: row.category,
    monthlyLimit: row.monthlyLimit,
    warningThreshold: row.warningThreshold,
    active: row.active,
  };
}

export function subscriptionRowToSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    billingCycle: row.billingCycle as BillingCycle,
    nextPayment: row.nextPayment,
    active: row.active,
  };
}

export function savingsRowToGoal(row: SavingsGoalRow): SavingsGoal {
  return {
    id: row.id,
    title: row.title,
    targetAmount: row.targetAmount,
    currentAmount: row.currentAmount,
    deadline: row.deadline,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  };
}
