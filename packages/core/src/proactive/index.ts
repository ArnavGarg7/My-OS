/**
 * @myos/core/proactive (Stage 6) — the Always-on / Proactive OS evaluator.
 *
 * A PURE, dependency-free orchestration layer. It consumes intelligence the existing
 * deterministic engines already produced — ranked Signals (6.1, fed by Predictions 6.2
 * and Connectors 6.4), Stage 5 workload realism, actionable Decisions, inbox state —
 * and decides which conditions deserve to interrupt the user. Deterministic, grounded,
 * thresholded, deduped, cooldown-aware. It owns no data and performs no IO; the server
 * assembles its context and maps its output onto the Notification platform.
 */
export * from "./types";
export * from "./cooldown";
export * from "./evaluator";
