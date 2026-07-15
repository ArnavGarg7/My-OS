import { describe, expect, it } from "vitest";
import { computeFinance } from "./finance";

describe("computeFinance", () => {
  it("computes net cash flow + score", () => {
    const m = computeFinance({
      totalIncome: 50000,
      totalExpense: 30000,
      budgetAdherence: 90,
      savingsRate: 40,
      subscriptionCost: 1200,
    });
    expect(m.netCashFlow).toBe(20000);
    expect(m.score).toBe(70); // 90*0.6 + 40*0.4
  });
  it("scores poorly when over budget + not saving", () => {
    const m = computeFinance({
      totalIncome: 30000,
      totalExpense: 32000,
      budgetAdherence: 30,
      savingsRate: 0,
      subscriptionCost: 5000,
    });
    expect(m.netCashFlow).toBe(-2000);
    expect(m.score).toBeLessThan(30);
  });
  it("defaults to zero without input", () => {
    expect(computeFinance().score).toBe(0);
  });

  it("weights budget adherence over savings", () => {
    const budgetHeavy = computeFinance({
      totalIncome: 0,
      totalExpense: 0,
      budgetAdherence: 100,
      savingsRate: 0,
      subscriptionCost: 0,
    });
    const savingsHeavy = computeFinance({
      totalIncome: 0,
      totalExpense: 0,
      budgetAdherence: 0,
      savingsRate: 100,
      subscriptionCost: 0,
    });
    expect(budgetHeavy.score).toBeGreaterThan(savingsHeavy.score);
  });

  it("rounds monetary figures to 2dp", () => {
    const m = computeFinance({
      totalIncome: 100.129,
      totalExpense: 50.001,
      budgetAdherence: 50,
      savingsRate: 50,
      subscriptionCost: 9.999,
    });
    expect(m.totalIncome).toBe(100.13);
    expect(m.subscriptionCost).toBe(10);
  });
});
