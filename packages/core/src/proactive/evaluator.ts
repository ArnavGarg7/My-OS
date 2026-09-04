import { applyCooldown, DEFAULT_COOLDOWN_MINUTES } from "./cooldown";
import type {
  ProactiveCategory,
  ProactiveContext,
  ProactiveIntervention,
  ProactivePriority,
  ProactiveSignalInput,
  ProactiveWorkloadInput,
} from "./types";

/**
 * Proactive evaluator (Stage 6). Deterministic. Consumes already-computed intelligence
 * and decides which conditions deserve to interrupt the user — grounded, thresholded,
 * deduped, cooldown-aware, priority-ranked, and capped so one high-value intervention
 * wins over five noisy ones. No AI, no randomness. If a condition cannot be explained
 * from real inputs, it is not surfaced. Insufficient evidence → silence.
 */

// ── Thresholds (every number lives here, explainable) ────────────────────────────────
/** A signal must be at least this notify-strength to interrupt proactively. */
const SIGNAL_MIN_NOTIFY = 3; // "important" (see NOTIFY_RANK)
/** …and at least this confident, so we never interrupt on a weak guess. */
const SIGNAL_MIN_CONFIDENCE = 0.5;
/** Actionable decisions blocking work — surface at/above this count. */
const DECISION_THRESHOLD = 3;
/** Inbox: surface at this unread count, or fewer if the oldest has aged past AGE. */
const INBOX_THRESHOLD = 10;
const INBOX_SOFT_THRESHOLD = 5;
const INBOX_AGE_MINUTES = 24 * 60;
/** Default cap on simultaneous interventions. */
const DEFAULT_MAX = 4;

const NOTIFY_RANK: Record<ProactiveSignalInput["notify"], number> = {
  silent: 0,
  suggestion: 1,
  reminder: 2,
  important: 3,
  critical: 4,
};

const PRIORITY_RANK: Record<ProactivePriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/** Map a signal's notify strength onto a proactive priority. */
function signalPriority(notify: ProactiveSignalInput["notify"]): ProactivePriority {
  if (notify === "critical") return "critical";
  if (notify === "important") return "high";
  if (notify === "reminder") return "medium";
  return "low";
}

/** Map a signal category onto a notification category (for the icon/type). */
function signalCategory(category: string): ProactiveCategory {
  switch (category) {
    case "opportunities":
      return "focus";
    case "risks":
      return "warning";
    case "planning":
      return "planner";
    case "productivity":
      return "focus";
    default:
      return "information";
  }
}

/** A grounded 0..100 score from priority + confidence, so ranking is deterministic. */
function scoreOf(priority: ProactivePriority, confidence: number): number {
  return Math.round(PRIORITY_RANK[priority] * 20 + Math.max(0, Math.min(1, confidence)) * 20);
}

// ── Behaviour builders ───────────────────────────────────────────────────────────────

/**
 * Signal-derived interventions. This single path covers deadline risk, a newly-opened
 * focus window, and meaningful external calendar changes, because the Signal Engine
 * (Sprint 6.1, fed by Predictions 6.2 + Connectors 6.4) already detects them. We only
 * decide which are strong + grounded + actionable enough to interrupt.
 */
function fromSignals(signals: readonly ProactiveSignalInput[]): ProactiveIntervention[] {
  const out: ProactiveIntervention[] = [];
  for (const s of signals) {
    if (NOTIFY_RANK[s.notify] < SIGNAL_MIN_NOTIFY) continue;
    if (s.confidence < SIGNAL_MIN_CONFIDENCE) continue;
    // No dead buttons: a non-critical signal must ground to a real action to interrupt.
    if (!s.action && s.notify !== "critical") continue;

    const priority = signalPriority(s.notify);
    const kind = classifySignal(s);
    out.push({
      kind,
      category: signalCategory(s.category),
      priority,
      title: s.headline,
      reason: s.implication || s.reasons[0] || s.headline,
      detail: s.reasons.slice(0, 4),
      dedupeKey: `proactive:signal:${s.dedupeKey}`,
      action: s.action,
      confidence: s.confidence,
      score: scoreOf(priority, s.confidence),
      ttlMinutes: ttlFromExpiry(s.expiresAt),
    });
  }
  return out;
}

/** Give the signal a Stage-6 behaviour label for the UI (best-effort, from its shape). */
function classifySignal(s: ProactiveSignalInput): ProactiveIntervention["kind"] {
  const h = s.headline.toLowerCase();
  if (h.includes("focus") && (h.includes("window") || h.includes("free"))) return "focus_window";
  if (h.includes("deadline") || h.includes("due") || h.includes("at risk")) return "deadline_risk";
  if (s.category === "planning" && (h.includes("meeting") || h.includes("calendar"))) {
    return "calendar_change";
  }
  return "signal";
}

/** Minutes-to-expiry as a TTL, floored sensibly (default 8h, min 30m, max 24h). */
function ttlFromExpiry(expiresAt: string | null): number {
  if (!expiresAt) return 8 * 60;
  const mins = Math.round((Date.parse(expiresAt) - Date.now()) / 60_000);
  if (Number.isNaN(mins)) return 8 * 60;
  return Math.max(30, Math.min(24 * 60, mins));
}

