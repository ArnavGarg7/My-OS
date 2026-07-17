import { DEPRECIATION_RATES, SALVAGE_FLOOR } from "./constants";
import { parseDate, round2, yearsBetween } from "./dates";
import type { Asset, AssetValuation } from "./types";

/**
 * Asset valuation engine (Sprint 4.3). PURE straight-line depreciation from the purchase
 * price and age, floored at a salvage fraction so nothing decays to zero. An explicit
 * `currentValue` always wins — the user knows better than the model, and the model is
 * deliberately simple arithmetic rather than a market estimate.
 */

/** The annual rate for an asset: explicit override, else the type default. */
export function rateFor(asset: Asset): number {
  return asset.depreciationRate ?? DEPRECIATION_RATES[asset.type];
}

/**
 * Straight-line value at `now`. Depreciation accrues per fractional year and is clamped so
 * the asset never falls below SALVAGE_FLOOR × purchase price, and never rises above it.
 */
export function depreciatedValue(asset: Asset, now: Date): number {
  if (asset.currentValue !== null) return round2(asset.currentValue);
  const rate = rateFor(asset);
  if (rate <= 0) return round2(asset.purchasePrice);
  const age = Math.max(0, yearsBetween(parseDate(asset.purchasedAt), now));
  const floor = asset.purchasePrice * SALVAGE_FLOOR;
  const value = asset.purchasePrice * (1 - rate * age);
  return round2(Math.min(asset.purchasePrice, Math.max(floor, value)));
}

export function underWarranty(asset: Asset, now: Date): boolean {
  if (!asset.warrantyExpiresAt) return false;
  return parseDate(asset.warrantyExpiresAt).getTime() >= now.getTime();
}

export function valueAsset(asset: Asset, now: Date): AssetValuation {
  const current = depreciatedValue(asset, now);
  return {
    assetId: asset.id,
    name: asset.name,
    type: asset.type,
    purchasePrice: asset.purchasePrice,
    currentValue: current,
    depreciation: round2(asset.purchasePrice - current),
    underWarranty: underWarranty(asset, now),
  };
}

export function valueAssets(assets: Asset[], now: Date): AssetValuation[] {
  return assets.map((a) => valueAsset(a, now)).sort((a, b) => b.currentValue - a.currentValue);
}

/** Total current value across assets — the asset half of net worth. */
export function totalAssetValue(assets: Asset[], now: Date): number {
  return round2(assets.reduce((sum, a) => sum + depreciatedValue(a, now), 0));
}

/** Assets whose warranty lapses inside `days` — worth acting on before it's gone. */
export function warrantiesExpiring(assets: Asset[], now: Date, days: number): AssetValuation[] {
  return assets
    .filter((a) => {
      if (!a.warrantyExpiresAt) return false;
      const diff = yearsBetween(now, parseDate(a.warrantyExpiresAt)) * 365.25;
      return diff >= 0 && diff <= days;
    })
    .map((a) => valueAsset(a, now));
}
