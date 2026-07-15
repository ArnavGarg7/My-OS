import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  accounts,
  budgets,
  savingsGoals,
  subscriptions,
  transactions,
  type AccountInsert,
  type AccountRow,
  type BudgetRow,
  type SavingsGoalRow,
  type SubscriptionRow,
  type TransactionInsert,
  type TransactionRow,
} from "@myos/db/schema";

/**
 * Finance persistence (Sprint 2.11). Pure DB access over the five finance
 * tables. No business logic — the service composes these with the pure engine.
 */
export function listAccounts(db: Database): Promise<AccountRow[]> {
  return db.select().from(accounts).orderBy(accounts.name);
}

export async function insertAccount(db: Database, values: AccountInsert): Promise<AccountRow> {
  const [row] = await db.insert(accounts).values(values).returning();
  if (!row) throw new Error("Failed to insert account");
  return row;
}

export function listTransactions(db: Database, limit = 1000): Promise<TransactionRow[]> {
  return db.select().from(transactions).orderBy(desc(transactions.occurredAt)).limit(limit);
}

export async function getTransaction(
  db: Database,
  id: string,
): Promise<TransactionRow | undefined> {
  const [row] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
  return row;
}

export async function insertTransaction(
  db: Database,
  values: TransactionInsert,
): Promise<TransactionRow> {
  const [row] = await db.insert(transactions).values(values).returning();
  if (!row) throw new Error("Failed to insert transaction");
  return row;
}

export async function insertTransactions(
  db: Database,
  values: TransactionInsert[],
): Promise<TransactionRow[]> {
  if (values.length === 0) return [];
  return db.insert(transactions).values(values).returning();
}

export async function deleteTransaction(db: Database, id: string): Promise<void> {
  await db.delete(transactions).where(eq(transactions.id, id));
}

export function listBudgets(db: Database): Promise<BudgetRow[]> {
  return db.select().from(budgets).orderBy(budgets.category);
}

export async function insertBudget(
  db: Database,
  values: { category: string; monthlyLimit: number; warningThreshold: number },
): Promise<BudgetRow> {
  const [row] = await db.insert(budgets).values(values).returning();
  if (!row) throw new Error("Failed to insert budget");
  return row;
}

export function listSubscriptions(db: Database): Promise<SubscriptionRow[]> {
  return db.select().from(subscriptions).orderBy(subscriptions.nextPayment);
}

export async function insertSubscription(
  db: Database,
  values: {
    name: string;
    amount: number;
    billingCycle: SubscriptionRow["billingCycle"];
    nextPayment: string;
  },
): Promise<SubscriptionRow> {
  const [row] = await db.insert(subscriptions).values(values).returning();
  if (!row) throw new Error("Failed to insert subscription");
  return row;
}

export function listSavings(db: Database): Promise<SavingsGoalRow[]> {
  return db.select().from(savingsGoals).orderBy(savingsGoals.title);
}

export async function getSavingsGoal(
  db: Database,
  id: string,
): Promise<SavingsGoalRow | undefined> {
  const [row] = await db.select().from(savingsGoals).where(eq(savingsGoals.id, id)).limit(1);
  return row;
}

export async function insertSavingsGoal(
  db: Database,
  values: { title: string; targetAmount: number; currentAmount: number; deadline: string | null },
): Promise<SavingsGoalRow> {
  const [row] = await db.insert(savingsGoals).values(values).returning();
  if (!row) throw new Error("Failed to insert savings goal");
  return row;
}

export async function updateSavingsGoal(
  db: Database,
  id: string,
  patch: { currentAmount: number; completedAt: Date | null },
): Promise<SavingsGoalRow> {
  const [row] = await db.update(savingsGoals).set(patch).where(eq(savingsGoals.id, id)).returning();
  if (!row) throw new Error("Savings goal not found");
  return row;
}
