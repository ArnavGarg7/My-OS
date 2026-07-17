import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  listPositions: vi.fn(),
  listAssets: vi.fn(),
  listPolicies: vi.fn(),
  listDocuments: vi.fn(),
  listTravelDocuments: vi.fn(),
  listVehicles: vi.fn(),
  listInventory: vi.fn(),
  listRelationships: vi.fn(),
  listInteractions: vi.fn(),
  listRelationshipEvents: vi.fn(),
  listMaintenance: vi.fn(),
  listReviews: vi.fn(),
  financeBridge: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);
vi.mock("./bridge", () => ({ financeBridge: h.financeBridge }));

import { portfolio } from "./portfolio";
import { signals, summary } from "./summary";
import { statistics } from "./statistics";
import { forecast } from "./forecasting";
import { maintenanceSchedule, overdueMaintenance } from "./maintenance";
import { birthdays, health } from "./relationships";
import {
  FIXED_NOW,
  interactionSeries,
  makeAsset,
  makeMaintenance,
  makePolicy,
  makePosition,
  makeRelationship,
} from "@myos/core/resource";

const db = {} as never;

beforeEach(() => {
  vi.clearAllMocks();
  for (const fn of [
    h.listPositions,
    h.listAssets,
    h.listPolicies,
    h.listDocuments,
    h.listTravelDocuments,
    h.listVehicles,
    h.listInventory,
    h.listRelationships,
    h.listInteractions,
    h.listRelationshipEvents,
    h.listMaintenance,
    h.listReviews,
  ]) {
    fn.mockResolvedValue([]);
  }
  h.financeBridge.mockResolvedValue({ cashBalance: 0, liabilities: 0 });
});

describe("portfolio view — derived on every read", () => {
  it("is all zeros with no data", async () => {
    const p = await portfolio(db, FIXED_NOW);
    expect(p.netWorth).toBe(0);
    expect(p.upcomingRenewals).toEqual([]);
  });

  it("combines investments, assets and the finance bridge into net worth", async () => {
    h.listPositions.mockResolvedValue([
      makePosition({ quantity: 10, averageCost: 100, currentPrice: 150 }),
    ]);
    h.listAssets.mockResolvedValue([makeAsset({ currentValue: 50_000 })]);
    h.financeBridge.mockResolvedValue({ cashBalance: 10_000, liabilities: 5_000 });

    const p = await portfolio(db, FIXED_NOW);
    expect(p.investmentValue).toBe(1_500);
    expect(p.assetValue).toBe(50_000);
    expect(p.netWorth).toBe(56_500);
    expect(p.liabilities).toBe(5_000);
  });

  it("asks the bridge for Finance's numbers rather than reading Finance tables", async () => {
    await portfolio(db, FIXED_NOW);
    expect(h.financeBridge).toHaveBeenCalledWith(db);
  });
});

describe("summary + signals views", () => {
  it("summary reports the nearest birthday", async () => {
    h.listRelationships.mockResolvedValue([
      makeRelationship({ name: "Asha Menon", birthday: "07-20" }),
    ]);
    const s = await summary(db, FIXED_NOW);
    expect(s.nextBirthday).toBe("Asha Menon");
    expect(s.upcomingBirthdays).toBe(1);
  });

  it("signals are all false on an empty platform", async () => {
    const s = await signals(db, FIXED_NOW);
    expect(Object.values(s).every((v) => v === false)).toBe(true);
  });

  it("insuranceExpiring fires from a real policy", async () => {
    h.listPolicies.mockResolvedValue([makePolicy({ expiresAt: "2026-08-01" })]);
    expect((await signals(db, FIXED_NOW)).insuranceExpiring).toBe(true);
  });

  it("maintenanceOverdue fires from a late item", async () => {
    h.listAssets.mockResolvedValue([makeAsset()]);
    h.listMaintenance.mockResolvedValue([makeMaintenance({ dueAt: "2026-01-01" })]);
    expect((await signals(db, FIXED_NOW)).maintenanceOverdue).toBe(true);
  });

  it("relationshipCold fires for a contact with no history", async () => {
    h.listRelationships.mockResolvedValue([makeRelationship()]);
    expect((await signals(db, FIXED_NOW)).relationshipCold).toBe(true);
  });
});

describe("statistics view", () => {
  it("counts entities and derives overdue maintenance", async () => {
    h.listAssets.mockResolvedValue([makeAsset(), makeAsset({ id: "a2" })]);
    h.listPositions.mockResolvedValue([makePosition()]);
    h.listMaintenance.mockResolvedValue([makeMaintenance({ dueAt: "2026-01-01" })]);
    const s = await statistics(db, FIXED_NOW);
    expect(s.assetCount).toBe(2);
    expect(s.investmentCount).toBe(1);
    expect(s.maintenanceOverdue).toBe(1);
    expect(s.documentHealth).toBe(100);
  });
});

describe("forecast view", () => {
  it("projects premiums and scheduled maintenance", async () => {
    h.listPolicies.mockResolvedValue([
      makePolicy({ startsAt: "2026-01-01", expiresAt: "2028-01-01", premium: 12_000 }),
    ]);
    h.listMaintenance.mockResolvedValue([makeMaintenance({ dueAt: "2026-08-01", cost: 5_000 })]);
    const f = await forecast(db, 365, FIXED_NOW);
    expect(f.total).toBe(17_000);
    expect(f.horizonDays).toBe(365);
  });

  it("an empty platform forecasts nothing", async () => {
    const f = await forecast(db, undefined, FIXED_NOW);
    expect(f.entries).toHaveLength(0);
  });
});

describe("maintenance views — status is derived, never stored", () => {
  it("resolves the asset name and separates overdue from scheduled", async () => {
    h.listAssets.mockResolvedValue([makeAsset({ id: "asset-1", name: "MacBook Pro" })]);
    h.listMaintenance.mockResolvedValue([
      makeMaintenance({ id: "late", assetId: "asset-1", dueAt: "2026-01-01" }),
      makeMaintenance({ id: "future", assetId: "asset-1", dueAt: "2026-12-01" }),
    ]);
    const all = await maintenanceSchedule(db, FIXED_NOW);
    expect(all).toHaveLength(2);
    expect(all[0]?.assetName).toBe("MacBook Pro");
    const late = await overdueMaintenance(db, FIXED_NOW);
    expect(late.map((v) => v.id)).toEqual(["late"]);
  });
});

describe("relationship views", () => {
  it("reports health weakest-first", async () => {
    h.listRelationships.mockResolvedValue([
      makeRelationship({ id: "rel-1", name: "Strong" }),
      makeRelationship({ id: "rel-2", name: "Quiet" }),
    ]);
    h.listInteractions.mockResolvedValue(interactionSeries("rel-1", 4, 5, 0));
    const report = await health(db, FIXED_NOW);
    expect(report[0]?.name).toBe("Quiet");
    expect(report[1]?.strength).toBe("strong");
  });

  it("lists birthdays inside the reminder window", async () => {
    h.listRelationships.mockResolvedValue([
      makeRelationship({ id: "a", birthday: "07-20" }),
      makeRelationship({ id: "b", birthday: "12-01" }),
    ]);
    const found = await birthdays(db, FIXED_NOW);
    expect(found.map((d) => d.relationshipId)).toEqual(["a"]);
  });
});
