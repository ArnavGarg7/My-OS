import { describe, expect, it } from "vitest";
import { at, makeSubscription, makeTransaction } from "./fixtures";
import { averageDailySpend, daysLeftInMonth, forecast } from "./forecasting";

const now = new Date(Date.UTC(2026, 6, 15, 12));

describe("forecasting", () => {
  it("averages daily spend over the window", () => {
    const txns = [
      makeTransaction({ id: "a", direction: "expense", amount: 300, occurredAt: at(2026, 6, 10) }),
      makeTransaction({ id: "b", direction: "expense", amount: 300, occurredAt: at(2026, 6, 12) }),
    ];
    // 600 over a 30-day window → 20/day.
    expect(averageDailySpend(txns, now)).toBe(20);
  });

  it("ignores spend outside the window", () => {
    const txns = [
      makeTransaction({ direction: "expense", amount: 900, occurredAt: at(2026, 4, 1) }),
    ];
    expect(averageDailySpend(txns, now)).toBe(0);
  });

  it("computes days left in the month", () => {
    expect(daysLeftInMonth(now)).toBe(16); // July: 31 - 15
  });

  it("projects a month-end balance deterministically", () => {
    const txns = [
      makeTransaction({ direction: "expense", amount: 300, occurredAt: at(2026, 6, 12) }),
    ];
    const subs = [makeSubscription({ amount: 600, billingCycle: "monthly" })];
    const f = forecast(10000, txns, subs, now);
    expect(f.recurringExpenses).toBe(600);
    expect(f.averageDailySpend).toBe(10);
    expect(f.projectedMonthEndBalance).toBeLessThan(10000);
    expect(typeof f.projectedExpenses).toBe("number");
  });
});
