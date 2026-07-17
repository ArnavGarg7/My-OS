import { INVESTMENT_REVIEW_DAYS, RENEWAL_SOON_DAYS } from "./constants";
import { nextBirthday, upcomingBirthdays } from "./birthdays";
import { daysBetween, parseDate } from "./dates";
import { expiringDocuments } from "./documents";
import { buildForecast } from "./forecasting";
import { upcomingRenewals } from "./insurance";
import { buildPortfolio } from "./investments";
import { overdue } from "./maintenance";
import { coldRelationships, followUpsDue, healthReport } from "./relationships";
import { expiringTravelDocuments } from "./travel";
import type { PortfolioInput } from "./portfolio";
import { buildResourcePortfolio } from "./portfolio";
import type { AssetMaintenance, ResourceReview, ResourceSignals, ResourceSummary } from "./types";

/**
 * Resource selectors (Sprint 4.3). The two read models every other module consumes:
 * `computeSignals` (booleans for the Decision engine — thresholds live here, never in the
 * rules) and `buildSummary` (the compact object Morning, Tomorrow and the status bar read).
 */

export interface SignalInput extends PortfolioInput {
  maintenance: AssetMaintenance[];
  reviews: ResourceReview[];
}

/** True when the newest review is older than the review cadence (or none exists). */
export function investmentReviewDue(
  reviews: ResourceReview[],
  positions: unknown[],
  now: Date,
): boolean {
  // Nothing invested means nothing to review.
  if (positions.length === 0) return false;
  const newest = [...reviews].sort((a, b) => b.periodStart.localeCompare(a.periodStart))[0];
  if (!newest) return true;
  return daysBetween(parseDate(newest.periodStart), now) > INVESTMENT_REVIEW_DAYS;
}

export function computeSignals(input: SignalInput, now: Date): ResourceSignals {
  const portfolio = buildPortfolio(input.positions);
  const health = healthReport(input.relationships, input.interactions, now);
  const forecast = buildForecast(
    {
      policies: input.policies,
      maintenance: input.maintenance,
      vehicles: input.vehicles,
      travel: input.travel,
    },
    now,
  );

  return {
    insuranceExpiring: upcomingRenewals(input.policies, now, RENEWAL_SOON_DAYS).length > 0,
    documentExpiring:
      expiringDocuments(input.documents, now).length > 0 ||
      expiringTravelDocuments(input.travel, now).length > 0,
    maintenanceOverdue: overdue(input.maintenance, input.assets, now).length > 0,
    relationshipCold: coldRelationships(health).length > 0,
    portfolioUnbalanced: portfolio.unbalanced,
    largeExpenseDue: forecast.largeExpenses.length > 0,
    investmentReviewDue: investmentReviewDue(input.reviews, input.positions, now),
  };
}

export function emptySignals(): ResourceSignals {
  return {
    insuranceExpiring: false,
    documentExpiring: false,
    maintenanceOverdue: false,
    relationshipCold: false,
    portfolioUnbalanced: false,
    largeExpenseDue: false,
    investmentReviewDue: false,
  };
}

export function buildSummary(input: SignalInput, now: Date): ResourceSummary {
  const portfolio = buildResourcePortfolio(input, now);
  const investments = buildPortfolio(input.positions);
  const health = healthReport(input.relationships, input.interactions, now);
  const birthday = nextBirthday(input.relationships, now);

  return {
    netWorth: portfolio.netWorth,
    investmentValue: investments.marketValue,
    investmentGain: investments.gain,
    upcomingRenewals: portfolio.upcomingRenewals.length,
    upcomingBirthdays: upcomingBirthdays(input.relationships, now).length,
    followUpsDue: followUpsDue(health).length,
    maintenanceOverdue: overdue(input.maintenance, input.assets, now).length,
    documentsExpiring: portfolio.documentsExpiring.length,
    nextBirthday: birthday?.name ?? null,
  };
}

export function emptySummary(): ResourceSummary {
  return {
    netWorth: 0,
    investmentValue: 0,
    investmentGain: 0,
    upcomingRenewals: 0,
    upcomingBirthdays: 0,
    followUpsDue: 0,
    maintenanceOverdue: 0,
    documentsExpiring: 0,
    nextBirthday: null,
  };
}
