import "server-only";

/**
 * Server intelligence domain (Sprint 4.4, Phase 4 finale). The executive layer — COMPOSITION
 * over every other module's read model, never duplication. `composer.ts` is the single place
 * the dashboard reads the owning modules; the pure core groups/bands/sorts the result. Only
 * config (layout, collections) and immutable snapshots (reviews, reports) are persisted; every
 * score, trend, scorecard and attention item is recomputed on read.
 *
 * AI-integration seams: summary(), signals(), portfolio(), attention(), reports().
 */
export { intelligenceRouter } from "./router";
export * as intelligenceService from "./service";
export { signals as intelligenceSignals, summary as intelligenceSummary } from "./summary";
export { attention as intelligenceAttention, tomorrow as intelligenceTomorrow } from "./priorities";
