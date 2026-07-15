import { describe, expect, it } from "vitest";
import { day, makeSubscription } from "./fixtures";
import {
  advanceNextPayment,
  dueToday,
  monthlyCost,
  monthlyRecurring,
  summarizeSubscriptions,
  upcomingPayments,
  yearlyCost,
} from "./subscriptions";

const now = new Date(`${day(2026, 6, 7)}T12:00:00Z`);

describe("subscriptions", () => {
  it("normalises cost across billing cycles", () => {
    expect(monthlyCost(makeSubscription({ amount: 1200, billingCycle: "yearly" }))).toBe(100);
    expect(monthlyCost(makeSubscription({ amount: 300, billingCycle: "quarterly" }))).toBe(100);
    expect(yearlyCost(makeSubscription({ amount: 500, billingCycle: "monthly" }))).toBe(6000);
  });

  it("sums active monthly recurring", () => {
    const subs = [
      makeSubscription({ id: "a", amount: 500, billingCycle: "monthly" }),
      makeSubscription({ id: "b", amount: 1200, billingCycle: "yearly" }),
      makeSubscription({ id: "c", amount: 999, billingCycle: "monthly", active: false }),
    ];
    expect(monthlyRecurring(subs)).toBe(600);
  });

  it("lists upcoming payments soonest first", () => {
    const subs = [
      makeSubscription({ id: "a", name: "A", nextPayment: day(2026, 6, 12) }),
      makeSubscription({ id: "b", name: "B", nextPayment: day(2026, 6, 9) }),
      makeSubscription({ id: "c", name: "C", nextPayment: day(2026, 6, 25) }),
    ];
    expect(upcomingPayments(subs, now).map((s) => s.name)).toEqual(["B", "A"]);
  });

  it("finds payments due today", () => {
    const subs = [makeSubscription({ nextPayment: day(2026, 6, 7) })];
    expect(dueToday(subs, now)).toHaveLength(1);
  });

  it("advances the next payment by cycle", () => {
    expect(
      advanceNextPayment(
        makeSubscription({ nextPayment: day(2026, 6, 10), billingCycle: "monthly" }),
      ).nextPayment,
    ).toBe("2026-08-10");
  });

  it("summarizes subscriptions", () => {
    const subs = [
      makeSubscription({ amount: 500, billingCycle: "monthly", nextPayment: day(2026, 6, 9) }),
    ];
    const s = summarizeSubscriptions(subs, now);
    expect(s.activeCount).toBe(1);
    expect(s.monthlyRecurring).toBe(500);
    expect(s.upcoming).toHaveLength(1);
  });
});
