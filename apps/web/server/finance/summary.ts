import "server-only";
import {
  financeEngine,
  searchTransactions,
  type FinanceSignals,
  type FinanceSummary,
  type SummaryInput,
  type Transaction,
} from "@myos/core/finance";
import { todayInTimeZone } from "@myos/core/today";
import type { Database } from "@myos/db";
import * as repo from "./repository";
import {
  accountRowToAccount,
  budgetRowToBudget,
  savingsRowToGoal,
  subscriptionRowToSubscription,
  transactionRowToTransaction,
} from "./mapper";

/**
 * Finance summary + search + signals (Sprint 2.11). Composes the pure engine
 * over hydrated data. Everything is derived at read time.
 */
async function gather(db: Database): Promise<Omit<SummaryInput, "date" | "now">> {
  const [accounts, txns, budgets, subs, savings] = await Promise.all([
    repo.listAccounts(db),
    repo.listTransactions(db),
    repo.listBudgets(db),
    repo.listSubscriptions(db),
    repo.listSavings(db),
  ]);
  return {
    accounts: accounts.map(accountRowToAccount),
    transactions: txns.map(transactionRowToTransaction),
    budgets: budgets.map(budgetRowToBudget),
    subscriptions: subs.map(subscriptionRowToSubscription),
    savings: savings.map(savingsRowToGoal),
  };
}

export async function summary(db: Database, tz: string, date?: string): Promise<FinanceSummary> {
  const d = date ?? todayInTimeZone(tz);
  return financeEngine.summary({ date: d, ...(await gather(db)) });
}

export async function signals(db: Database, tz: string): Promise<FinanceSignals> {
  const d = todayInTimeZone(tz);
  return financeEngine.signals({ date: d, ...(await gather(db)) });
}

export async function counts(db: Database): Promise<{
  accounts: number;
  transactions: number;
  budgets: number;
  subscriptions: number;
  savings: number;
}> {
  const g = await gather(db);
  return {
    accounts: g.accounts.length,
    transactions: g.transactions.length,
    budgets: g.budgets.length,
    subscriptions: g.subscriptions.length,
    savings: g.savings.length,
  };
}

export async function search(db: Database, query: string): Promise<Transaction[]> {
  const txns = (await repo.listTransactions(db)).map(transactionRowToTransaction);
  return searchTransactions(txns, query).slice(0, 100);
}
