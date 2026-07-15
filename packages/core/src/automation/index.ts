/**
 * @myos/core/automation (Sprint 3.4) — Automation Engine & Rule-Based Workflow.
 *
 * A PLATFORM engine (like Timeline/Analytics/Notification/Decision) with NO feature
 * logic. Feature modules expose SIGNALS (triggers); automation owns execution. An
 * automation is Trigger → Conditions → Actions → Execution Policy. Pure — no React, no
 * DB, no browser, no tRPC, no side effects, no timers. Actions reference existing
 * services; the server executor dispatches them.
 */
export * from "./constants";
export * from "./types";
export * from "./schemas";
export * from "./triggers";
export * from "./conditions";
export * from "./actions";
export * from "./priority";
export * from "./scheduler";
export * from "./executor";
export * from "./validation";
export * from "./history";
export * from "./statistics";
export * from "./selectors";
export * from "./signals";
export * from "./parser";
export * from "./engine";
export * from "./builtins";
export * from "./fixtures";
