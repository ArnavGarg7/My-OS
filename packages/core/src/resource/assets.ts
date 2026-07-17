import type { AssetType } from "./constants";
import { parseDate, round2, yearsBetween } from "./dates";
import type { Asset, AssetMaintenance, ImportantDocument, InsurancePolicy } from "./types";
import { depreciatedValue } from "./valuation";

/**
 * Asset engine (Sprint 4.3). Grouping, filtering and the links that hang off an asset —
 * its maintenance history, the policy covering it and the documents proving it. The
 * depreciation arithmetic itself lives in `valuation.ts`; this module is about what an
 * asset *is* and what it connects to, not what it is worth.
 */

export function assetsByType(assets: Asset[], type: AssetType): Asset[] {
  return assets.filter((a) => a.type === type);
}

export function countAssetsByType(assets: Asset[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of assets) out[a.type] = (out[a.type] ?? 0) + 1;
  return out;
}

/** Current value grouped by asset type — the dashboard's composition chart. */
export function assetValueByType(assets: Asset[], now: Date): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of assets) {
    out[a.type] = round2((out[a.type] ?? 0) + depreciatedValue(a, now));
  }
  return out;
}

/** Asset age in whole years — the input to the age/maintenance correlation. */
export function ageYears(asset: Asset, now: Date): number {
  return Math.max(0, Math.floor(yearsBetween(parseDate(asset.purchasedAt), now)));
}

export function maintenanceFor(asset: Asset, items: AssetMaintenance[]): AssetMaintenance[] {
  return items.filter((i) => i.assetId === asset.id).sort((a, b) => b.dueAt.localeCompare(a.dueAt));
}

/** Lifetime upkeep spend on one asset. */
export function lifetimeSpend(asset: Asset, items: AssetMaintenance[]): number {
  return round2(
    maintenanceFor(asset, items)
      .filter((i) => i.completedAt)
      .reduce((s, i) => s + i.cost, 0),
  );
}

/**
 * Total cost of ownership: what you paid plus everything you have spent keeping it alive.
 * The honest number, as opposed to the purchase price you like to quote.
 */
export function totalCostOfOwnership(asset: Asset, items: AssetMaintenance[]): number {
  return round2(asset.purchasePrice + lifetimeSpend(asset, items));
}

export function policyFor(asset: Asset, policies: InsurancePolicy[]): InsurancePolicy | null {
  return policies.find((p) => p.assetId === asset.id) ?? null;
}

export function isInsured(asset: Asset, policies: InsurancePolicy[]): boolean {
  return policyFor(asset, policies) !== null;
}

/** Uninsured assets above a value threshold — exposure worth knowing about. */
export function uninsuredAbove(
  assets: Asset[],
  policies: InsurancePolicy[],
  now: Date,
  threshold: number,
): Asset[] {
  return assets
    .filter((a) => !isInsured(a, policies))
    .filter((a) => depreciatedValue(a, now) >= threshold)
    .sort((a, b) => depreciatedValue(b, now) - depreciatedValue(a, now));
}

/** Documents linked to an asset by an explicit knowledge/document reference in notes. */
export function documentsFor(asset: Asset, documents: ImportantDocument[]): ImportantDocument[] {
  return documents.filter((d) => d.type === "property" && d.notes.includes(asset.id));
}

export function searchAssets(assets: Asset[], query: string): Asset[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return assets.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.serialNumber.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q),
  );
}
