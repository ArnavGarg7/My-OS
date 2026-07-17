import "server-only";

/**
 * Server life domain (Sprint 4.2). Bridges the pure LifePlatform engine + derivations
 * with persistence. Extends — never replaces — Health (2.9) and Goals (2.12). Every
 * derived view (readiness/portfolio/statistics/correlations/signals) recomputes from
 * stored rows. AI-integration seams: summary(), signals(), portfolio(), timeline.
 */
export { lifeRouter } from "./router";
export * as lifeService from "./service";
export { signals as lifeSignals } from "./signals";
export { summary as lifeSummary, readiness as lifeReadiness } from "./summary";
export { routineBlocks as lifeRoutineBlocks } from "./planner";
