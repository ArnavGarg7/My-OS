import type {
  DeliveryChannel,
  EscalationLevel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
  ReminderWindow,
  ScheduleAction,
} from "./constants";

/**
 * Notification engine types (Sprint 3.3). A Notification is a deterministic record
 * that a module's signal warrants telling the user something. The engine owns the
 * lifecycle + delivery decision; it references source entities but never owns them.
 */
export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  /** Why this notification exists — deterministic, human-readable. */
  reason: string;
  /** The module that supplied the signal (e.g. "planner", "health"). */
  source: string;
  /** A stable key identifying the underlying condition, for deduplication. */
  dedupeKey: string;
  /** What triggered it + machine-readable condition/payload (automation-ready). */
  trigger: string;
  condition: string;
  payload: Record<string, unknown>;
  /** Optional link to the source entity so the UI can "open source". */
  sourceHref: string | null;
  createdAt: string; // ISO
  /** When it should first be delivered (ISO); null = deliver as soon as scheduled. */
  scheduledFor: string | null;
  deliveredAt: string | null;
  seenAt: string | null;
  snoozedUntil: string | null;
  snoozeCount: number;
  completedAt: string | null;
  /** When it expires if never seen (ISO). */
  expiresAt: string | null;
  /** Channels chosen at delivery time. */
  channels: DeliveryChannel[];
  escalation: EscalationLevel;
  updatedAt: string; // ISO
}

/** A draft supplied by a module signal (before the engine decides it should exist). */
export interface NotificationDraft {
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  reason: string;
  source: string;
  dedupeKey: string;
  trigger: string;
  condition: string;
  payload?: Record<string, unknown>;
  sourceHref?: string | null;
  scheduledFor?: string | null;
  expiresAt?: string | null;
  ttlMinutes?: number;
}

/** Per-category delivery preference. */
export interface CategoryPreference {
  type: NotificationType;
  enabled: boolean;
  desktop: boolean;
  push: boolean;
  sound: boolean;
  banner: boolean;
  persistent: boolean;
}

/** Quiet-hours window (local HH:MM). Overnight windows (start>end) supported. */
export interface QuietHours {
  enabled: boolean;
  start: string; // HH:MM
  end: string; // HH:MM
}

/** Global notification preferences. */
export interface NotificationPreferences {
  quietHours: QuietHours;
  workingHoursOnly: boolean;
  weekendSuppression: boolean;
  /** Global mute (Do Not Disturb). Critical still delivers. */
  muted: boolean;
  categories: CategoryPreference[];
}

/** The scheduler's decision for a single notification at a given `now`. */
export interface ScheduleDecision {
  action: ScheduleAction;
  deliverAt: string | null; // ISO — when it should deliver (for delay/queue)
  reason: string;
}

/** The delivery decision — which channels, given priority + preferences. */
export interface DeliveryDecision {
  deliver: boolean;
  channels: DeliveryChannel[];
  escalation: EscalationLevel;
  reason: string;
}

/** Deterministic signals surfaced to the Decision engine. */
export interface NotificationSignals {
  unread: number;
  queued: number;
  criticalOverdue: boolean;
  tooManyIgnored: boolean;
  repeatedSnoozes: boolean;
  muted: boolean;
  inQuietHours: boolean;
}

/** Compact summary for status bar / context panel / Morning. */
export interface NotificationSummary {
  unread: number;
  queued: number;
  active: number;
  muted: boolean;
  inQuietHours: boolean;
  topPriority: NotificationPriority | null;
}

/** Parsed reminder-window result. */
export interface ParsedReminder {
  window: ReminderWindow;
  minutes: number | null; // resolved minutes (null for tomorrow/unresolved custom)
}
