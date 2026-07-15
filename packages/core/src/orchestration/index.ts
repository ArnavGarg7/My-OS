/**
 * @myos/core/orchestration (Sprint 3.5) — Cross-Module Scheduling & Recovery.
 *
 * The final Phase-3 platform layer. It makes every existing deterministic engine
 * cooperate: a trigger fans out through a fixed, acyclic pipeline of module steps, each
 * running an EXISTING service in dependency order, with deterministic recovery on
 * failure. Pure — no React, no DB, no browser, no tRPC, no side effects, no timers.
 * Orchestration owns coordination only; every module still owns its own domain.
 */
export * from "./constants";
export * from "./types";
export * from "./schemas";
export * from "./dependency-graph";
export * from "./pipeline";
export * from "./execution-plan";
export * from "./scheduler";
export * from "./recovery";
export * from "./conflicts";
export * from "./orchestrator";
export * from "./selectors";
export * from "./validation";
export * from "./signals";
export * from "./engine";
export * from "./fixtures";
