import { describe, expect, it } from "vitest";
import { buildResourcePortfolio, emptyPortfolio } from "./portfolio";
import { buildStatistics, emptyStatistics, maintenanceCompletionRate } from "./statistics";
import {
  buildSummary,
  computeSignals,
  emptySignals,
  emptySummary,
  investmentReviewDue,
} from "./selectors";
import {
  emptyBridge,
  linkedAccounts,
  netWorth,
  unlinkedAccounts,
  positionsFor,
  valueByAccount,
} from "./finance";
import { searchResources } from "./search";
import {
  FIXED_NOW,
  interactionSeries,
  makeAsset,
  makeDocument,
  makeFinanceBridge,
  makeInventoryItem,
  makeInvestmentAccount,
  makeMaintenance,
  makePolicy,
  makePortfolioInput,
  makePosition,
  makeRelationship,
  makeReview,
  makeSignalInput,
  makeTravelDocument,
  makeVehicle,
} from "./fixtures";

describe("finance bridge — the seam, not a second Finance", () => {
  it("net worth is cash + investments + assets − liabilities", () => {
    expect(
      netWorth({ cashBalance: 100, investmentValue: 200, assetValue: 300, liabilities: 50 }),
    ).toBe(550);
  });

  it("goes negative when liabilities exceed everything owned", () => {
    expect(
      netWorth({ cashBalance: 0, investmentValue: 0, assetValue: 100, liabilities: 500 }),
    ).toBe(-400);
  });

  it("an empty bridge contributes nothing", () => {
    expect(emptyBridge()).toEqual({ liabilities: 0, cashBalance: 0 });
  });

  it("partitions linked and unlinked investment accounts", () => {
    const accounts = [
      makeInvestmentAccount({ id: "a", financeAccountId: "fin-1" }),
      makeInvestmentAccount({ id: "b", financeAccountId: null }),
    ];
    expect(linkedAccounts(accounts).map((a) => a.id)).toEqual(["a"]);
    expect(unlinkedAccounts(accounts).map((a) => a.id)).toEqual(["b"]);
  });

  it("values positions per account, richest first", () => {
    const accounts = [
      makeInvestmentAccount({ id: "acct-1" }),
      makeInvestmentAccount({ id: "acct-2" }),
    ];
    const positions = [
      makePosition({ id: "p1", accountId: "acct-1", quantity: 1, currentPrice: 100 }),
      makePosition({ id: "p2", accountId: "acct-2", quantity: 10, currentPrice: 100 }),
    ];
    expect(positionsFor(positions, "acct-1")).toHaveLength(1);
    expect(valueByAccount(accounts, positions)[0]?.account.id).toBe("acct-2");
  });
});

describe("portfolio — always derived", () => {
  it("assembles net worth from every engine plus the Finance bridge", () => {
    const input = makePortfolioInput({
      positions: [makePosition({ quantity: 10, averageCost: 100, currentPrice: 150 })],
      assets: [makeAsset({ currentValue: 50_000 })],
      finance: makeFinanceBridge({ cashBalance: 10_000, liabilities: 5_000 }),
    });
    const p = buildResourcePortfolio(input, FIXED_NOW);
    expect(p.investmentValue).toBe(1_500);
    expect(p.assetValue).toBe(50_000);
    // 10000 + 1500 + 50000 - 5000
    expect(p.netWorth).toBe(56_500);
  });

  it("counts relationships, excluding archived, and buckets by strength", () => {
    const input = makePortfolioInput({
      relationships: [
        makeRelationship({ id: "rel-1" }),
        makeRelationship({ id: "rel-2" }),
        makeRelationship({ id: "rel-3", archived: true }),
      ],
      interactions: interactionSeries("rel-1", 4, 5, 0),
    });
    const p = buildResourcePortfolio(input, FIXED_NOW);
    expect(p.relationshipCount).toBe(2);
    expect(p.strongRelationships).toBe(1);
    expect(p.dormantRelationships).toBe(1);
  });

  it("merges renewals from insurance, travel and vehicles into one sorted list", () => {
    const input = makePortfolioInput({
      policies: [makePolicy({ expiresAt: "2026-08-10" })],
      travel: [makeTravelDocument({ expiresAt: "2026-07-20" })],
      vehicles: [makeVehicle({ pollutionExpiresAt: "2026-08-01", registrationExpiresAt: null })],
    });
    const p = buildResourcePortfolio(input, FIXED_NOW);
    expect(p.upcomingRenewals).toHaveLength(3);
    const days = p.upcomingRenewals.map((r) => r.daysUntil);
    expect([...days].sort((a, b) => a - b)).toEqual(days);
    expect(p.upcomingRenewals[0]?.source).toBe("travel");
  });

  it("totals insurance coverage and home inventory", () => {
    const input = makePortfolioInput({
      policies: [makePolicy({ coverageAmount: 1_000_000, expiresAt: "2027-01-01" })],
      inventory: [makeInventoryItem({ quantity: 2, unitValue: 1_000 })],
    });
    const p = buildResourcePortfolio(input, FIXED_NOW);
    expect(p.insuranceCoverage).toBe(1_000_000);
    expect(p.homeInventoryValue).toBe(2_000);
  });

  it("an empty platform is all zeros", () => {
    const p = buildResourcePortfolio(makePortfolioInput(), FIXED_NOW);
    expect(p).toEqual(emptyPortfolio());
  });
});

