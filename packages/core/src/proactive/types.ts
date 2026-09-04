/**
 * Proactive OS evaluator types (Stage 6). The proactive layer is an ORCHESTRATION /
 * EVALUATION layer, not a new source of truth: it consumes intelligence that the
 * existing deterministic engines already computed (ranked Signals, workload realism,
 * actionable Decisions, inbox state) and decides *which* deserve to interrupt the user.
 *
 * This module is PURE and dependency-free — it imports no other domain. All inputs are
 * plain projections assembled by the server (which owns the reads + the action
 * resolver), so the same evaluation can power web, notifications, voice, or widgets.
 * The output is a UI-independent `ProactiveIntervention`; the server maps it onto the
 * existing Notification platform (one engine, one dedup, one lifecycle, one surface).
 */

/** A resolved, executable target — mirrors the intelligence action resolver's shape. */
export type ProactiveAction =
  | { kind: "focus"; taskId: string; label: string }
  | { kind: "navigate"; href: string; label: string };

/** The proactive behaviours Stage 6 ships. Each is grounded in real, existing intelligence. */
export type ProactiveKind =
  | "deadline_risk"
  | "focus_window"
  | "overloaded_day"
  | "calendar_change"
  | "stale_decisions"
  | "inbox_backlog"
  | "signal";

/** Priority of an intervention — drives surfacing + notification priority. */
export type ProactivePriority = "critical" | "high" | "medium" | "low";

/** Notification category (mirrors the Notification engine's `type` enum, kept as a plain literal). */
export type ProactiveCategory =
  "alert" | "warning" | "information" | "calendar" | "focus" | "planner";

/**
 * A candidate intervention the OS believes deserves the user's attention. Everything is
 * grounded — `reason` + `detail` explain WHY, `action` is a real executable target (or
 * null → explanation only, never a fake CTA), and `dedupeKey` is stable per underlying
 * condition (so a repeat of the same condition is deduped, a materially-changed one is new).
 */
export interface ProactiveIntervention {
  kind: ProactiveKind;
  category: ProactiveCategory;
  priority: ProactivePriority;
  title: string;
  /** One-line justification ("Your 2 PM meeting was cancelled — a 90-minute window opened"). */
  reason: string;
  /** Grounded evidence lines answering "Why am I seeing this?". */
  detail: string[];
  /** Stable key identifying the underlying condition, for dedup + cooldown. */
  dedupeKey: string;
  /** The executable target, or null when nothing grounds to a safe action. */
  action: ProactiveAction | null;
  /** Deterministic confidence 0..1 (never AI-derived). */
  confidence: number;
  /** Composite score 0..100 used to rank + cap simultaneous interventions. */
  score: number;
  /** Minutes until the intervention is stale if never seen. */
  ttlMinutes: number;
}

/**
 * A signal projected into the shape the evaluator needs. The server builds these from
 * the ranked Signals the Signal Engine (Sprint 6.1) already produced — including the
 * prediction-fed deadline forecasts and the free-focus-window / calendar-change signals —
 * and pre-resolves each signal's action via the existing intelligence action resolver.
 */
export interface ProactiveSignalInput {
  id: string;
  /** Signal category ("productivity" | "planning" | "risks" | "opportunities" | …). */
  category: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  /** How strongly the Signal Engine says the user should be told. */
  notify: "silent" | "suggestion" | "reminder" | "important" | "critical";
  /** Ranking composite 0..100. */
  priorityScore: number;
  confidence: number;
  headline: string;
  reasons: string[];
  implication: string;
  /** Stable per-condition key from the signal. */
  dedupeKey: string;
  /** Pre-resolved executable target (server-resolved), or null. */
  action: ProactiveAction | null;
  expiresAt: string | null;
}

/** Workload realism projection (from Stage 5 `assessWorkload` / `adaptation.todayPlan`). */
export interface ProactiveWorkloadInput {
  overloaded: boolean;
  overBy: number;
  expectedMinutes: number;
  realisticCapacityMinutes: number;
  reasons: string[];
  headline: string;
  confidenceLevel: "unknown" | "low" | "medium" | "high" | "very_high";
  deferSuggestions: { id: string; title: string; estimateMinutes: number }[];
}

/** A recently resolved (dismissed/completed) condition — powers cooldown. */
export interface ResolvedCondition {
  dedupeKey: string;
  /** ISO time the user dismissed/completed it. */
  resolvedAt: string;
  status: "dismissed" | "completed";
}

/** Everything the evaluator needs for one deterministic proactive cycle. */
export interface ProactiveContext {
  now: Date;
  /** When false the evaluator returns nothing (user turned proactivity off). */
  enabled: boolean;
  signals: ProactiveSignalInput[];
  workload: ProactiveWorkloadInput | null;
  decisions: { actionableCount: number; oldestAgeMinutes: number | null };
  inbox: { unread: number; oldestAgeMinutes: number | null };
  /** Dismissed/completed conditions to suppress during their cooldown. */
  recentlyResolved: ResolvedCondition[];
  /** Cooldown after a dismissal before the same condition may resurface (default 240). */
  cooldownMinutes?: number;
  /** Cap on simultaneous interventions — prefer one high-value over many (default 4). */
  maxInterventions?: number;
}
