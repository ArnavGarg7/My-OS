import { describe, expect, it } from "vitest";
import {
  buildForecast,
  maintenanceSchedule,
  premiumSchedule,
  projectInvestment,
  travelSchedule,
  vehicleSchedule,
} from "./forecasting";
import {
  allCorrelations,
  ageVsMaintenanceCost,
  pearson,
  priceVsMaintenanceCost,
} from "./correlations";
import { addDays, daysBetween, nextOccurrence, parseDate, round2, yearsBetween } from "./dates";
import {
  FIXED_NOW,
  makeAsset,
  makeMaintenance,
  makePolicy,
  makeTravelDocument,
  makeVehicle,
} from "./fixtures";

describe("dates", () => {
  it("counts whole days in both directions", () => {
    expect(daysBetween(FIXED_NOW, parseDate("2026-07-26"))).toBe(10);
    expect(daysBetween(FIXED_NOW, parseDate("2026-07-06"))).toBe(-10);
    expect(daysBetween(FIXED_NOW, parseDate("2026-07-16"))).toBe(0);
  });

  it("adds days across a month boundary", () => {
    expect(addDays(parseDate("2026-07-30"), 3).toISOString().slice(0, 10)).toBe("2026-08-02");
  });

  it("measures fractional years", () => {
    expect(yearsBetween(parseDate("2025-07-16"), parseDate("2026-07-16"))).toBeCloseTo(1, 2);
  });

  it("rounds money to 2dp without float drift", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(1.005)).toBe(1.01);
  });

  it("resolves the next occurrence of a MM-DD", () => {
    expect(nextOccurrence("07-20", FIXED_NOW).toISOString().slice(0, 10)).toBe("2026-07-20");
    expect(nextOccurrence("01-01", FIXED_NOW).toISOString().slice(0, 10)).toBe("2027-01-01");
  });

  it("rolls Feb 29 to Mar 1 in a non-leap year, like a calendar does", () => {
    // 2027 is not a leap year.
    const d = nextOccurrence("02-29", new Date("2027-01-01T00:00:00.000Z"));
    expect(d.toISOString().slice(0, 10)).toBe("2027-03-01");
  });
});

describe("forecasting — insurance premiums", () => {
  it("projects annual premiums on their cadence", () => {
    // Starts 2026-01-01, annual → next payment 2027-01-01, inside a 365-day horizon.
    const p = makePolicy({ startsAt: "2026-01-01", expiresAt: "2028-01-01", premium: 12_000 });
    const entries = premiumSchedule(p, FIXED_NOW, 365);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.date).toBe("2027-01-01");
    expect(entries[0]?.amount).toBe(12_000);
  });

  it("projects monthly premiums repeatedly", () => {
    const p = makePolicy({
      startsAt: "2026-01-01",
      expiresAt: "2027-01-01",
      premium: 1_000,
      premiumIntervalMonths: 1,
    });
    const entries = premiumSchedule(p, FIXED_NOW, 90);
    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(entries.every((e) => e.amount === 1_000)).toBe(true);
  });

  it("stops charging once the policy expires", () => {
    const p = makePolicy({
      startsAt: "2026-01-01",
      expiresAt: "2026-08-01",
      premiumIntervalMonths: 1,
    });
    const entries = premiumSchedule(p, FIXED_NOW, 365);
    expect(entries.every((e) => e.date <= "2026-08-01")).toBe(true);
  });
});

describe("forecasting — maintenance, vehicles, travel", () => {
  it("includes scheduled costed maintenance inside the horizon", () => {
    const items = [
      makeMaintenance({ id: "in", dueAt: "2026-08-01", cost: 5_000 }),
      makeMaintenance({ id: "out", dueAt: "2027-01-01", cost: 5_000 }),
      makeMaintenance({ id: "free", dueAt: "2026-08-01", cost: 0 }),
      makeMaintenance({
        id: "done",
        dueAt: "2026-08-01",
        cost: 5_000,
        completedAt: "2026-07-01T09:00:00.000Z",
      }),
    ];
    const entries = maintenanceSchedule(items, FIXED_NOW, 90);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.amount).toBe(5_000);
  });

  it("forecasts vehicle + travel renewals at zero — dated, but cost unknown", () => {
    const v = vehicleSchedule([makeVehicle({ pollutionExpiresAt: "2026-08-01" })], FIXED_NOW, 90);
    expect(v[0]?.amount).toBe(0);
    const t = travelSchedule([makeTravelDocument({ expiresAt: "2026-08-01" })], FIXED_NOW, 90);
    expect(t[0]?.amount).toBe(0);
  });

  it("ignores travel documents with no expiry", () => {
    expect(travelSchedule([makeTravelDocument({ expiresAt: null })], FIXED_NOW, 90)).toHaveLength(
      0,
    );
  });
});

