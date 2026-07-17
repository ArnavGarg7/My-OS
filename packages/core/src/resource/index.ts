/**
 * Resource & Relationship Platform (Sprint 4.3) — the deterministic system of record for
 * everything owned, managed and maintained.
 *
 * Public API, grouped by question:
 *  · What do I own?      `assets`, `valuation`, `investments`, `home`
 *  · What do I maintain? `maintenance`, `vehicles`
 *  · Who matters?        `relationships`, `interactions`, `birthdays`, `networking`
 *  · What can't I lose?  `documents`, `insurance`, `travel`
 *  · Roll-ups            `portfolio`, `statistics`, `forecasting`, `correlations`
 *  · Read models         `selectors` → `buildSummary`, `computeSignals`
 *  · Seams               `search`, `engine` (injected `newId`/`now`), `schemas`
 *
 * Extends — never replaces — Finance (2.11), Goals (2.12), Knowledge (4.1) and Life (4.2).
 * Finance owns money-in-motion and hands us liabilities/cash through `FinanceBridgeInput`;
 * this platform never recomputes a Finance number. Nothing derived is stored: net worth,
 * allocation, depreciation, relationship strength and every countdown are functions of the
 * rows and the clock. No AI, no randomness, no market APIs — prices are user-entered.
 */
export * from "./constants";
export * from "./types";
export * from "./dates";
export * from "./finance";
export * from "./investments";
export * from "./assets";
export * from "./valuation";
export * from "./home";
export * from "./maintenance";
export * from "./insurance";
export * from "./documents";
export * from "./vehicles";
export * from "./relationships";
export * from "./birthdays";
export * from "./interactions";
export * from "./networking";
export * from "./travel";
export * from "./forecasting";
export * from "./correlations";
export * from "./portfolio";
export * from "./statistics";
export * from "./search";
export * from "./selectors";
export * from "./engine";
export * from "./schemas";
/** Deterministic fixtures with a FIXED clock — consumed by the server + UI test suites. */
export * from "./fixtures";
