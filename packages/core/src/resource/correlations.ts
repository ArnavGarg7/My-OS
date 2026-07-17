import { CORRELATION_MIN_SAMPLES } from "./constants";
import { round2, yearsBetween } from "./dates";
import { parseDate } from "./dates";
import type { Asset, AssetMaintenance, ResourceCorrelation } from "./types";

/**
 * Resource correlations (Sprint 4.3). Plain Pearson coefficients over paired numeric series
 * — no inference, no significance testing, no causal claims. Below CORRELATION_MIN_SAMPLES
 * pairs we report nothing at all rather than a number that looks meaningful and isn't.
 */

export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = xs.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const my = ys.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i += 1) {
    const a = (xs[i] as number) - mx;
    const b = (ys[i] as number) - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : round2(num / den);
}

/**
 * Asset age (years) ↔ maintenance spend. The classic "is this thing costing me more as it
 * gets older" question, answered by arithmetic rather than opinion.
 */
export function ageVsMaintenanceCost(
  assets: Asset[],
  maintenance: AssetMaintenance[],
  now: Date,
): ResourceCorrelation | null {
  const ages: number[] = [];
  const costs: number[] = [];
  for (const a of assets) {
    const spend = maintenance
      .filter((m) => m.assetId === a.id && m.completedAt)
      .reduce((s, m) => s + m.cost, 0);
    ages.push(round2(yearsBetween(parseDate(a.purchasedAt), now)));
    costs.push(spend);
  }
  if (ages.length < CORRELATION_MIN_SAMPLES) return null;
  return {
    label: "Asset age vs maintenance spend",
    coefficient: pearson(ages, costs),
    samples: ages.length,
  };
}

/** Purchase price ↔ maintenance spend — do expensive things cost more to keep? */
export function priceVsMaintenanceCost(
  assets: Asset[],
  maintenance: AssetMaintenance[],
): ResourceCorrelation | null {
  const prices: number[] = [];
  const costs: number[] = [];
  for (const a of assets) {
    prices.push(a.purchasePrice);
    costs.push(
      maintenance
        .filter((m) => m.assetId === a.id && m.completedAt)
        .reduce((s, m) => s + m.cost, 0),
    );
  }
  if (prices.length < CORRELATION_MIN_SAMPLES) return null;
  return {
    label: "Purchase price vs maintenance spend",
    coefficient: pearson(prices, costs),
    samples: prices.length,
  };
}

export function allCorrelations(
  assets: Asset[],
  maintenance: AssetMaintenance[],
  now: Date,
): ResourceCorrelation[] {
  return [
    ageVsMaintenanceCost(assets, maintenance, now),
    priceVsMaintenanceCost(assets, maintenance),
  ].filter((c): c is ResourceCorrelation => c !== null);
}
