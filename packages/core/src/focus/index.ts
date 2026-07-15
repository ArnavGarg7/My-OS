/**
 * @myos/core/focus (Sprint 3.2) — Focus Mode & Deep Work.
 *
 * The pure, deterministic execution layer. It composes the existing engines
 * (Planner/Task/Calendar/Health/Project/Decision/Tomorrow/Analytics/Timeline) and
 * owns only focus-session execution state. No React, no browser timers, no DB, no
 * tRPC, no side effects. Every value is derived from stored timestamps + a `now`.
 */
export * from "./constants";
export * from "./types";
export * from "./schemas";
export * from "./session";
export * from "./timer";
export * from "./breaks";
export * from "./interruptions";
export * from "./metrics";
export * from "./readiness";
export * from "./selector";
export * from "./recommendations";
export * from "./signals";
export * from "./summary";
export * from "./parser";
export * from "./engine";
export * from "./fixtures";