describe("forecasting — the whole forecast", () => {
  it("merges sources, sorts by date and totals", () => {
    const forecast = buildForecast(
      {
        policies: [
          makePolicy({
            startsAt: "2026-01-01",
            expiresAt: "2028-01-01",
            premium: 1_000,
            premiumIntervalMonths: 1,
          }),
        ],
        maintenance: [makeMaintenance({ dueAt: "2026-08-01", cost: 500 })],
        vehicles: [makeVehicle({ pollutionExpiresAt: "2026-08-01", registrationExpiresAt: null })],
        travel: [],
      },
      FIXED_NOW,
      60,
    );
    const dates = forecast.entries.map((e) => e.date);
    expect([...dates].sort()).toEqual(dates);
    expect(forecast.total).toBeGreaterThan(0);
    expect(forecast.horizonDays).toBe(60);
  });

  it("flags entries at or above the large-expense threshold", () => {
    const forecast = buildForecast(
      {
        policies: [],
        maintenance: [
          makeMaintenance({ id: "big", dueAt: "2026-08-01", cost: 15_000 }),
          makeMaintenance({ id: "small", dueAt: "2026-08-01", cost: 100 }),
        ],
        vehicles: [],
        travel: [],
      },
      FIXED_NOW,
      90,
    );
    expect(forecast.largeExpenses).toHaveLength(1);
    expect(forecast.largeExpenses[0]?.amount).toBe(15_000);
  });

  it("an empty platform forecasts nothing", () => {
    const f = buildForecast({ policies: [], maintenance: [], vehicles: [], travel: [] }, FIXED_NOW);
    expect(f.entries).toHaveLength(0);
    expect(f.total).toBe(0);
  });
});

describe("forecasting — investment projection", () => {
  it("compounds at the rate the user supplies", () => {
    expect(projectInvestment(100_000, 10, 2)).toBe(121_000);
  });

  it("is flat over zero years and safe at zero value", () => {
    expect(projectInvestment(100_000, 10, 0)).toBe(100_000);
    expect(projectInvestment(0, 10, 5)).toBe(0);
  });
});

describe("correlations", () => {
  it("pearson: perfect positive, perfect negative, and flat", () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBe(1);
    expect(pearson([1, 2, 3], [6, 4, 2])).toBe(-1);
    // Zero variance in one series → 0, not NaN.
    expect(pearson([1, 1, 1], [1, 2, 3])).toBe(0);
  });

  it("pearson needs two points", () => {
    expect(pearson([1], [1])).toBe(0);
    expect(pearson([], [])).toBe(0);
  });

  it("reports nothing below the minimum sample count", () => {
    const assets = [makeAsset({ id: "a" }), makeAsset({ id: "b" })];
    expect(ageVsMaintenanceCost(assets, [], FIXED_NOW)).toBeNull();
    expect(priceVsMaintenanceCost(assets, [])).toBeNull();
    expect(allCorrelations(assets, [], FIXED_NOW)).toHaveLength(0);
  });

  it("correlates age against maintenance spend with enough samples", () => {
    const assets = Array.from({ length: 5 }, (_, i) =>
      makeAsset({ id: `a${i}`, purchasedAt: `202${i}-01-01`, purchasePrice: 1000 * (i + 1) }),
    );
    const maintenance = assets.map((a, i) =>
      makeMaintenance({
        id: `m${i}`,
        assetId: a.id,
        cost: 1000 * i,
        completedAt: "2026-01-01T09:00:00.000Z",
      }),
    );
    const c = ageVsMaintenanceCost(assets, maintenance, FIXED_NOW);
    expect(c).not.toBeNull();
    expect(c?.samples).toBe(5);
    expect(c?.coefficient).toBeGreaterThanOrEqual(-1);
    expect(c?.coefficient).toBeLessThanOrEqual(1);
    expect(allCorrelations(assets, maintenance, FIXED_NOW)).toHaveLength(2);
  });
});