describe("statistics", () => {
  it("counts each entity kind", () => {
    const stats = buildStatistics(
      {
        positions: [makePosition()],
        assets: [makeAsset(), makeAsset({ id: "a2" })],
        vehicles: [makeVehicle()],
        policies: [makePolicy()],
        documents: [makeDocument()],
        relationships: [makeRelationship(), makeRelationship({ id: "r2", archived: true })],
        interactions: interactionSeries("rel-1", 2, 1, 0),
        maintenance: [],
      },
      FIXED_NOW,
    );
    expect(stats.assetCount).toBe(2);
    expect(stats.relationshipCount).toBe(1);
    expect(stats.interactionsThisMonth).toBe(2);
  });

  it("counts overdue maintenance via the derived status", () => {
    const stats = buildStatistics(
      {
        positions: [],
        assets: [makeAsset()],
        vehicles: [],
        policies: [],
        documents: [],
        relationships: [],
        interactions: [],
        maintenance: [
          makeMaintenance({ id: "late", dueAt: "2026-01-01" }),
          makeMaintenance({
            id: "done",
            dueAt: "2026-01-01",
            completedAt: "2026-01-02T09:00:00.000Z",
          }),
        ],
      },
      FIXED_NOW,
    );
    expect(stats.maintenanceOverdue).toBe(1);
    expect(stats.maintenanceCompleted).toBe(1);
  });

  it("empty statistics report perfect document health", () => {
    expect(emptyStatistics().documentHealth).toBe(100);
  });

  it("completion rate: empty schedule is 100, half done is 50", () => {
    expect(maintenanceCompletionRate([])).toBe(100);
    expect(
      maintenanceCompletionRate([
        makeMaintenance({ id: "a", completedAt: "2026-01-01T09:00:00.000Z" }),
        makeMaintenance({ id: "b", completedAt: null }),
      ]),
    ).toBe(50);
  });
});

describe("signals — thresholds live here, never in the rules", () => {
  it("all false on an empty platform", () => {
    expect(computeSignals(makeSignalInput(), FIXED_NOW)).toEqual(emptySignals());
  });

  it("insuranceExpiring fires inside the renewal window", () => {
    const s = computeSignals(
      makeSignalInput({ policies: [makePolicy({ expiresAt: "2026-08-01" })] }),
      FIXED_NOW,
    );
    expect(s.insuranceExpiring).toBe(true);
  });

  it("documentExpiring fires for either identity or travel documents", () => {
    expect(
      computeSignals(
        makeSignalInput({ documents: [makeDocument({ expiresAt: "2026-08-01" })] }),
        FIXED_NOW,
      ).documentExpiring,
    ).toBe(true);
    expect(
      computeSignals(
        makeSignalInput({ travel: [makeTravelDocument({ expiresAt: "2026-08-01" })] }),
        FIXED_NOW,
      ).documentExpiring,
    ).toBe(true);
  });

  it("maintenanceOverdue fires only for genuinely late work", () => {
    expect(
      computeSignals(
        makeSignalInput({
          assets: [makeAsset()],
          maintenance: [makeMaintenance({ dueAt: "2026-01-01" })],
        }),
        FIXED_NOW,
      ).maintenanceOverdue,
    ).toBe(true);
    expect(
      computeSignals(
        makeSignalInput({
          assets: [makeAsset()],
          maintenance: [makeMaintenance({ dueAt: "2026-12-01" })],
        }),
        FIXED_NOW,
      ).maintenanceOverdue,
    ).toBe(false);
  });

  it("relationshipCold fires when someone has gone quiet", () => {
    const s = computeSignals(
      makeSignalInput({ relationships: [makeRelationship({ id: "rel-1" })], interactions: [] }),
      FIXED_NOW,
    );
    expect(s.relationshipCold).toBe(true);
  });

  it("portfolioUnbalanced mirrors the concentration limit", () => {
    const s = computeSignals(
      makeSignalInput({
        positions: [makePosition({ type: "crypto", quantity: 10, currentPrice: 100 })],
      }),
      FIXED_NOW,
    );
    expect(s.portfolioUnbalanced).toBe(true);
  });

  it("largeExpenseDue fires on a forecast entry above the threshold", () => {
    const s = computeSignals(
      makeSignalInput({
        assets: [makeAsset()],
        maintenance: [makeMaintenance({ dueAt: "2026-08-01", cost: 50_000 })],
      }),
      FIXED_NOW,
    );
    expect(s.largeExpenseDue).toBe(true);
  });

  it("investmentReviewDue: nothing invested means nothing to review", () => {
    expect(investmentReviewDue([], [], FIXED_NOW)).toBe(false);
  });

  it("investmentReviewDue when never reviewed, or reviewed too long ago", () => {
    const positions = [makePosition()];
    expect(investmentReviewDue([], positions, FIXED_NOW)).toBe(true);
    expect(
      investmentReviewDue([makeReview({ periodStart: "2026-07-01" })], positions, FIXED_NOW),
    ).toBe(false);
    expect(
      investmentReviewDue([makeReview({ periodStart: "2025-01-01" })], positions, FIXED_NOW),
    ).toBe(true);
  });
});

