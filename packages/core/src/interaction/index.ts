/**
 * @myos/core/interaction (Stage 9) — natural-language interaction + Pomodoro cycles. PURE
 * and dependency-free (only the existing task parser). Maps text/voice to a structured
 * Intent the server resolves against real data and executes through EXISTING capabilities;
 * AI (server-side) is only a fallback for phrasings the deterministic parser misses. The
 * Pomodoro logic sequences phases on top of the real Focus engine. No AI is the source of
 * truth; no second timer, task, or command system.
 */
export * from "./types";
export * from "./parser";
export * from "./pomodoro";
export * from "./speech";
