import { LIABILITY_TYPES } from "./constants";
import { signedAmount } from "./transactions";
import type { Account, AccountBalance, Transaction } from "./types";

/**
 * Account engine (Sprint 2.11). Balances are ALWAYS derived from the opening
 * balance + transaction history — never stored. Net worth sums assets minus
 * liabilities. Transfers move value between accounts explicitly.
 */
export function accountBalance(account: Account, transactions: Transaction[]): number {
  const delta = transactions
    .filter((t) => t.accountId === account.id)
    .reduce((sum, t) => sum + signedAmount(t), 0);
  return round(account.openingBalance + delta);
}

export function balances(accounts: Account[], transactions: Transaction[]): AccountBalance[] {
  return accounts.map((a) => ({ accountId: a.id, balance: accountBalance(a, transactions) }));
}

/** Net worth = assets − liabilities (credit balances are liabilities). */
export function netWorth(accounts: Account[], transactions: Transaction[]): number {
  return round(
    accounts.reduce((sum, a) => {
      const balance = accountBalance(a, transactions);
      return sum + (LIABILITY_TYPES.includes(a.type) ? -Math.abs(balance) : balance);
    }, 0),
  );
}

/** Liquid cash across checking / savings / cash accounts. */
export function cashAvailable(accounts: Account[], transactions: Transaction[]): number {
  return round(
    accounts
      .filter((a) => a.type === "checking" || a.type === "savings" || a.type === "cash")
      .reduce((sum, a) => sum + accountBalance(a, transactions), 0),
  );
}

/** Build the two transfer legs between accounts (deterministic, no ids). */
export function transferLegs(
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  now: Date,
): [Transaction, Transaction] {
  const iso = now.toISOString();
  const base = {
    category: "transfer",
    direction: "transfer" as const,
    merchant: "",
    description: "Transfer",
    occurredAt: iso,
    createdAt: iso,
    projectId: null,
  };
  const magnitude = Math.abs(amount);
  return [
    { ...base, id: "", accountId: fromAccountId, amount: -magnitude }, // money leaves
    { ...base, id: "", accountId: toAccountId, amount: magnitude }, // money arrives
  ];
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
