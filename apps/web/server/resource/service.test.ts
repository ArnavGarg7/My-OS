import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  insertInvestmentAccount: vi.fn(),
  listPositions: vi.fn(),
  insertPosition: vi.fn(),
  updatePositionRow: vi.fn(),
  deletePosition: vi.fn(),
  listInvestmentTransactions: vi.fn(),
  insertInvestmentTransaction: vi.fn(),
  listAssets: vi.fn(),
  insertAsset: vi.fn(),
  updateAssetRow: vi.fn(),
  deleteAsset: vi.fn(),
  listMaintenance: vi.fn(),
  insertMaintenance: vi.fn(),
  updateMaintenanceRow: vi.fn(),
  listVehicles: vi.fn(),
  insertVehicle: vi.fn(),
  updateVehicleRow: vi.fn(),
  listPolicies: vi.fn(),
  insertPolicy: vi.fn(),
  updatePolicyRow: vi.fn(),
  listDocuments: vi.fn(),
  insertDocument: vi.fn(),
  updateDocumentRow: vi.fn(),
  listTravelDocuments: vi.fn(),
  insertTravelDocument: vi.fn(),
  updateTravelDocumentRow: vi.fn(),
  listRelationships: vi.fn(),
  insertRelationship: vi.fn(),
  updateRelationshipRow: vi.fn(),
  listInteractions: vi.fn(),
  insertInteraction: vi.fn(),
  listRelationshipEvents: vi.fn(),
  insertRelationshipEvent: vi.fn(),
  listInventory: vi.fn(),
  insertInventoryItem: vi.fn(),
  updateInventoryRow: vi.fn(),
  deleteInventoryItem: vi.fn(),
  listReviews: vi.fn(),
  insertReview: vi.fn(),
  portfolio: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);
vi.mock("./portfolio", () => ({ portfolio: h.portfolio, gather: vi.fn() }));

import {
  addClaim,
  completeMaintenance,
  createAsset,
  createInvestmentAccount,
  createPolicy,
  createRelationship,
  createReview,
  logInteraction,
  recordInvestmentTransaction,
  renewDocument,
  search,
  setFollowUp,
  updatePrice,
} from "./service";
import { makePolicy, makePosition } from "@myos/core/resource";

const db = {} as never;

beforeEach(() => {
  vi.clearAllMocks();
  h.insertInvestmentAccount.mockResolvedValue({ id: "acct-1" });
  h.insertAsset.mockResolvedValue({ id: "asset-1" });
  h.insertPolicy.mockResolvedValue({ id: "pol-1" });
  h.insertRelationship.mockResolvedValue({ id: "rel-1" });
  h.insertInteraction.mockResolvedValue({ id: "int-1" });
  h.insertMaintenance.mockResolvedValue({ id: "mnt-2" });
  h.insertInvestmentTransaction.mockResolvedValue({ id: "itx-1" });
  h.updatePositionRow.mockResolvedValue({ id: "pos-1" });
  h.updateMaintenanceRow.mockResolvedValue({ id: "mnt-1" });
  h.updateDocumentRow.mockResolvedValue({ id: "doc-1" });
  h.updateRelationshipRow.mockResolvedValue({ id: "rel-1" });
  h.updatePolicyRow.mockResolvedValue({ id: "pol-1" });
  h.insertReview.mockResolvedValue({ id: "rev-1" });
  h.portfolio.mockResolvedValue({ netWorth: 123_456 });
  for (const fn of [
    h.listPositions,
    h.listAssets,
    h.listMaintenance,
    h.listPolicies,
    h.listDocuments,
    h.listTravelDocuments,
    h.listRelationships,
    h.listInteractions,
    h.listVehicles,
    h.listInvestmentTransactions,
    h.listReviews,
  ]) {
    fn.mockResolvedValue([]);
  }
});

describe("service — entity creation goes through the engine", () => {
  it("creates an investment account with trimmed input", async () => {
    await createInvestmentAccount(db, { name: "  Zerodha  " });
    expect(h.insertInvestmentAccount).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ name: "Zerodha" }),
    );
  });

  it("creates an asset with engine defaults", async () => {
    await createAsset(db, { name: "Laptop" });
    expect(h.insertAsset).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ name: "Laptop", type: "electronics", currentValue: null }),
    );
  });

  it("creates a relationship unarchived", async () => {
    await createRelationship(db, { name: "Asha" });
    expect(h.insertRelationship).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ name: "Asha", archived: false }),
    );
  });

  it("logs an interaction defaulting to a message", async () => {
    await logInteraction(db, { relationshipId: "rel-1" });
    expect(h.insertInteraction).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ relationshipId: "rel-1", type: "message" }),
    );
  });

  it("creates a policy with empty claim history", async () => {
    await createPolicy(db, { name: "Cover", expiresAt: "2027-01-01" });
    expect(h.insertPolicy).toHaveBeenCalledWith(db, expect.objectContaining({ claims: [] }));
  });
});

