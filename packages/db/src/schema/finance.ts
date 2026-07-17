/**
 * Finance schema (Sprint 2.11). The deterministic personal financial OS —
 * accounts, transactions, budgets, subscriptions and savings goals. Balances,
 * cash flow, budget usage and forecasts are DERIVED, never stored. Single user
 * (05 §0: no user_id). Manual entry only (no bank sync this sprint).
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const accountType = pgEnum("account_type", [
  "checking",
  "savings",
  "cash",
  "credit",
  "investment",
]);

export const transactionDirection = pgEnum("transaction_direction", [
  "income",
  "expense",
  "transfer",
]);

export const billingCycle = pgEnum("billing_cycle", ["weekly", "monthly", "quarterly", "yearly"]);

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: accountType("type").notNull().default("checking"),
  currency: text("currency").notNull().default("INR"),
  openingBalance: doublePrecision("opening_balance").notNull().default(0),
  institution: text("institution").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  amount: doublePrecision("amount").notNull(),
  category: text("category").notNull().default("other"),
  direction: transactionDirection("direction").notNull().default("expense"),
  merchant: text("merchant").notNull().default(""),
  description: text("description").notNull().default(""),
  projectId: uuid("project_id"),
  // Sprint 4.3 links: a transaction may fund an investment account or buy/maintain an asset.
  // Soft references (no FK) so Finance stays independent of the Resource platform's lifecycle.
  investmentAccountId: uuid("investment_account_id"),
  assetId: uuid("asset_id"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const budgets = pgTable("budgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: text("category").notNull(),
  monthlyLimit: doublePrecision("monthly_limit").notNull(),
  warningThreshold: doublePrecision("warning_threshold").notNull().default(0.8),
  active: boolean("active").notNull().default(true),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  amount: doublePrecision("amount").notNull(),
  billingCycle: billingCycle("billing_cycle").notNull().default("monthly"),
  nextPayment: date("next_payment", { mode: "string" }).notNull(),
  active: boolean("active").notNull().default(true),
});

export const savingsGoals = pgTable("savings_goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  targetAmount: doublePrecision("target_amount").notNull(),
  currentAmount: doublePrecision("current_amount").notNull().default(0),
  deadline: date("deadline", { mode: "string" }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
}));

export type AccountRow = typeof accounts.$inferSelect;
export type AccountInsert = typeof accounts.$inferInsert;
export type TransactionRow = typeof transactions.$inferSelect;
export type TransactionInsert = typeof transactions.$inferInsert;
export type BudgetRow = typeof budgets.$inferSelect;
export type SubscriptionRow = typeof subscriptions.$inferSelect;
export type SavingsGoalRow = typeof savingsGoals.$inferSelect;
