import { RENEWAL_SOON_DAYS } from "./constants";
import { daysBetween, parseDate, round2 } from "./dates";
import type { InsurancePolicy, RenewalItem } from "./types";

/**
 * Insurance engine (Sprint 4.3). Policies, coverage totals, premium cost and renewal
 * countdowns. The platform records claims as history; it does not adjudicate them, price
 * risk, or recommend cover — those are decisions for a human and a licensed adviser.
 */

export function isPolicyExpired(policy: InsurancePolicy, now: Date): boolean {
  return daysBetween(now, parseDate(policy.expiresAt)) < 0;
}

export function daysUntilRenewal(policy: InsurancePolicy, now: Date): number {
  return daysBetween(now, parseDate(policy.expiresAt));
}

export function policyRenewalItem(policy: InsurancePolicy, now: Date): RenewalItem {
  const days = daysUntilRenewal(policy, now);
  return {
    id: policy.id,
    name: policy.name,
    source: "insurance",
    expiresAt: policy.expiresAt,
    daysUntil: days,
    expired: days < 0,
  };
}

/** Policies renewing inside the window (or already lapsed), soonest first. */
export function upcomingRenewals(
  policies: InsurancePolicy[],
  now: Date,
  days = RENEWAL_SOON_DAYS,
): RenewalItem[] {
  return policies
    .map((p) => policyRenewalItem(p, now))
    .filter((r) => r.daysUntil <= days)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export function expiredPolicies(policies: InsurancePolicy[], now: Date): InsurancePolicy[] {
  return policies.filter((p) => isPolicyExpired(p, now));
}

/** Total sum assured across live policies — the "am I covered" number. */
export function totalCoverage(policies: InsurancePolicy[], now: Date): number {
  return round2(
    policies.filter((p) => !isPolicyExpired(p, now)).reduce((sum, p) => sum + p.coverageAmount, 0),
  );
}

/** Coverage by insurance type, for the dashboard breakdown. */
export function coverageByType(policies: InsurancePolicy[], now: Date): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of policies) {
    if (isPolicyExpired(p, now)) continue;
    out[p.type] = round2((out[p.type] ?? 0) + p.coverageAmount);
  }
  return out;
}

/** Annualised premium spend across live policies. */
export function annualPremium(policies: InsurancePolicy[], now: Date): number {
  return round2(
    policies
      .filter((p) => !isPolicyExpired(p, now))
      .reduce((sum, p) => {
        const months = p.premiumIntervalMonths > 0 ? p.premiumIntervalMonths : 12;
        return sum + (p.premium * 12) / months;
      }, 0),
  );
}

export function claimCount(policies: InsurancePolicy[]): number {
  return policies.reduce((sum, p) => sum + p.claims.length, 0);
}