describe("service — the position row is a cache of its ledger", () => {
  it("re-derives quantity and average cost after a buy", async () => {
    h.listPositions.mockResolvedValue([makePosition({ id: "pos-1", quantity: 0, averageCost: 0 })]);
    h.listInvestmentTransactions.mockResolvedValue([
      {
        id: "a",
        positionId: "pos-1",
        direction: "buy",
        quantity: 10,
        price: 100,
        fees: 0,
        occurredAt: "2026-01-01T00:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "b",
        positionId: "pos-1",
        direction: "buy",
        quantity: 10,
        price: 200,
        fees: 0,
        occurredAt: "2026-02-01T00:00:00.000Z",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
    ]);

    await recordInvestmentTransaction(db, {
      positionId: "pos-1",
      direction: "buy",
      quantity: 10,
      price: 200,
    });

    expect(h.insertInvestmentTransaction).toHaveBeenCalled();
    expect(h.updatePositionRow).toHaveBeenCalledWith(db, "pos-1", {
      quantity: 20,
      averageCost: 150,
    });
  });

  it("returns null when the position no longer exists", async () => {
    h.listPositions.mockResolvedValue([]);
    const out = await recordInvestmentTransaction(db, {
      positionId: "gone",
      direction: "buy",
      quantity: 1,
      price: 1,
    });
    expect(out).toBeNull();
    expect(h.updatePositionRow).not.toHaveBeenCalled();
  });

  it("a price update stamps pricedAt so staleness is visible", async () => {
    await updatePrice(db, "pos-1", 175);
    const patch = h.updatePositionRow.mock.calls[0]?.[2];
    expect(patch.currentPrice).toBe(175);
    expect(typeof patch.pricedAt).toBe("string");
  });
});

describe("service — maintenance completion", () => {
  it("marks the item complete and records the actual cost", async () => {
    h.listMaintenance.mockResolvedValue([
      {
        id: "mnt-1",
        assetId: "asset-1",
        title: "Service",
        dueAt: "2026-07-01",
        completedAt: null,
        cost: 1000,
        notes: "",
        intervalDays: 0,
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
      },
    ]);
    await completeMaintenance(db, "mnt-1", 1500);
    const patch = h.updateMaintenanceRow.mock.calls[0]?.[2];
    expect(patch.cost).toBe(1500);
    expect(typeof patch.completedAt).toBe("string");
    // One-off: no follow-up row.
    expect(h.insertMaintenance).not.toHaveBeenCalled();
  });

  it("a recurring item spawns its next occurrence, leaving history intact", async () => {
    h.listMaintenance.mockResolvedValue([
      {
        id: "mnt-1",
        assetId: "asset-1",
        title: "Oil change",
        dueAt: "2026-07-01",
        completedAt: null,
        cost: 2000,
        notes: "",
        intervalDays: 90,
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
      },
    ]);
    await completeMaintenance(db, "mnt-1");
    expect(h.insertMaintenance).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ title: "Oil change", intervalDays: 90 }),
    );
  });

  it("returns null for an unknown item", async () => {
    h.listMaintenance.mockResolvedValue([]);
    expect(await completeMaintenance(db, "gone")).toBeNull();
  });
});

describe("service — insurance claims + document renewal", () => {
  it("appends a claim rather than replacing history", async () => {
    h.listPolicies.mockResolvedValue([makePolicy({ id: "pol-1", claims: ["first"] })]);
    await addClaim(db, "pol-1", "second");
    expect(h.updatePolicyRow).toHaveBeenCalledWith(db, "pol-1", {
      claims: ["first", "second"],
    });
  });

  it("returns null when the policy is missing", async () => {
    h.listPolicies.mockResolvedValue([]);
    expect(await addClaim(db, "gone", "x")).toBeNull();
  });

  it("renewing a document pushes the expiry in place — no duplicate row", async () => {
    await renewDocument(db, "doc-1", "2036-01-01");
    expect(h.updateDocumentRow).toHaveBeenCalledWith(db, "doc-1", { expiresAt: "2036-01-01" });
    expect(h.insertDocument).not.toHaveBeenCalled();
  });

  it("sets and clears a follow-up date", async () => {
    await setFollowUp(db, "rel-1", "2026-08-01");
    expect(h.updateRelationshipRow).toHaveBeenCalledWith(db, "rel-1", {
      nextFollowUpAt: "2026-08-01",
    });
    await setFollowUp(db, "rel-1", null);
    expect(h.updateRelationshipRow).toHaveBeenLastCalledWith(db, "rel-1", {
      nextFollowUpAt: null,
    });
  });
});

describe("service — reviews snapshot the derived net worth", () => {
  it("captures the portfolio's net worth at review time", async () => {
    await createReview(db, { frequency: "quarterly" });
    expect(h.portfolio).toHaveBeenCalled();
    expect(h.insertReview).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ netWorth: 123_456, frequency: "quarterly" }),
    );
  });
});

describe("service — search spans every entity", () => {
  it("loads all collections and returns ranked hits", async () => {
    h.listAssets.mockResolvedValue([
      {
        id: "a1",
        name: "MacBook Pro",
        type: "electronics",
        purchasePrice: 1,
        purchasedAt: "2026-01-01",
        currentValue: null,
        depreciationRate: null,
        warrantyExpiresAt: null,
        serialNumber: "",
        location: "",
        notes: "",
        knowledgeNoteId: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    const hits = await search(db, "macbook");
    expect(hits).toHaveLength(1);
    expect(hits[0]?.kind).toBe("asset");
  });

  it("a blank query returns nothing", async () => {
    expect(await search(db, "  ")).toHaveLength(0);
  });
});
