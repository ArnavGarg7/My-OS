import { CYCLES_PER_YEAR, UPCOMING_PAYMENT_DAYS } from "./constants";
import type { Subscription, SubscriptionSummary } from "./types";

/**
 * Subscription engine (Sprint 2.11). Deterministic recurring-spend maths and the
 * next-billing schedule. Monthly/yearly recurring normalise across billing
 * cycles.
 */
const DAY_MS = 86_400_000;

export function monthlyCost(sub: Subscription): number {
  return round((sub.amount * CYCLES_PER_YEAR[sub.billingCycle]) / 12);
}

export function yearlyCost(sub: Subscription): number {
  return round(sub.amount * CYCLES_PER_YEAR[sub.billingCycle]);
}

export function monthlyRecurring(subs: Subscription[]): number {
  return round(subs.filter((s) => s.active).reduce((sum, s) => sum + monthlyCost(s), 0));
}

export function yearlyRecurring(subs: Subscription[]): number {
  return round(subs.filter((s) => s.active).reduce((sum, s) => sum + yearlyCost(s), 0));
}

export function daysUntil(dateIso: string, now: Date): number {
  return Math.ceil((new Date(dateIso).getTime() - now.getTime()) / DAY_MS);
}

/** Active subscriptions due within the upcoming window, soonest first. */
export function upcomingPayments(
  subs: Subscription[],
  now: Date,
): { name: string; amount: number; dueInDays: number }[] {
  return subs
    .filter((s) => s.active)
    .map((s) => ({ name: s.name, amount: s.amount, dueInDays: daysUntil(s.nextPayment, now) }))
    .filter((s) => s.dueInDays <= UPCOMING_PAYMENT_DAYS)
    .sort((a, b) => a.dueInDays - b.dueInDays);
}

/** Payments due exactly today. */
export function dueToday(subs: Subscription[], now: Date): Subscription[] {
  return subs.filter((s) => s.active && daysUntil(s.nextPayment, now) <= 0);
}

export function summarizeSubscriptions(subs: Subscription[], now: Date): SubscriptionSummary {
  return {
    monthlyRecurring: monthlyRecurring(subs),
    yearlyRecurring: yearlyRecurring(subs),
    activeCount: subs.filter((s) => s.active).length,
    upcoming: upcomingPayments(subs, now),
  };
}

/** Advance a subscription's next-payment date by one cycle. */
export function advanceNextPayment(sub: Subscription): Subscription {
  const d = new Date(sub.nextPayment);
  if (sub.billingCycle === "weekly") d.setDate(d.getDate() + 7);
  else if (sub.billingCycle === "monthly") d.setMonth(d.getMonth() + 1);
  else if (sub.billingCycle === "quarterly") d.setMonth(d.getMonth() + 3);
  else d.setFullYear(d.getFullYear() + 1);
  return { ...sub, nextPayment: d.toISOString().slice(0, 10) };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
