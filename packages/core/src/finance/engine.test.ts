import { describe, expect, it } from "vitest";
import { at, makeAccount, makeTransaction } from "./fixtures";
import { financeEngine } from "./engine";

const now = new Date(at(2026, 6, 7));

describe("FinanceEngine", () => {
  it("creates + validates a transaction", () => {
    const t = financeEngine.createTransaction(
      { accountId: "a1", amount: 500, direction: "expense" },
      now,
    );
    expect(financeEngine.validateTransaction(t)).toEqual([]);
    expect(financeEngine.validateTransaction({ ...t, amount: 0 })).not.toEqual([]);
  });

  it("derives a balance", () => {
    const account = makeAccount({ id: "a1", openingBalance: 1000 });
    const txns = [makeTransaction({ accountId: "a1", direction: "expense", amount: 200 })];
    expect(financeEngine.balance(account, txns)).toBe(800);
  });

  it("builds transfer legs", () => {
    const [from, to] = financeEngine.transfer("a1", "a2", 500, now);
    expect(from.amount).toBe(-500);
    expect(to.amount).toBe(500);
  });

  it("computes cash available + net worth", () => {
    const accounts = [
      makeAccount({ id: "a1", type: "checking", openingBalance: 5000 }),
      makeAccount({ id: "a2", type: "credit", openingBalance: -1000 }),
    ];
    expect(financeEngine.cashAvailable(accounts, [])).toBe(5000);
    expect(financeEngine.netWorth(accounts, [])).toBe(4000);
  });
});
