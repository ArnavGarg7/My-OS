/**
 * Event Intelligence Engine — types (Sprint 6.1, Phase 6). The deterministic layer that turns
 * meaningful environment changes into ranked, explainable **Signals**. Pure: no IO, no clock (all
 * time is passed in), no AI. Signals never mutate user data — they only inform the Chief.
 *
 * Pipeline: DomainEvent → generate → Signal → rank → aggregate → suppress → window → notify.
 */

/** The modules that publish events (watchers observe their frozen read models). */
export type EventSource =
  | "planner"
  | "calendar"
  | "task"
  | "health"
  | "timeline"
  | "knowledge"
  | "resource"
  | "goal"
  | "finance"
  | "notification"
  | "focus"
  | "project"
  | "journal"
  | "automation"
  | "external";

/** A normalized event — a fact about something that changed. The bus only transports these. */
export interface DomainEvent {
  id: string;
  source: EventSource;
  /** Dotted verb, e.g. "task.completed", "calendar.meeting_cancelled", "health.readiness_dropped". */
  kind: string;
  /** ISO timestamp the event occurred (passed in — never read from a clock here). */
  at: string;
  /** Structured, already-derived payload from the module's read model (never raw private text). */
  payload: Record<string, unknown>;
  /** Optional reference to the entity the event is about. */
  ref?: { module: string; id: string; label?: string } | undefined;
}

/** Signal taxonomy (spec §Signal Categories). */
export type SignalCategory =
  | "productivity"
  | "planning"
  | "health"
  | "learning"
  | "projects"
  | "finance"
  | "resources"
  | "deadlines"
  | "opportunities"
  | "risks"
  | "automation"
  | "environment"
  | "external";

export type SignalSeverity = "info" | "low" | "medium" | "high" | "critical";

/** The time horizon a signal belongs to (spec §Context Windows). */
export type ContextWindow = "current" | "today" | "tomorrow" | "week" | "long_term";

/** Whether/how strongly the user should be told (spec §Notification Intelligence). */
export type NotificationLevel = "silent" | "suggestion" | "reminder" | "important" | "critical";

export type SignalStatus = "active" | "expired" | "superseded" | "acknowledged";

/** A structured, human-readable justification for a signal's existence. */
export interface SignalExplanation {
  /** One-line headline ("Deadline risk"). */
  headline: string;
  /** The reasons that produced it ("No progress", "Five days remaining"). */
  reasons: string[];
  /** What it implies if ignored. */
  implication: string;
}

/**
 * An immutable signal. Deterministic given its inputs. Once created it is never edited — a change in
 * the world produces a NEW signal that may supersede this one.
 */
export interface Signal {
  id: string;
  source: EventSource;
  category: SignalCategory;
  severity: SignalSeverity;
  /** 0..1 — how sure the deterministic rules are (never AI-derived). */
  confidence: number;
  /** ISO timestamp the signal was generated (the triggering event's time). */
  createdAt: string;
  /** ISO timestamp after which the signal is obsolete (null = no expiry). */
  expiresAt: string | null;
  window: ContextWindow;
  explanation: SignalExplanation;
  /** Entity references the signal relates to. */
  relatedObjects: { module: string; id: string; label?: string }[];
  /** The id(s) of the event(s) that produced it (grounding + replay). */
  eventIds: string[];
  status: SignalStatus;
  /** Stable dedupe key: source+category+the thing it's about. */
  dedupeKey: string;
}

/** A signal with its computed ranking + notification decision. */
export interface RankedSignal extends Signal {
  ranking: SignalRanking;
  notify: NotificationLevel;
}

/** The deterministic ranking dimensions (spec §Signal Ranking Engine). */
export interface SignalRanking {
  importance: number; // 0..1 (from category weight)
  urgency: number; // 0..1 (from window + expiry)
  confidence: number; // 0..1 (mirrors the signal)
  recency: number; // 0..1 (newer = higher, relative to `now`)
  impact: number; // 0..1 (from severity)
  /** Weighted composite 0..100. */
  priority: number;
}

/** One step in a signal's audit/replay trail (spec §Signal Timeline). */
export interface SignalTimelineEntry {
  signalId: string;
  at: string;
  kind:
    | "event_received"
    | "signal_created"
    | "signal_ranked"
    | "recommendation_created"
    | "notified"
    | "acknowledged"
    | "expired"
    | "superseded";
  detail: string;
}
