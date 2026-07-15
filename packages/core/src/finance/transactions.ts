import type { Category, TransactionDirection } from "./constants";
import type { Transaction } from "./types";

/**
 * Transaction engine (Sprint 2.11). Create/validate + the signed-amount
 * convention: income is positive, expense negative, transfer neutral to net.
 * Amounts are always stored positive; direction gives the sign.
 */
export interface CreateTransactionInput {
  accountId: string;
  amount: number;
  category?: Category | undefined;
  direction?: TransactionDirection | undefined;
  merchant?: string | undefined;
  description?: string | undefined;
  occurredAt?: string | undefined;
  projectId?: string | null | undefined;
}

export function createTransaction(input: CreateTransactionInput, now: Date): Transaction {
  const iso = now.toISOString();
  const direction = input.direction ?? "expense";
  // Income/expense amounts are stored positive; transfers keep their sign
  // (negative = money leaving the account, positive = arriving).
  const amount = direction === "transfer" ? input.amount : Math.abs(input.amount);
  return {
    id: "",
    accountId: input.accountId,
    amount,
    category: input.category ?? "other",
    direction,
    merchant: (input.merchant ?? "").trim(),
    description: (input.description ?? "").trim(),
    occurredAt: input.occurredAt ?? iso,
    createdAt: iso,
    projectId: input.projectId ?? null,
  };
}

export function validateTransaction(tx: Transaction): string[] {
  const errors: string[] = [];
  if (tx.direction !== "transfer" && tx.amount <= 0)
    errors.push("Amount must be greater than zero.");
  if (tx.direction === "transfer" && tx.amount === 0) errors.push("Transfer amount can't be zero.");
  if (!tx.accountId) errors.push("A transaction needs an account.");
  return errors;
}

/** Signed effect of a transaction on its account balance. */
export function signedAmount(tx: Transaction): number {
  if (tx.direction === "income") return tx.amount;
  if (tx.direction === "expense") return -tx.amount;
  return tx.amount; // transfers carry their own sign
}

/** Net effect on cash flow (transfers excluded — they move value, not create it). */
export function netEffect(tx: Transaction): number {
  return tx.direction === "transfer" ? 0 : signedAmount(tx);
}

export function isExpense(tx: Transaction): boolean {
  return tx.direction === "expense";
}

export function isIncome(tx: Transaction): boolean {
  return tx.direction === "income";
}
