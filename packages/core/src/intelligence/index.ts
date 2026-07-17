/**
 * Personal Intelligence Dashboard (Sprint 4.4) — the executive layer of My OS and the final
 * deterministic sprint before Phase 5 (AI).
 *
 * This module is COMPOSITION, not duplication. Every score it shows arrives already computed
 * by the module that owns it, carried in the `IntelligenceInput` the server fills from each
 * engine's read model. The intelligence core groups, bands, sorts and explains — it never
 * recomputes a business metric, and it imports no other core domain.
 *
 * Public API:
 *  · `buildDashboard`      — the whole executive view (summary/balance/wheel/scorecards/attention/trends)
 *  · `executiveSummary`    — structured (never prose) day snapshot
 *  · `lifeAreas`/`lifeBalance` — the eight-area rollup + weighted overall
 *  · `wheelOfLife`         — radar re-projection (lazy-loadable)
 *  · `scorecards`          — six grouped scorecards
 *  · `attentionItems`      — deterministic, explainable attention rules
 *  · `priorityMatrix`/`tomorrowPriorities` — importance × urgency
 *  · `trends`              — current-vs-previous trajectories
 *  · `milestones`/`achievements` — rolled-up, rule-based
 *  · `buildReviewSnapshot`/`generateReport` — immutable snapshots + md/json export
 *  · `collections`         — reference groupings (no data copied)
 *  · selectors `buildSummary`/`computeSignals`, `lifePortfolio` — the AI seams
 *  · `engine` (injected newId/now), `schemas`
 *
 * No AI, no embeddings, no ML, no heuristics beyond the explicit deterministic rules here.
 */
export * from "./constants";
export * from "./types";
export * from "./bands";
export * from "./life-areas";
export * from "./scorecards";
export * from "./wheel";
export * from "./attention";
export * from "./executive-summary";
export * from "./trends";
export * from "./priorities";
export * from "./milestones";
export * from "./achievements";
export * from "./reviews";
export * from "./reports";
export * from "./collections";
export * from "./correlations";
export * from "./dashboard";
export * from "./statistics";
export * from "./portfolio";
export * from "./selectors";
export * from "./engine";
export * from "./schemas";
export * from "./fixtures";
