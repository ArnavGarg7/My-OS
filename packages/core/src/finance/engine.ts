import {
  createTransaction,
  validateTransaction,
  type CreateTransactionInput,
} from "./transactions";
import { accountBalance, balances, cashAvailable, netWorth, transferLegs } from "./accounts";
import { financeSignals, financeSummary, type SummaryInput } from "./summaries";
import { forecast } from "./forecasting";
import type { Account, FinanceSignals, FinanceSummary, Transaction } from "./types";

/**
 * FinanceEngine (Sprint 2.11). Pure deterministic orchestration over the finance
 * sub-engines. Balances / cash flow / budgets / forecasts / summaries are always
 * derived. No React, DB, browser or randomness. Not a banking app.
 */
export class FinanceEngine {
  createTransaction(input: CreateTransactionInput, now: Date): Transaction {
    return createTransaction(input, now);
  }

  validateTransaction(tx: Transaction): string[] {
    return validateTransaction(tx);
  }

  transfer(fromAccountId: string, toAccountId: string, amount: number, now: Date) {
    return transferLegs(fromAccountId, toAccountId, amount, now);
  }

  balance(account: Account, transactions: Transaction[]): number {
    return accountBalance(account, transactions);
  }

  balances(accounts: Account[], transactions: Transaction[]) {
    return balances(accounts, transactions);
  }

  netWorth(accounts: Account[], transactions: Transaction[]): number {
    return netWorth(accounts, transactions);
  }

  cashAvailable(accounts: Account[], transactions: Transaction[]): number {
    return cashAvailable(accounts, transactions);
  }

  forecast(
    currentBalance: number,
    transactions: Transaction[],
    subscriptions: SummaryInput["subscriptions"],
    now: Date,
  ) {
    return forecast(currentBalance, transactions, subscriptions, now);
  }

  summary(input: SummaryInput): FinanceSummary {
    return financeSummary(input);
  }

  signals(input: SummaryInput): FinanceSignals {
    return financeSignals(input);
  }
}

export const financeEngine = new FinanceEngine();
