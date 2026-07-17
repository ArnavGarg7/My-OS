import { describe, expect, it } from "vitest";
import {
  annualPremium,
  claimCount,
  coverageByType,
  daysUntilRenewal,
  expiredPolicies,
  isPolicyExpired,
  totalCoverage,
  upcomingRenewals,
} from "./insurance";
import {
  daysUntilExpiry,
  documentHealth,
  documentsByType,
  expiringDocuments,
  hasExpiry,
  isDocumentExpired,
} from "./documents";
import {
  activeVisas,
  countries,
  expiringTravelDocuments,
  isTravelDocumentExpired,
  passports,
  travelByType,
} from "./travel";
import { FIXED_NOW, makeDocument, makePolicy, makeTravelDocument } from "./fixtures";

describe("insurance", () => {
  it("counts days to renewal and flags expiry", () => {
    expect(daysUntilRenewal(makePolicy({ expiresAt: "2026-07-26" }), FIXED_NOW)).toBe(10);
    expect(isPolicyExpired(makePolicy({ expiresAt: "2026-07-01" }), FIXED_NOW)).toBe(true);
    expect(isPolicyExpired(makePolicy({ expiresAt: "2027-01-01" }), FIXED_NOW)).toBe(false);
  });

  it("lists renewals inside the 30-day window, soonest first", () => {
    const policies = [
      makePolicy({ id: "far", expiresAt: "2027-01-01" }),
      makePolicy({ id: "soon", expiresAt: "2026-08-01" }),
      makePolicy({ id: "sooner", expiresAt: "2026-07-20" }),
    ];
    const found = upcomingRenewals(policies, FIXED_NOW);
    expect(found.map((r) => r.id)).toEqual(["sooner", "soon"]);
  });

  it("includes already-lapsed policies in renewals — they need action most", () => {
    const found = upcomingRenewals([makePolicy({ expiresAt: "2026-01-01" })], FIXED_NOW);
    expect(found[0]?.expired).toBe(true);
  });

  it("counts only live policies toward coverage", () => {
    const policies = [
      makePolicy({ id: "live", coverageAmount: 500_000, expiresAt: "2027-01-01" }),
      makePolicy({ id: "dead", coverageAmount: 900_000, expiresAt: "2026-01-01" }),
    ];
    expect(totalCoverage(policies, FIXED_NOW)).toBe(500_000);
    expect(expiredPolicies(policies, FIXED_NOW).map((p) => p.id)).toEqual(["dead"]);
  });

  it("groups live coverage by type", () => {
    const policies = [
      makePolicy({ id: "h", type: "health", coverageAmount: 100, expiresAt: "2027-01-01" }),
      makePolicy({ id: "v", type: "vehicle", coverageAmount: 200, expiresAt: "2027-01-01" }),
      makePolicy({ id: "x", type: "health", coverageAmount: 300, expiresAt: "2026-01-01" }),
    ];
    expect(coverageByType(policies, FIXED_NOW)).toEqual({ health: 100, vehicle: 200 });
  });

  it("annualises premiums across cadences", () => {
    const policies = [
      makePolicy({ id: "a", premium: 1200, premiumIntervalMonths: 12, expiresAt: "2027-01-01" }),
      makePolicy({ id: "b", premium: 100, premiumIntervalMonths: 1, expiresAt: "2027-01-01" }),
    ];
    expect(annualPremium(policies, FIXED_NOW)).toBe(2400);
  });

  it("counts claims across policies", () => {
    expect(claimCount([makePolicy({ claims: ["a", "b"] }), makePolicy({ claims: [] })])).toBe(2);
  });
});

describe("documents", () => {
  it("handles documents with no expiry", () => {
    const d = makeDocument({ expiresAt: null });
    expect(hasExpiry(d)).toBe(false);
    expect(isDocumentExpired(d, FIXED_NOW)).toBe(false);
    expect(daysUntilExpiry(d, FIXED_NOW)).toBeNull();
  });

  it("flags expired documents", () => {
    expect(isDocumentExpired(makeDocument({ expiresAt: "2020-01-01" }), FIXED_NOW)).toBe(true);
  });

  it("uses a 90-day window — identity renewals are slow", () => {
    const soon = makeDocument({ id: "soon", expiresAt: "2026-09-01" });
    const far = makeDocument({ id: "far", expiresAt: "2027-06-01" });
    expect(expiringDocuments([soon, far], FIXED_NOW).map((r) => r.id)).toEqual(["soon"]);
  });

  it("excludes never-expiring documents from the renewal list", () => {
    expect(expiringDocuments([makeDocument({ expiresAt: null })], FIXED_NOW)).toHaveLength(0);
  });

  it("counts by type", () => {
    const docs = [
      makeDocument({ id: "a", type: "passport" }),
      makeDocument({ id: "b", type: "pan" }),
      makeDocument({ id: "c", type: "passport" }),
    ];
    expect(documentsByType(docs)).toEqual({ passport: 2, pan: 1 });
  });

  it("document health is the share of dated documents still valid", () => {
    const docs = [
      makeDocument({ id: "ok", expiresAt: "2030-01-01" }),
      makeDocument({ id: "dead", expiresAt: "2020-01-01" }),
      // Undated documents cannot be unhealthy — they are excluded entirely.
      makeDocument({ id: "undated", expiresAt: null }),
    ];
    expect(documentHealth(docs, FIXED_NOW)).toBe(50);
  });

  it("an empty or fully-undated catalogue is trivially healthy", () => {
    expect(documentHealth([], FIXED_NOW)).toBe(100);
    expect(documentHealth([makeDocument({ expiresAt: null })], FIXED_NOW)).toBe(100);
  });
});

describe("travel documents", () => {
  it("flags expiry and lists renewals in the 30-day window", () => {
    expect(
      isTravelDocumentExpired(makeTravelDocument({ expiresAt: "2020-01-01" }), FIXED_NOW),
    ).toBe(true);
    const docs = [
      makeTravelDocument({ id: "soon", expiresAt: "2026-08-01" }),
      makeTravelDocument({ id: "far", expiresAt: "2027-01-01" }),
    ];
    expect(expiringTravelDocuments(docs, FIXED_NOW).map((r) => r.id)).toEqual(["soon"]);
  });

  it("filters passports and live visas", () => {
    const docs = [
      makeTravelDocument({ id: "p", type: "passport" }),
      makeTravelDocument({ id: "v", type: "visa", expiresAt: "2027-01-01" }),
      makeTravelDocument({ id: "dead", type: "visa", expiresAt: "2020-01-01" }),
    ];
    expect(passports(docs).map((d) => d.id)).toEqual(["p"]);
    expect(activeVisas(docs, FIXED_NOW).map((d) => d.id)).toEqual(["v"]);
  });

  it("lists distinct countries, sorted, ignoring blanks", () => {
    const docs = [
      makeTravelDocument({ id: "a", country: "Japan" }),
      makeTravelDocument({ id: "b", country: "France" }),
      makeTravelDocument({ id: "c", country: "Japan" }),
      makeTravelDocument({ id: "d", country: "" }),
    ];
    expect(countries(docs)).toEqual(["France", "Japan"]);
  });

  it("counts by type", () => {
    expect(travelByType([makeTravelDocument({ type: "visa" })])).toEqual({ visa: 1 });
  });
});
