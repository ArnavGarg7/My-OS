/**
 * Event Intelligence Engine — tunable constants (Sprint 6.1). Pure data. Changing a weight here
 * re-tunes ranking/notification behaviour with no code change. No AI, no randomness.
 */
import type { ContextWindow, NotificationLevel, SignalCategory, SignalSeverity } from "./types";

/** Category importance (0..1). Risks + deadlines matter most; environment least. */
export const CATEGORY_IMPORTANCE: Record<SignalCategory, number> = {
  risks: 1.0,
  deadlines: 0.95,
  health: 0.85,
  opportunities: 0.8,
  planning: 0.7,
  productivity: 0.65,
  projects: 0.65,
  learning: 0.6,
  finance: 0.6,
  resources: 0.5,
  automation: 0.45,
  environment: 0.35,
  external: 0.35,
};

/** Severity → impact (0..1). */
export const SEVERITY_IMPACT: Record<SignalSeverity, number> = {
  critical: 1.0,
  high: 0.8,
  medium: 0.55,
  low: 0.35,
  info: 0.15,
};

/** Window → urgency baseline (0..1). Nearer horizons are more urgent. */
export const WINDOW_URGENCY: Record<ContextWindow, number> = {
  current: 1.0,
  today: 0.8,
  tomorrow: 0.55,
  week: 0.35,
  long_term: 0.15,
};

/** Ranking weights (must sum to 1). */
export const RANKING_WEIGHTS = {
  importance: 0.3,
  urgency: 0.25,
  impact: 0.25,
  confidence: 0.12,
  recency: 0.08,
} as const;

/** Recency half-life in hours — a signal loses half its recency score after this long. */
export const RECENCY_HALFLIFE_HOURS = 12;

/** Priority thresholds (0..100) → notification level. */
export const NOTIFY_THRESHOLDS: { min: number; level: NotificationLevel }[] = [
  { min: 85, level: "critical" },
  { min: 68, level: "important" },
  { min: 50, level: "reminder" },
  { min: 32, level: "suggestion" },
  { min: 0, level: "silent" },
];

/** Default expiry per window, in hours (null = no expiry). */
export const WINDOW_EXPIRY_HOURS: Record<ContextWindow, number | null> = {
  current: 4,
  today: 16,
  tomorrow: 40,
  week: 168,
  long_term: null,
};

/** Aggregation: when ≥ this many same-category signals exist, collapse into one summary. */
export const AGGREGATION_THRESHOLD = 3;
