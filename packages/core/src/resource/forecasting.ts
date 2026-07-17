import { FORECAST_HORIZON_DAYS, LARGE_EXPENSE_THRESHOLD } from "./constants";
import { addDays, addMonths, daysBetween, parseDate, round2, ymd } from "./dates";
import type {
  AssetMaintenance,
  ForecastEntry,
  InsurancePolicy,
  ResourceForecast,
  TravelDocument,
  Vehicle,
} from "./types";

/**
 * Forecast engine (Sprint 4.3). Deterministic projection of known, dated costs inside a
 * horizon: insurance premiums on their cadence, scheduled maintenance, vehicle renewals and
 * travel document expiries. This is a calendar walk over rows that already exist — there is
 * no model, no ML and no guessing at costs the user has not told us about.
 */

/** Premium payment dates for a policy inside the horizon. */
export function premiumSchedule(
  policy: InsurancePolicy,
  now: Date,
  horizonDays: number,
): ForecastEntry[] {
  const months = policy.premiumIntervalMonths > 0 ? policy.premiumIntervalMonths : 12;
  const end = addDays(now, horizonDays);
  const out: ForecastEntry[] = [];
  // Walk forward from the policy start on its cadence until we pass the horizon.
  let due = parseDate(policy.startsAt);
  let guard = 0;
  while (due.getTime() < now.getTime() && guard < 1000) {
    due = addMonths(due, months);
    guard += 1;
  }
  while (due.getTime() <= end.getTime() && guard < 1000) {
    // A policy stops costing anything once it has expired.
    if (due.getTime() <= parseDate(policy.expiresAt).getTime()) {
      out.push({
        date: ymd(due),
        label: `${policy.name} premium`,
        amount: round2(policy.premium),
        source: "insurance",
      });
    }
    due = addMonths(due, months);
    guard += 1;
  }
  return out;
}

/** Scheduled (not yet completed) maintenance with a cost, inside the horizon. */
export function maintenanceSchedule(
  items: AssetMaintenance[],
  now: Date,
  horizonDays: number,
): ForecastEntry[] {
  return items
    .filter((i) => !i.completedAt && i.cost > 0)
    .filter((i) => {
      const d = daysBetween(now, parseDate(i.dueAt));
      return d >= 0 && d <= horizonDays;
    })
    .map((i) => ({
      date: i.dueAt.slice(0, 10),
      label: i.title,
      amount: round2(i.cost),
      source: "maintenance" as const,
    }));
}

/**
 * Vehicle renewals inside the horizon. Registration/pollution renewals carry no stored cost,
 * so they are forecast at zero — they are dated obligations, not predicted spend. Inventing
 * an amount here would be fabrication.
 */
export function vehicleSchedule(
  vehicles: Vehicle[],
  now: Date,
  horizonDays: number,
): ForecastEntry[] {
  const out: ForecastEntry[] = [];
  for (const v of vehicles) {
    for (const [field, label] of [
      [v.registrationExpiresAt, "registration renewal"],
      [v.pollutionExpiresAt, "pollution certificate"],
    ] as const) {
      if (!field) continue;
      const d = daysBetween(now, parseDate(field));
      if (d >= 0 && d <= horizonDays) {
        out.push({
          date: field.slice(0, 10),
          label: `${v.name} ${label}`,
          amount: 0,
          source: "vehicle",
        });
      }
    }
  }
  return out;
}

/** Travel documents expiring inside the horizon — dated, cost unknown, so zero. */
export function travelSchedule(
  documents: TravelDocument[],
  now: Date,
  horizonDays: number,
): ForecastEntry[] {
  return documents
    .filter((d) => d.expiresAt !== null)
    .filter((d) => {
      const n = daysBetween(now, parseDate(d.expiresAt as string));
      return n >= 0 && n <= horizonDays;
    })
    .map((d) => ({
      date: (d.expiresAt as string).slice(0, 10),
      label: `${d.name} renewal`,
      amount: 0,
      source: "travel" as const,
    }));
}

export function buildForecast(
  input: {
    policies: InsurancePolicy[];
    maintenance: AssetMaintenance[];
    vehicles: Vehicle[];
    travel: TravelDocument[];
  },
  now: Date,
  horizonDays = FORECAST_HORIZON_DAYS,
): ResourceForecast {
  const entries = [
    ...input.policies.flatMap((p) => premiumSchedule(p, now, horizonDays)),
    ...maintenanceSchedule(input.maintenance, now, horizonDays),
    ...vehicleSchedule(input.vehicles, now, horizonDays),
    ...travelSchedule(input.travel, now, horizonDays),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return {
    horizonDays,
    entries,
    total: round2(entries.reduce((s, e) => s + e.amount, 0)),
    largeExpenses: entries.filter((e) => e.amount >= LARGE_EXPENSE_THRESHOLD),
  };
}

/** Projected value of an investment at a fixed annual growth rate the USER supplies. */
export function projectInvestment(
  presentValue: number,
  annualRatePercent: number,
  years: number,
): number {
  if (presentValue <= 0 || years <= 0) return round2(Math.max(0, presentValue));
  return round2(presentValue * Math.pow(1 + annualRatePercent / 100, years));
}
