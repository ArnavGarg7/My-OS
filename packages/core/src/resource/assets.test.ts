import { describe, expect, it } from "vitest";
import {
  ageYears,
  assetValueByType,
  assetsByType,
  countAssetsByType,
  isInsured,
  lifetimeSpend,
  searchAssets,
  totalCostOfOwnership,
  uninsuredAbove,
} from "./assets";
import {
  depreciatedValue,
  rateFor,
  totalAssetValue,
  underWarranty,
  valueAsset,
  warrantiesExpiring,
} from "./valuation";
import { FIXED_NOW, makeAsset, makeMaintenance, makePolicy } from "./fixtures";

describe("valuation — straight-line depreciation", () => {
  it("depreciates electronics at the type default over one year", () => {
    // 200000 purchased ~1 year before now at 25%/yr → ~150000. Not exact: the asset is
    // 365d10h old against a 365.25-day year, so it has depreciated a shade past a full year.
    const a = makeAsset({ purchasePrice: 200_000, purchasedAt: "2025-07-16" });
    expect(rateFor(a)).toBe(0.25);
    expect(depreciatedValue(a, FIXED_NOW)).toBeCloseTo(150_000, -2);
  });

  it("an explicit currentValue always wins over the model", () => {
    const a = makeAsset({ purchasePrice: 200_000, currentValue: 90_000 });
    expect(depreciatedValue(a, FIXED_NOW)).toBe(90_000);
  });

  it("honours a per-asset rate override", () => {
    const a = makeAsset({
      purchasePrice: 100_000,
      purchasedAt: "2025-07-16",
      depreciationRate: 0.5,
    });
    expect(depreciatedValue(a, FIXED_NOW)).toBeCloseTo(50_000, -2);
  });

  it("never falls below the salvage floor however old it gets", () => {
    const a = makeAsset({ purchasePrice: 100_000, purchasedAt: "2000-01-01" });
    // 10% floor — decades of depreciation cannot take it to zero.
    expect(depreciatedValue(a, FIXED_NOW)).toBe(10_000);
  });

  it("never exceeds the purchase price for a future-dated purchase", () => {
    const a = makeAsset({ purchasePrice: 100_000, purchasedAt: "2027-01-01" });
    expect(depreciatedValue(a, FIXED_NOW)).toBe(100_000);
  });

  it("zero-rate types (property, jewelry) hold their value", () => {
    const a = makeAsset({ type: "property", purchasePrice: 5_000_000, purchasedAt: "2010-01-01" });
    expect(depreciatedValue(a, FIXED_NOW)).toBe(5_000_000);
  });
});

describe("valuation — warranty + totals", () => {
  it("reports warranty status against the clock", () => {
    expect(underWarranty(makeAsset({ warrantyExpiresAt: "2027-07-16" }), FIXED_NOW)).toBe(true);
    expect(underWarranty(makeAsset({ warrantyExpiresAt: "2026-01-01" }), FIXED_NOW)).toBe(false);
    expect(underWarranty(makeAsset({ warrantyExpiresAt: null }), FIXED_NOW)).toBe(false);
  });

  it("valueAsset exposes depreciation as purchase − current", () => {
    const v = valueAsset(
      makeAsset({ purchasePrice: 200_000, purchasedAt: "2025-07-16" }),
      FIXED_NOW,
    );
    expect(v.purchasePrice - v.currentValue).toBeCloseTo(v.depreciation, 1);
  });

  it("totals across assets", () => {
    const assets = [
      makeAsset({ id: "a", currentValue: 1000 }),
      makeAsset({ id: "b", currentValue: 2000 }),
    ];
    expect(totalAssetValue(assets, FIXED_NOW)).toBe(3000);
  });

  it("finds warranties lapsing inside a window", () => {
    const soon = makeAsset({ id: "soon", warrantyExpiresAt: "2026-08-01" });
    const later = makeAsset({ id: "later", warrantyExpiresAt: "2028-01-01" });
    const found = warrantiesExpiring([soon, later], FIXED_NOW, 30);
    expect(found).toHaveLength(1);
    expect(found[0]?.assetId).toBe("soon");
  });
});

describe("assets — grouping and links", () => {
  it("filters and counts by type", () => {
    const assets = [
      makeAsset({ id: "a", type: "electronics" }),
      makeAsset({ id: "b", type: "furniture" }),
      makeAsset({ id: "c", type: "electronics" }),
    ];
    expect(assetsByType(assets, "electronics")).toHaveLength(2);
    expect(countAssetsByType(assets)).toEqual({ electronics: 2, furniture: 1 });
  });

  it("groups value by type", () => {
    const assets = [
      makeAsset({ id: "a", type: "electronics", currentValue: 1000 }),
      makeAsset({ id: "b", type: "electronics", currentValue: 500 }),
      makeAsset({ id: "c", type: "jewelry", currentValue: 2000 }),
    ];
    expect(assetValueByType(assets, FIXED_NOW)).toEqual({ electronics: 1500, jewelry: 2000 });
  });

  it("computes age in whole years", () => {
    expect(ageYears(makeAsset({ purchasedAt: "2025-07-16" }), FIXED_NOW)).toBe(1);
    expect(ageYears(makeAsset({ purchasedAt: "2026-07-01" }), FIXED_NOW)).toBe(0);
  });

  it("total cost of ownership adds completed upkeep to the purchase price", () => {
    const asset = makeAsset({ purchasePrice: 100_000 });
    const items = [
      makeMaintenance({ id: "m1", cost: 5_000, completedAt: "2026-01-01T09:00:00.000Z" }),
      makeMaintenance({ id: "m2", cost: 3_000, completedAt: "2026-03-01T09:00:00.000Z" }),
      // Scheduled but not done — not yet a cost.
      makeMaintenance({ id: "m3", cost: 9_999, completedAt: null }),
    ];
    expect(lifetimeSpend(asset, items)).toBe(8_000);
    expect(totalCostOfOwnership(asset, items)).toBe(108_000);
  });

  it("knows whether an asset is insured", () => {
    const asset = makeAsset({ id: "asset-1" });
    expect(isInsured(asset, [makePolicy({ assetId: "asset-1" })])).toBe(true);
    expect(isInsured(asset, [makePolicy({ assetId: null })])).toBe(false);
  });

  it("surfaces uninsured assets above a value threshold, richest first", () => {
    const assets = [
      makeAsset({ id: "cheap", currentValue: 1_000 }),
      makeAsset({ id: "rich", currentValue: 500_000 }),
      makeAsset({ id: "covered", currentValue: 900_000 }),
    ];
    const policies = [makePolicy({ assetId: "covered" })];
    const found = uninsuredAbove(assets, policies, FIXED_NOW, 10_000);
    expect(found.map((a) => a.id)).toEqual(["rich"]);
  });

  it("searches name, serial and location; blank query returns nothing", () => {
    const assets = [makeAsset({ name: "MacBook Pro", serialNumber: "C02XYZ", location: "Desk" })];
    expect(searchAssets(assets, "macbook")).toHaveLength(1);
    expect(searchAssets(assets, "c02")).toHaveLength(1);
    expect(searchAssets(assets, "desk")).toHaveLength(1);
    expect(searchAssets(assets, "")).toHaveLength(0);
    expect(searchAssets(assets, "nothing")).toHaveLength(0);
  });
});