/**
 * Overloaded day — from Stage 5 workload realism. Only when genuinely overloaded AND
 * there is something to move (otherwise the recommendation isn't actionable). Grounded
 * in real capacity, real commitments, real learned estimation bias.
 */
function fromWorkload(w: ProactiveWorkloadInput | null): ProactiveIntervention | null {
  if (!w || !w.overloaded || w.deferSuggestions.length === 0) return null;
  const confidence = w.confidenceLevel === "unknown" || w.confidenceLevel === "low" ? 0.5 : 0.75;
  const priority: ProactivePriority = "high";
  return {
    kind: "overloaded_day",
    category: "warning",
    priority,
    title: w.headline || "Your day is overloaded",
    reason: `Expected work (${w.expectedMinutes}m) exceeds what fits (${w.realisticCapacityMinutes}m) by ${w.overBy}m.`,
    detail: w.reasons.slice(0, 4),
    // The day is a stable condition; the key is the date so it dedups within the day.
    dedupeKey: `proactive:overloaded-day:${new Date().toISOString().slice(0, 10)}`,
    action: { kind: "navigate", href: "/planner", label: "Review plan" },
    confidence,
    score: scoreOf(priority, confidence),
    ttlMinutes: 6 * 60,
  };
}

/** Stale actionable decisions blocking planned work. */
function fromDecisions(d: ProactiveContext["decisions"]): ProactiveIntervention | null {
  if (d.actionableCount < DECISION_THRESHOLD) return null;
  const priority: ProactivePriority = "medium";
  const confidence = 0.9; // a count of real pending decisions — high certainty
  return {
    kind: "stale_decisions",
    category: "information",
    priority,
    title: "Decisions need attention",
    reason: `${d.actionableCount} actionable decisions are waiting and may be blocking planned work.`,
    detail: [
      `${d.actionableCount} decisions are pending and unexpired.`,
      ...(d.oldestAgeMinutes && d.oldestAgeMinutes >= 60
        ? [`The oldest has been waiting ${Math.round(d.oldestAgeMinutes / 60)}h.`]
        : []),
    ],
    dedupeKey: `proactive:stale-decisions:${d.actionableCount}`,
    action: { kind: "navigate", href: "/today#morning-recommendation", label: "Review decisions" },
    confidence,
    score: scoreOf(priority, confidence),
    ttlMinutes: 12 * 60,
  };
}

/** Inbox accumulation — a deterministic, explainable threshold (never every item). */
function fromInbox(inbox: ProactiveContext["inbox"]): ProactiveIntervention | null {
  const aged =
    inbox.unread >= INBOX_SOFT_THRESHOLD &&
    inbox.oldestAgeMinutes !== null &&
    inbox.oldestAgeMinutes >= INBOX_AGE_MINUTES;
  if (inbox.unread < INBOX_THRESHOLD && !aged) return null;
  const priority: ProactivePriority = "low";
  const confidence = 0.9;
  return {
    kind: "inbox_backlog",
    category: "information",
    priority,
    title: "Inbox needs processing",
    reason: `${inbox.unread} items are waiting in your inbox.`,
    detail: [
      `${inbox.unread} uncaptured items (threshold ${INBOX_THRESHOLD}).`,
      ...(aged ? ["The oldest has been sitting over a day."] : []),
    ],
    // Bucket the count so it dedups across small changes but re-surfaces on real growth.
    dedupeKey: `proactive:inbox-backlog:${Math.floor(inbox.unread / 5) * 5}`,
    action: { kind: "navigate", href: "/inbox", label: "Process inbox" },
    confidence,
    score: scoreOf(priority, confidence),
    ttlMinutes: 12 * 60,
  };
}

/**
 * Evaluate one deterministic proactive cycle. Returns the interventions that survived
 * thresholds, cooldown, dedup-by-key, and the simultaneous-cap — highest score first.
 */
export function evaluateProactive(ctx: ProactiveContext): ProactiveIntervention[] {
  if (!ctx.enabled) return [];

  const candidates: ProactiveIntervention[] = [
    ...fromSignals(ctx.signals),
    fromWorkload(ctx.workload),
    fromDecisions(ctx.decisions),
    fromInbox(ctx.inbox),
  ].filter((x): x is ProactiveIntervention => x !== null);

  // Collapse any accidental key collisions to the highest-scoring one (belt-and-braces).
  const byKey = new Map<string, ProactiveIntervention>();
  for (const c of candidates) {
    const prev = byKey.get(c.dedupeKey);
    if (!prev || c.score > prev.score) byKey.set(c.dedupeKey, c);
  }

  const afterCooldown = applyCooldown(
    [...byKey.values()],
    ctx.recentlyResolved,
    ctx.now,
    ctx.cooldownMinutes ?? DEFAULT_COOLDOWN_MINUTES,
  );

  return afterCooldown
    .sort((a, b) => b.score - a.score || rankGap(a, b))
    .slice(0, ctx.maxInterventions ?? DEFAULT_MAX);
}

/** Deterministic tie-break so equal scores always order identically. */
function rankGap(a: ProactiveIntervention, b: ProactiveIntervention): number {
  const p = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
  return p !== 0 ? p : a.dedupeKey.localeCompare(b.dedupeKey);
}
