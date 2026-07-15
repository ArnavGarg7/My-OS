import "server-only";
import { financeEngine, type Forecast } from "@myos/core/finance";
import type { Database } from "@myos/db";
import * as repo from "./repository";
import {
  accountRowToAccount,
  subscriptionRowToSubscription,
  transactionRowToTransaction,
} from "./mapper";

/**
 * Finance forecast endpoint composition (Sprint 2.11). Runs the pure rule-based
 * forecast over current cash + transactions + subscriptions.
 */
export async function forecast(db: Database): Promise<Forecast> {
  const [accountRows, txnRows, subRows] = await Promise.all([
    repo.listAccounts(db),
    repo.listTransactions(db),
    repo.listSubscriptions(db),
  ]);
  const accounts = accountRows.map(accountRowToAccount);
  const transactions = txnRows.map(transactionRowToTransaction);
  const subscriptions = subRows.map(subscriptionRowToSubscription);
  const cash = financeEngine.cashAvailable(accounts, transactions);
  return financeEngine.forecast(cash, transactions, subscriptions, new Date());
}
