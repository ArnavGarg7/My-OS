import { describe, expect, it } from "vitest";
import { at, makeTransaction } from "./fixtures";
import { cashFlow, cashFlowForMonth, spendByCategory } from "./cashflow";

describe("cashflow", () => {
  it("computes income, expenses, net + direction", () => {
    const txns = [
      makeTransaction({ id: "a", direction: "income", amount: 5000 }),
      makeTransaction({ id: "b", direction: "expense", amount: 2000 }),
      makeTransaction({ id: "c", direction: "transfer", amount: -1000 }),
    ];
    const cf = cashFlow(txns);
    expect(cf.income).toBe(5000);
    expect(cf.expenses).toBe(2000);
    expect(cf.net).toBe(3000);
    expect(cf.direction).toBe("positive");
  });

  it("is negative when expenses exceed income", () => {
    const cf = cashFlow([makeTransaction({ direction: "expense", amount: 100 })]);
    expect(cf.direction).toBe("negative");
  });

  it("filters by month", () => {
    const txns = [
      makeTransaction({ id: "a", direction: "expense", amount: 100, occurredAt: at(2026, 6, 3) }),
      makeTransaction({ id: "b", direction: "expense", amount: 200, occurredAt: at(2026, 5, 3) }),
    ];
    expect(cashFlowForMonth(txns, "2026-07").expenses).toBe(100);
  });

  it("aggregates spend by category, highest first", () => {
    const txns = [
      makeTransaction({ id: "a", category: "groceries", amount: 500 }),
      makeTransaction({ id: "b", category: "dining", amount: 900 }),
      makeTransaction({ id: "c", category: "groceries", amount: 300 }),
    ];
    const spread = spendByCategory(txns);
    expect(spread[0]).toEqual({ category: "dining", amount: 900 });
    expect(spread[1]).toEqual({ category: "groceries", amount: 800 });
  });
});
