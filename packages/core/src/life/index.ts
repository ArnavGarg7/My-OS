/**
 * @myos/core/life (Sprint 4.2) — the Personal Life Platform.
 *
 * A deterministic life-management layer unifying Habits, Routines, Advanced Health
 * (medication/supplements/workouts/injuries/body/appointments), Readiness expansion and
 * Personal Growth. Extends — never replaces — Health (2.9), Goals (2.12) and Knowledge
 * (4.1). Pure: no React, no DB, no tRPC, no AI, no randomness. Every metric is derived +
 * explainable; Phase 5's AI layer consumes these systems rather than implementing them.
 *
 * Tasks: what to do today? · Goals: what to achieve? · Habits: what to repeat? ·
 * Routines: how the day flows? · Health: am I capable of performing at my best?
 */
export * from "./constants";
export * from "./types";
export * from "./schemas";
export * from "./streaks";
export * from "./habits";
export * from "./routines";
export * from "./adherence";
export * from "./scheduling";
export * from "./planner";
export * from "./workouts";
export * from "./injuries";
export * from "./medication";
export * from "./supplements";
export * from "./appointments";
export * from "./body-composition";
export * from "./health-signals";
export * from "./readiness";
export * from "./recovery";
export * from "./reviews";
export * from "./correlations";
export * from "./portfolio";
export * from "./statistics";
export * from "./selectors";
export * from "./engine";
export * from "./fixtures";
