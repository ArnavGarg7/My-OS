import { describe, expect, it } from "vitest";
import { FIXED_NOW, makeInvestmentTransaction, makePosition, testEngine } from "./fixtures";

describe("engine — injected clock and ids keep the platform pure", () => {
  it("stamps the injected now, not the wall clock", () => {
    const e = testEngine();
    const asset = e.makeAsset({ name: "Desk" });
    expect(asset.createdAt).toBe(FIXED_NOW.toISOString());
    expect(asset.updatedAt).toBe(FIXED_NOW.toISOString());
  });

  it("uses the injected id generator", () => {
    const e = testEngine();
    expect(e.makeAsset({ name: "A" }).id).toBe("id-1");
    expect(e.makeAsset({ name: "B" }).id).toBe("id-2");
  });

  it("trims names and applies sensible defaults", () => {
    const e = testEngine();
    const asset = e.makeAsset({ name: "  Desk  " });
    expect(asset.name).toBe("Desk");
    expect(asset.type).toBe("electronics");
    expect(asset.currentValue).toBeNull();
    expect(asset.knowledgeNoteId).toBeNull();
  });

  it("defaults an asset's purchase date to today", () => {
    const e = testEngine();
    expect(e.makeAsset({ name: "Desk" }).purchasedAt).toBe("2026-07-16");
  });
});

describe("engine — investments", () => {
  it("upper-cases symbols and falls back to the symbol for the name", () => {
    const e = testEngine();
    const p = e.makePosition({ accountId: "acct-1", symbol: "infy" });
    expect(p.symbol).toBe("INFY");
    expect(p.name).toBe("infy");
  });

  it("only stamps pricedAt when a price is actually supplied", () => {
    const e = testEngine();
    expect(e.makePosition({ accountId: "a", symbol: "X" }).pricedAt).toBeNull();
    expect(e.makePosition({ accountId: "a", symbol: "X", currentPrice: 10 }).pricedAt).toBe(
      FIXED_NOW.toISOString(),
    );
  });

  it("reprice re-derives quantity and average cost from the ledger", () => {
    const e = testEngine();
    const position = makePosition({ id: "pos-1", quantity: 0, averageCost: 0 });
    const txs = [
      makeInvestmentTransaction({ id: "a", positionId: "pos-1", quantity: 10, price: 100 }),
      makeInvestmentTransaction({
        id: "b",
        positionId: "pos-1",
        quantity: 10,
        price: 200,
        occurredAt: "2026-02-01T09:00:00.000Z",
      }),
      // Belongs to a different position — must not leak in.
      makeInvestmentTransaction({ id: "c", positionId: "pos-2", quantity: 99, price: 1 }),
    ];
    const repriced = e.reprice(position, txs);
    expect(repriced.quantity).toBe(20);
    expect(repriced.averageCost).toBe(150);
    expect(repriced.updatedAt).toBe(FIXED_NOW.toISOString());
  });

  it("makes a transaction with zero default fees and now as the default date", () => {
    const e = testEngine();
    const t = e.makeInvestmentTransaction({
      positionId: "p",
      direction: "buy",
      quantity: 1,
      price: 10,
    });
    expect(t.fees).toBe(0);
    expect(t.occurredAt).toBe(FIXED_NOW.toISOString());
  });
});

describe("engine — the rest of the entities", () => {
  it("builds a policy with an annual cadence and empty claim history", () => {
    const e = testEngine();
    const p = e.makePolicy({ name: "Cover", expiresAt: "2027-01-01" });
    expect(p.premiumIntervalMonths).toBe(12);
    expect(p.claims).toEqual([]);
    expect(p.startsAt).toBe("2026-07-16");
  });

  it("builds a one-off maintenance item that starts incomplete", () => {
    const e = testEngine();
    const m = e.makeMaintenance({ assetId: "a", title: "Service", dueAt: "2026-09-01" });
    expect(m.intervalDays).toBe(0);
    expect(m.completedAt).toBeNull();
  });

  it("builds a relationship that starts unarchived with no follow-up", () => {
    const e = testEngine();
    const r = e.makeRelationship({ name: "Asha" });
    expect(r.archived).toBe(false);
    expect(r.nextFollowUpAt).toBeNull();
    expect(r.type).toBe("friend");
    expect(r.interests).toEqual([]);
  });

  it("builds an interaction defaulting to a message now", () => {
    const e = testEngine();
    const i = e.makeInteraction({ relationshipId: "rel-1" });
    expect(i.type).toBe("message");
    expect(i.occurredAt).toBe(FIXED_NOW.toISOString());
  });

  it("builds documents and travel documents with nullable expiries", () => {
    const e = testEngine();
    expect(e.makeDocument({ name: "PAN" }).expiresAt).toBeNull();
    expect(e.makeTravelDocument({ name: "Passport" }).type).toBe("passport");
  });

  it("builds an inventory item defaulting to quantity 1", () => {
    const e = testEngine();
    expect(e.makeInventoryItem({ name: "Chair" }).quantity).toBe(1);
  });

  it("builds a vehicle and a review with today's defaults", () => {
    const e = testEngine();
    expect(e.makeVehicle({ name: "Swift" }).type).toBe("car");
    expect(e.makeReview({ frequency: "quarterly" }).periodStart).toBe("2026-07-16");
  });

  it("carries a knowledge link through every entity that accepts one", () => {
    const e = testEngine();
    const note = "note-1";
    expect(e.makeAsset({ name: "A", knowledgeNoteId: note }).knowledgeNoteId).toBe(note);
    expect(e.makeRelationship({ name: "R", knowledgeNoteId: note }).knowledgeNoteId).toBe(note);
    expect(e.makeDocument({ name: "D", knowledgeNoteId: note }).knowledgeNoteId).toBe(note);
    expect(e.makeVehicle({ name: "V", knowledgeNoteId: note }).knowledgeNoteId).toBe(note);
    expect(
      e.makePolicy({ name: "P", expiresAt: "2027-01-01", knowledgeNoteId: note }).knowledgeNoteId,
    ).toBe(note);
    expect(e.makeTravelDocument({ name: "T", knowledgeNoteId: note }).knowledgeNoteId).toBe(note);
    expect(e.makeInventoryItem({ name: "I", knowledgeNoteId: note }).knowledgeNoteId).toBe(note);
    expect(
      e.makePosition({ accountId: "a", symbol: "X", knowledgeNoteId: note }).knowledgeNoteId,
    ).toBe(note);
    expect(e.makeInvestmentAccount({ name: "Acct", knowledgeNoteId: note }).knowledgeNoteId).toBe(
      note,
    );
    expect(e.makeReview({ frequency: "annual", knowledgeNoteId: note }).knowledgeNoteId).toBe(note);
  });
});
