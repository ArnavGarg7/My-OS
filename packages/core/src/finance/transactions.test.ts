import { describe, expect, it } from "vitest";
import { at, makeTransaction } from "./fixtures";
import {
  createTransaction,
  isExpense,
  isIncome,
  netEffect,
  signedAmount,
  validateTransaction,
} from "./transactions";

const now = new Date(at(2026, 6, 7));

describe("transactions", () => {
  it("creates an expense with a positive amount", () => {
    const t = createTransaction({ accountId: "a1", amount: -450, direction: "expense" }, now);
    expect(t.amount).toBe(450);
    expect(t.direction).toBe("expense");
  });

  it("keeps a signed amount for transfers", () => {
    const out = createTransaction({ accountId: "a1", amount: -100, direction: "transfer" }, now);
    expect(out.amount).toBe(-100);
  });

  it("signs income + / expense −", () => {
    expect(signedAmount(makeTransaction({ direction: "income", amount: 100 }))).toBe(100);
    expect(signedAmount(makeTransaction({ direction: "expense", amount: 100 }))).toBe(-100);
  });

  it("excludes transfers from cash-flow net effect", () => {
    expect(netEffect(makeTransaction({ direction: "transfer", amount: -100 }))).toBe(0);
    expect(netEffect(makeTransaction({ direction: "income", amount: 100 }))).toBe(100);
  });

  it("classifies income / expense", () => {
    expect(isIncome(makeTransaction({ direction: "income" }))).toBe(true);
    expect(isExpense(makeTransaction({ direction: "expense" }))).toBe(true);
  });

  it("validates amount + account", () => {
    expect(validateTransaction(makeTransaction({ amount: 0 }))).toContain(
      "Amount must be greater than zero.",
    );
    expect(validateTransaction(makeTransaction({ accountId: "" }))).toContain(
      "A transaction needs an account.",
    );
    expect(validateTransaction(makeTransaction())).toEqual([]);
  });

  it("rejects a zero transfer", () => {
    expect(validateTransaction(makeTransaction({ direction: "transfer", amount: 0 }))).toContain(
      "Transfer amount can't be zero.",
    );
  });
});
