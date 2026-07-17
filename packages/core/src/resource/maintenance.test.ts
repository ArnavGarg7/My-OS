import { describe, expect, it } from "vitest";
import {
  completedCount,
  dueWithin,
  maintenanceSpend,
  nextDueDate,
  overdue,
  schedule,
  statusOf,
  viewOf,
} from "./maintenance";
import { uninsured, vehicleMaintenance, vehicleRenewals, vehicleSpend } from "./vehicles";
import { FIXED_NOW, makeAsset, makeMaintenance, makeVehicle } from "./fixtures";

describe("maintenance — derived status", () => {
  it("is scheduled when due in the future", () => {
    expect(statusOf(makeMaintenance({ dueAt: "2026-08-01" }), FIXED_NOW)).toBe("scheduled");
  });

  it("is overdue when the date has passed", () => {
    expect(statusOf(makeMaintenance({ dueAt: "2026-07-01" }), FIXED_NOW)).toBe("overdue");
  });

  it("is scheduled — not overdue — on the day it is due", () => {
    expect(statusOf(makeMaintenance({ dueAt: "2026-07-16" }), FIXED_NOW)).toBe("scheduled");
  });

  it("completion beats the calendar: a completed past item is not overdue", () => {
    const item = makeMaintenance({ dueAt: "2026-01-01", completedAt: "2026-01-02T09:00:00.000Z" });
    expect(statusOf(item, FIXED_NOW)).toBe("completed");
  });
});

describe("maintenance — views + schedule", () => {
  it("resolves the asset name and days until due", () => {
    const v = viewOf(makeMaintenance({ dueAt: "2026-07-26" }), [makeAsset()], FIXED_NOW);
    expect(v.assetName).toBe("MacBook Pro");
    expect(v.daysUntilDue).toBe(10);
  });

  it("degrades gracefully when the asset is missing", () => {
    const v = viewOf(makeMaintenance({ assetId: "gone" }), [], FIXED_NOW);
    expect(v.assetName).toBe("Unknown asset");
  });

  it("reports negative days for overdue work", () => {
    const v = viewOf(makeMaintenance({ dueAt: "2026-07-06" }), [makeAsset()], FIXED_NOW);
    expect(v.daysUntilDue).toBe(-10);
  });

  it("sorts soonest-due first", () => {
    const items = [
      makeMaintenance({ id: "later", dueAt: "2026-09-01" }),
      makeMaintenance({ id: "sooner", dueAt: "2026-07-20" }),
    ];
    expect(schedule(items, [makeAsset()], FIXED_NOW)[0]?.id).toBe("sooner");
  });

  it("filters overdue and due-within", () => {
    const items = [
      makeMaintenance({ id: "past", dueAt: "2026-06-01" }),
      makeMaintenance({ id: "soon", dueAt: "2026-07-20" }),
      makeMaintenance({ id: "far", dueAt: "2026-12-01" }),
      makeMaintenance({ id: "done", dueAt: "2026-05-01", completedAt: "2026-05-01T09:00:00.000Z" }),
    ];
    const assets = [makeAsset()];
    expect(overdue(items, assets, FIXED_NOW).map((v) => v.id)).toEqual(["past"]);
    expect(dueWithin(items, assets, FIXED_NOW, 30).map((v) => v.id)).toEqual(["soon"]);
  });
});

describe("maintenance — recurrence + spend", () => {
  it("advances a recurring item by its interval", () => {
    const item = makeMaintenance({ intervalDays: 90 });
    expect(nextDueDate(item, new Date("2026-07-16T00:00:00.000Z"))).toBe("2026-10-14");
  });

  it("one-off items simply end — no next date", () => {
    expect(nextDueDate(makeMaintenance({ intervalDays: 0 }), FIXED_NOW)).toBeNull();
  });

  it("sums only completed spend", () => {
    const items = [
      makeMaintenance({ id: "a", cost: 1000, completedAt: "2026-01-01T09:00:00.000Z" }),
      makeMaintenance({ id: "b", cost: 500, completedAt: null }),
    ];
    expect(maintenanceSpend(items)).toBe(1000);
    expect(completedCount(items)).toBe(1);
  });
});

describe("vehicles", () => {
  it("surfaces registration + pollution renewals inside the window", () => {
    const v = makeVehicle({
      pollutionExpiresAt: "2026-08-01",
      registrationExpiresAt: "2027-01-01",
    });
    const renewals = vehicleRenewals([v], FIXED_NOW, 30);
    expect(renewals).toHaveLength(1);
    expect(renewals[0]?.name).toContain("pollution");
    expect(renewals[0]?.source).toBe("vehicle");
  });

  it("marks lapsed vehicle documents as expired", () => {
    const v = makeVehicle({ pollutionExpiresAt: "2026-06-01", registrationExpiresAt: null });
    const [item] = vehicleRenewals([v], FIXED_NOW, 30);
    expect(item?.expired).toBe(true);
    expect(item?.daysUntil).toBeLessThan(0);
  });

  it("ignores vehicles with no expiry dates set", () => {
    const v = makeVehicle({ pollutionExpiresAt: null, registrationExpiresAt: null });
    expect(vehicleRenewals([v], FIXED_NOW, 30)).toHaveLength(0);
  });

  it("reads maintenance through the linked asset — one scheduler, not two", () => {
    const vehicle = makeVehicle({ assetId: "asset-1" });
    const items = [makeMaintenance({ assetId: "asset-1", title: "Oil change" })];
    const found = vehicleMaintenance(vehicle, items, [makeAsset()], FIXED_NOW);
    expect(found).toHaveLength(1);
    expect(found[0]?.title).toBe("Oil change");
  });

  it("an unlinked vehicle has no maintenance and no spend", () => {
    const vehicle = makeVehicle({ assetId: null });
    expect(vehicleMaintenance(vehicle, [makeMaintenance()], [makeAsset()], FIXED_NOW)).toHaveLength(
      0,
    );
    expect(vehicleSpend(vehicle, [makeMaintenance()])).toBe(0);
  });

  it("sums completed vehicle spend", () => {
    const vehicle = makeVehicle({ assetId: "asset-1" });
    const items = [
      makeMaintenance({
        id: "a",
        assetId: "asset-1",
        cost: 3000,
        completedAt: "2026-01-01T09:00:00.000Z",
      }),
      makeMaintenance({ id: "b", assetId: "asset-1", cost: 7000, completedAt: null }),
    ];
    expect(vehicleSpend(vehicle, items)).toBe(3000);
  });

  it("flags uninsured vehicles", () => {
    const list = [
      makeVehicle({ id: "a", insurancePolicyId: null }),
      makeVehicle({ id: "b", insurancePolicyId: "pol-1" }),
    ];
    expect(uninsured(list).map((v) => v.id)).toEqual(["a"]);
  });
});
