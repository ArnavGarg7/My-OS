/**
 * Analytics domain (Sprint 2.14) — the final deterministic layer of My OS. It
 * consumes the immutable Timeline + domain snapshots and derives productivity,
 * focus, planner, calendar, health, finance, goal, project, journal and timeline
 * metrics, plus trends, comparisons, forecasts, scores and full period reviews.
 * Analytics never owns data. No AI — every value is reproducible and testable.
 */
export * from "./constants";
export * from "./types";
export * from "./metrics";
export * from "./productivity";
export * from "./planner";
export * from "./health";
export * from "./finance";
export * from "./goals";
export * from "./projects";
export * from "./journal";
export * from "./timeline";
export * from "./trends";
export * from "./comparisons";
export * from "./forecasting";
export * from "./scoring";
export * from "./reviews";
export * from "./selectors";
export * from "./parser";
export * from "./engine";
export * from "./schemas";