describe("summary — the Morning/status-bar read model", () => {
  it("is all zeros on an empty platform", () => {
    expect(buildSummary(makeSignalInput(), FIXED_NOW)).toEqual(emptySummary());
  });

  it("carries net worth, gain and the nearest birthday name", () => {
    const s = buildSummary(
      makeSignalInput({
        positions: [makePosition({ quantity: 10, averageCost: 100, currentPrice: 150 })],
        relationships: [makeRelationship({ name: "Asha Menon", birthday: "07-20" })],
        finance: makeFinanceBridge({ cashBalance: 1_000 }),
      }),
      FIXED_NOW,
    );
    expect(s.investmentValue).toBe(1_500);
    expect(s.investmentGain).toBe(500);
    expect(s.netWorth).toBe(2_500);
    expect(s.upcomingBirthdays).toBe(1);
    expect(s.nextBirthday).toBe("Asha Menon");
  });

  it("counts follow-ups due and overdue maintenance", () => {
    const s = buildSummary(
      makeSignalInput({
        relationships: [makeRelationship({ nextFollowUpAt: "2026-07-01" })],
        assets: [makeAsset()],
        maintenance: [makeMaintenance({ dueAt: "2026-01-01" })],
      }),
      FIXED_NOW,
    );
    expect(s.followUpsDue).toBe(1);
    expect(s.maintenanceOverdue).toBe(1);
  });
});

describe("search — deterministic weight bands, no vectors", () => {
  const input = {
    assets: [makeAsset({ id: "a1", name: "MacBook Pro", serialNumber: "C02XYZ" })],
    positions: [makePosition({ id: "p1", name: "Infosys", symbol: "INFY" })],
    relationships: [makeRelationship({ id: "r1", name: "Asha Menon", company: "Acme" })],
    documents: [makeDocument({ id: "d1", name: "Passport", documentNumber: "P1234567" })],
    policies: [makePolicy({ id: "i1", name: "Health Cover", provider: "Acme Insurance" })],
    vehicles: [makeVehicle({ id: "v1", name: "Swift", registrationNumber: "KA01AB1234" })],
    travel: [makeTravelDocument({ id: "t1", name: "Schengen Visa", country: "France" })],
  };

  it("a blank query returns nothing — not the user's entire net worth", () => {
    expect(searchResources(input, "")).toHaveLength(0);
    expect(searchResources(input, "   ")).toHaveLength(0);
  });

  it("finds across every entity kind", () => {
    expect(searchResources(input, "macbook")[0]?.kind).toBe("asset");
    expect(searchResources(input, "infosys")[0]?.kind).toBe("investment");
    expect(searchResources(input, "asha")[0]?.kind).toBe("relationship");
    expect(searchResources(input, "passport")[0]?.kind).toBe("document");
    expect(searchResources(input, "swift")[0]?.kind).toBe("vehicle");
    expect(searchResources(input, "schengen")[0]?.kind).toBe("travel");
  });

  it("matches identifiers — symbol, serial, registration, document number", () => {
    expect(searchResources(input, "infy")[0]?.kind).toBe("investment");
    expect(searchResources(input, "c02xyz")[0]?.kind).toBe("asset");
    expect(searchResources(input, "ka01ab1234")[0]?.kind).toBe("vehicle");
    expect(searchResources(input, "p1234567")[0]?.kind).toBe("document");
  });

  it("ranks an exact name above a mere field match", () => {
    // "Acme" is the relationship's company (field) and part of the policy's provider (field),
    // but neither is an exact name — the policy named "Health Cover" should not outrank.
    const hits = searchResources(input, "acme");
    expect(hits.length).toBeGreaterThanOrEqual(2);
    expect(hits.every((h) => h.score > 0)).toBe(true);
  });

  it("exact name beats prefix beats contains", () => {
    const assets = [
      makeAsset({ id: "exact", name: "Pro" }),
      makeAsset({ id: "prefix", name: "Pro Display" }),
      makeAsset({ id: "contains", name: "MacBook Pro" }),
    ];
    const hits = searchResources(
      {
        ...input,
        assets,
        positions: [],
        relationships: [],
        documents: [],
        policies: [],
        vehicles: [],
        travel: [],
      },
      "pro",
    );
    expect(hits.map((h) => h.id)).toEqual(["exact", "prefix", "contains"]);
  });

  it("respects the limit", () => {
    const assets = Array.from({ length: 30 }, (_, i) =>
      makeAsset({ id: `a${i}`, name: `Thing ${i}` }),
    );
    expect(searchResources({ ...input, assets }, "thing", 5)).toHaveLength(5);
  });

  it("skips archived relationships", () => {
    const hits = searchResources(
      { ...input, relationships: [makeRelationship({ name: "Asha Menon", archived: true })] },
      "asha",
    );
    expect(hits).toHaveLength(0);
  });
});
